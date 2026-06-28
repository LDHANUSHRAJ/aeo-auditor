import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { AuditReport, BusinessInput } from "./types";

// Lazy singleton — only created when first used, so missing env vars at module
// load time don't crash the app (e.g. before .env.local is configured).
let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase is not configured. Create a .env.local file with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }
  _client = createClient(url, key);
  return _client;
}

// Save a lead (user info) as soon as they start an audit — no API key stored, ever.
// Silently fails so it never blocks the audit flow.
export async function saveLead(input: BusinessInput): Promise<void> {
  try {
    await getClient()
      .from("audit_leads")
      .insert([
        {
          email: input.email,
          business_name: input.businessName,
          website_url: input.websiteUrl,
          category: input.category,
          city: input.city,
        },
      ]);
  } catch {
    // Non-critical — don't surface to user
  }
}

// Save a completed audit report. Returns the generated report ID.
export async function saveReport(report: Omit<AuditReport, "id" | "created_at">): Promise<string> {
  const { data, error } = await getClient()
    .from("audit_reports")
    .insert([
      {
        business_name: report.business_name,
        website_url: report.website_url,
        category: report.category,
        city: report.city,
        competitors: report.competitors,
        queries: report.queries,
        score: report.score,
        fixes: report.fixes,
        competitor_stats: report.competitor_stats,
        queries_completed: report.queries_completed,
        queries_total: report.queries_total,
      },
    ])
    .select("id")
    .single();

  if (error) throw new Error(`Failed to save report: ${error.message}`);
  return data.id as string;
}

// Fetch a report by ID for the shareable report page
export async function getReport(id: string): Promise<AuditReport | null> {
  const { data, error } = await getClient()
    .from("audit_reports")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data as AuditReport;
}
