// Core types for the AEO + SEO Visibility Auditor
import type { SeoReport } from "./seoTypes";
export type { SeoReport };

export interface BusinessInput {
  businessName: string;
  websiteUrl: string;
  category: string;
  city: string;
  email: string;
  apiKey: string;
  competitors: string[]; // max 3
}

export type MentionPosition = "first" | "listed" | "passing_mention" | "not_mentioned";
export type MentionSentiment = "positive" | "neutral" | "negative" | "not_applicable";

// Parsed signals extracted from each Gemini response
export interface QuerySignal {
  query: string;
  rawResponse: string;
  mentioned: boolean;
  position: MentionPosition;
  sentiment: MentionSentiment;
  competitors_mentioned: string[];
  has_citation_signal: boolean;
  parseError?: string;
}

export type QueryStatus = "pending" | "running" | "done" | "failed" | "retrying";

export interface QueryResult {
  query: string;
  status: QueryStatus;
  signal?: QuerySignal;
  error?: string;
  retryCount: number;
}

// Scoring breakdown
export interface VisibilityScore {
  overall: number; // 0-100
  mentionRate: number; // 0-100: % of queries where business was mentioned
  positionScore: number; // 0-100: quality of position when mentioned
  sentimentScore: number; // 0-100: sentiment skew
  competitorDominanceScore: number; // 0-100: inverted competitor dominance
}

// A single fix recommendation
export interface FixItem {
  priority: "high" | "medium" | "low";
  category: "schema" | "citations" | "content" | "presence";
  title: string;
  description: string;
}

// Competitor comparison data
export interface CompetitorStats {
  name: string;
  mentionCount: number;
  mentionRate: number; // %
}

// Final audit report stored in Supabase
export interface AuditReport {
  seo?: SeoReport; // populated after server-side SEO audit completes
  id?: string;
  created_at?: string;
  business_name: string;
  website_url: string;
  category: string;
  city: string;
  competitors: string[];
  queries: QueryResult[];
  score: VisibilityScore;
  fixes: FixItem[];
  competitor_stats: CompetitorStats[];
  queries_completed: number;
  queries_total: number;
}
