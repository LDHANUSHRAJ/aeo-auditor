// SEO scoring — deterministic, fully documented.
// Every weight can be explained in an interview.

import type {
  SerpQueryResult,
  LighthouseResult,
  SchemaPresence,
  OpenGraphPresence,
  SeoScore,
  SeoFixItem,
} from "./seoTypes";

// ── Scoring weights (must sum to 1.0) ────────────────────────────────────────
// SERP position carries the most weight — actually ranking is the SEO core signal.
// Lighthouse SEO is the technical foundation that enables ranking.
// Performance matters because slow pages get demoted by Google + time out AI crawlers.
// Structured data completeness is the shared bridge between SEO and AEO.
const W_SERP = 0.40;
const W_LH_SEO = 0.30;
const W_LH_PERF = 0.15;
const W_SCHEMA = 0.15;
// ─────────────────────────────────────────────────────────────────────────────

// SERP position → score conversion:
// Top 3 = excellent (85-100), top 10 = good (40-70), 11-20 = poor (5-30), not found = 0
function positionToScore(position: number | null): number {
  if (position === null) return 0;
  if (position === 1) return 100;
  if (position === 2) return 92;
  if (position === 3) return 85;
  if (position <= 5) return 72;
  if (position <= 10) return 50;
  if (position <= 15) return 25;
  return 10;
}

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

// Structured data completeness score (0-100)
function computeStructuredDataScore(
  schema: SchemaPresence | null,
  og: OpenGraphPresence | null
): number {
  let points = 0;
  const total = 7; // max points

  if (schema) {
    if (schema.hasLocalBusiness) points += 2; // highest value for local biz
    if (schema.hasReview) points += 1;
    if (schema.hasFAQPage) points += 1;
    if (schema.hasProduct || schema.hasOrganization) points += 1;
  }
  if (og) {
    if (og.hasTitle) points += 1;
    if (og.hasDescription && og.hasImage) points += 1;
  }

  return Math.round((points / total) * 100);
}

export function computeSeoScore(
  serpResults: SerpQueryResult[],
  lighthouse: LighthouseResult | null,
  schema: SchemaPresence | null,
  og: OpenGraphPresence | null
): SeoScore {
  // 1. SERP score — average position score across queries that returned results
  const validSerp = serpResults.filter((r) => !r.error);
  const serpScore = validSerp.length > 0
    ? Math.round(avg(validSerp.map((r) => positionToScore(r.targetPosition))))
    : 0;

  // 2. Lighthouse SEO score (already 0-100 from Lighthouse output)
  const lighthouseSeoScore = lighthouse && !lighthouse.timedOut
    ? lighthouse.seoScore
    : 0;

  // 3. Lighthouse Performance score
  const lighthousePerfScore = lighthouse && !lighthouse.timedOut
    ? lighthouse.performanceScore
    : 0;

  // 4. Structured data completeness
  const structuredDataScore = computeStructuredDataScore(schema, og);

  // Weighted overall
  const overall = Math.round(
    serpScore * W_SERP +
    lighthouseSeoScore * W_LH_SEO +
    lighthousePerfScore * W_LH_PERF +
    structuredDataScore * W_SCHEMA
  );

  return { overall, serpScore, lighthouseSeoScore, lighthousePerfScore, structuredDataScore };
}

// Deterministic fix list from SEO signals
export function generateSeoFixList(
  score: SeoScore,
  serpResults: SerpQueryResult[],
  lighthouse: LighthouseResult | null,
  schema: SchemaPresence | null,
  og: OpenGraphPresence | null
): SeoFixItem[] {
  const fixes: SeoFixItem[] = [];

  const notRankingCount = serpResults.filter((r) => r.targetPosition === null).length;
  const total = serpResults.length;

  if (notRankingCount > total * 0.5) {
    fixes.push({
      priority: "high",
      category: "serp",
      title: "Build topic authority for your core queries",
      description: `Your business doesn't appear in Google's top 20 for ${notRankingCount} of ${total} tested queries. Create dedicated landing pages that directly answer each query type with structured content (H1 → H2 → FAQ format).`,
    });
  }

  if (lighthouse && !lighthouse.timedOut) {
    if (!lighthouse.hasMetaDescription) {
      fixes.push({
        priority: "high",
        category: "technical",
        title: "Add meta descriptions to all key pages",
        description: "No meta description detected. Meta descriptions don't directly affect ranking but increase CTR from SERP pages by 5-10%. Google also uses them to understand page context.",
      });
    }
    if (lighthouse.seoScore < 70) {
      fixes.push({
        priority: "high",
        category: "technical",
        title: `Fix Lighthouse SEO failures (score: ${lighthouse.seoScore}/100)`,
        description: `Lighthouse flagged: ${lighthouse.failingAudits.slice(0, 4).join(", ")}. These are direct ranking factors that Google's crawler uses to evaluate page quality.`,
      });
    }
    if (lighthouse.performanceScore < 50) {
      fixes.push({
        priority: "high",
        category: "performance",
        title: `Improve page speed (Lighthouse Performance: ${lighthouse.performanceScore}/100)`,
        description: "Page speed is a confirmed Google ranking factor. Scores below 50 indicate issues with image optimization, render-blocking resources, or large JavaScript bundles. Use Next.js Image optimization and code splitting.",
      });
    }
  }

  if (!schema || (!schema.hasLocalBusiness && !schema.hasOrganization)) {
    fixes.push({
      priority: "high",
      category: "schema",
      title: "Add LocalBusiness or Organization schema.org markup",
      description: "No business-type structured data found. This is one of the highest-impact fixes for both Google SEO and AI answer-engine visibility — it's the same JSON-LD block that helps both.",
    });
  }

  if (!schema?.hasFAQPage) {
    fixes.push({
      priority: "medium",
      category: "schema",
      title: "Add FAQPage schema for your top questions",
      description: "FAQ schema enables rich results in Google (expandable Q&A in SERP) and signals question-answer relevance to AI assistants. Add a FAQ section to your site with schema markup.",
    });
  }

  if (!og || !og.hasTitle || !og.hasImage) {
    fixes.push({
      priority: "medium",
      category: "schema",
      title: "Complete Open Graph tags",
      description: "Missing og:title or og:image. OG tags are used by social platforms and AI scrapers to understand page content. Complete set: og:title, og:description, og:image, og:url.",
    });
  }

  if (score.serpScore < 30 && score.structuredDataScore > 60) {
    fixes.push({
      priority: "medium",
      category: "serp",
      title: "Build backlinks from local directories and press",
      description: "Your structured data is good but SERP positions are low — this typically indicates a backlink/authority deficit. Get listed on Justdial, Sulekha, IndiaMart, and request coverage from local news/blogs.",
    });
  }

  return fixes;
}
