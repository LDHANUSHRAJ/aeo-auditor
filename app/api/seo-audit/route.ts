import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { computeSeoScore, generateSeoFixList } from "@/lib/seoScoring";
import type {
  SerpQueryResult,
  SerpResult,
  LighthouseResult,
  SchemaPresence,
  OpenGraphPresence,
  SeoReport,
} from "@/lib/seoTypes";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

// Must be Node.js runtime — Lighthouse/Puppeteer cannot run on Edge
export const runtime = "nodejs";
export const maxDuration = 60;

// ── Supabase for SERP caching ─────────────────────────────────────────────────
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function queryHash(query: string) {
  return crypto.createHash("md5").update(query.toLowerCase().trim()).digest("hex");
}

async function getCachedSerp(query: string): Promise<SerpQueryResult | null> {
  const sb = getSupabase();
  if (!sb) return null;
  try {
    const { data } = await sb
      .from("serp_cache")
      .select("results_json, fetched_at")
      .eq("query_hash", queryHash(query))
      .gte("fetched_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .single();
    if (data) return { ...(data.results_json as SerpQueryResult), cached: true };
  } catch { /* cache miss */ }
  return null;
}

async function cacheSerp(query: string, result: SerpQueryResult) {
  const sb = getSupabase();
  if (!sb) return;
  try {
    await sb.from("serp_cache").upsert({
      query_hash: queryHash(query),
      query,
      results_json: result,
      fetched_at: new Date().toISOString(),
    });
  } catch { /* non-critical */ }
}

// ── Sub-system A: SERP Checker (Serper API, server-side) ─────────────────────
async function checkSerp(
  query: string,
  targetDomain: string
): Promise<SerpQueryResult> {
  // Check cache first to protect free quota (2500 searches/month)
  const cached = await getCachedSerp(query);
  if (cached) return cached;

  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) {
    return { query, targetPosition: null, results: [], cached: false, error: "SERPER_API_KEY not configured" };
  }

  try {
    const res = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ q: query, gl: "in", num: 20 }),
    });

    if (!res.ok) {
      return { query, targetPosition: null, results: [], cached: false, error: `Serper API error: ${res.status}` };
    }

    const data = await res.json();
    const organic: Array<{ position: number; title: string; link: string; snippet: string }> =
      data.organic ?? [];

    const clean = targetDomain.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];

    const results: SerpResult[] = organic.map((r) => {
      const domain = r.link.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
      return {
        position: r.position,
        title: r.title,
        url: r.link,
        domain,
        snippet: r.snippet ?? "",
        isTarget: domain === clean || domain.endsWith(`.${clean}`),
      };
    });

    const targetResult = results.find((r) => r.isTarget);
    const result: SerpQueryResult = {
      query,
      targetPosition: targetResult?.position ?? null,
      results: results.slice(0, 10),
      cached: false,
    };

    await cacheSerp(query, result);
    return result;
  } catch (err) {
    return {
      query,
      targetPosition: null,
      results: [],
      cached: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ── Sub-system B: HTML schema.org + OG checker (no Lighthouse needed for this) ──
async function checkHtmlSignals(url: string): Promise<{
  schema: SchemaPresence;
  og: OpenGraphPresence;
}> {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; AEOAuditor/1.0)" },
    signal: AbortSignal.timeout(10000),
  });
  const html = await res.text();
  const $ = cheerio.load(html);

  // Schema.org JSON-LD
  const schemaTypes: string[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const json = JSON.parse($(el).html() ?? "{}");
      const types = Array.isArray(json) ? json.map((j: { "@type"?: string }) => j["@type"]).filter(Boolean) : [json["@type"]].filter(Boolean);
      schemaTypes.push(...types);
    } catch { /* malformed JSON-LD */ }
  });

  const schema: SchemaPresence = {
    hasLocalBusiness: schemaTypes.some((t) => t === "LocalBusiness" || t === "Store" || t === "Restaurant"),
    hasProduct: schemaTypes.some((t) => t === "Product" || t === "Service"),
    hasReview: schemaTypes.some((t) => t === "Review" || t === "AggregateRating"),
    hasFAQPage: schemaTypes.some((t) => t === "FAQPage"),
    hasOrganization: schemaTypes.some((t) => t === "Organization" || t === "Corporation"),
    allTypes: schemaTypes,
  };

  // Open Graph
  const ogTags: Record<string, string> = {};
  $('meta[property^="og:"]').each((_, el) => {
    const prop = $(el).attr("property");
    const content = $(el).attr("content");
    if (prop && content) ogTags[prop] = content;
  });

  const og: OpenGraphPresence = {
    hasTitle: !!ogTags["og:title"],
    hasDescription: !!ogTags["og:description"],
    hasImage: !!ogTags["og:image"],
    tags: ogTags,
  };

  return { schema, og };
}

// ── Sub-system B2: Lighthouse audit ──────────────────────────────────────────
async function runLighthouse(_url: string): Promise<LighthouseResult> {
  // Lighthouse disabled until SEO module is re-enabled (puppeteer/chromium not installed)
  return {
    seoScore: 0,
    performanceScore: 0,
    hasMetaDescription: false,
    hasViewport: false,
    hasDocumentTitle: false,
    hasCanonical: false,
    failingAudits: [],
    timedOut: true,
    error: "Lighthouse not available in AEO-only mode",
  };
}

// ── Main handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const { queries, websiteUrl } = await req.json() as {
    queries: string[];
    websiteUrl: string;
  };

  if (!queries?.length || !websiteUrl) {
    return NextResponse.json({ error: "queries and websiteUrl are required" }, { status: 400 });
  }

  // Run SERP checks + HTML signals in parallel; Lighthouse separately (slower)
  const [serpResults, htmlSignals] = await Promise.all([
    Promise.all(queries.map((q) => checkSerp(q, websiteUrl))),
    checkHtmlSignals(websiteUrl).catch(() => null),
  ]);

  // Lighthouse runs after (it's the slow one — let SERP + HTML finish first)
  const lighthouse = await runLighthouse(websiteUrl);

  const schema = htmlSignals?.schema ?? null;
  const og = htmlSignals?.og ?? null;
  const score = computeSeoScore(serpResults, lighthouse, schema, og);
  const fixes = generateSeoFixList(score, serpResults, lighthouse, schema, og);

  const report: SeoReport = {
    score,
    serpResults,
    lighthouse: lighthouse.timedOut ? null : lighthouse,
    schema,
    openGraph: og,
    fixes,
    serpUnavailable: !process.env.SERPER_API_KEY,
    lighthouseUnavailable: lighthouse.timedOut,
  };

  return NextResponse.json(report);
}
