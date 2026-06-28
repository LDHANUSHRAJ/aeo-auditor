// SEO module types

export interface SerpResult {
  position: number;
  title: string;
  url: string;
  domain: string;
  snippet: string;
  isTarget: boolean; // is this the business being audited?
}

export interface SerpQueryResult {
  query: string;
  targetPosition: number | null; // null = not found in top 20
  results: SerpResult[];
  cached: boolean;
  error?: string;
}

export interface SchemaPresence {
  hasLocalBusiness: boolean;
  hasProduct: boolean;
  hasReview: boolean;
  hasFAQPage: boolean;
  hasOrganization: boolean;
  allTypes: string[];
}

export interface OpenGraphPresence {
  hasTitle: boolean;
  hasDescription: boolean;
  hasImage: boolean;
  tags: Record<string, string>;
}

export interface LighthouseResult {
  seoScore: number;       // 0-100
  performanceScore: number; // 0-100
  hasMetaDescription: boolean;
  hasViewport: boolean;
  hasDocumentTitle: boolean;
  hasCanonical: boolean;
  failingAudits: string[];
  timedOut: boolean;
  error?: string;
}

// ── Scoring (weights in seoScoring.ts) ───────────────────────────────────────
export interface SeoScore {
  overall: number;
  serpScore: number;         // 40% — SERP position quality
  lighthouseSeoScore: number; // 30% — Lighthouse SEO category
  lighthousePerfScore: number; // 15% — Lighthouse Performance
  structuredDataScore: number; // 15% — schema.org + OG completeness
}

export interface SeoFixItem {
  priority: "high" | "medium" | "low";
  category: "serp" | "technical" | "schema" | "performance";
  title: string;
  description: string;
}

export interface SeoReport {
  score: SeoScore;
  serpResults: SerpQueryResult[];
  lighthouse: LighthouseResult | null;
  schema: SchemaPresence | null;
  openGraph: OpenGraphPresence | null;
  fixes: SeoFixItem[];
  serpUnavailable: boolean;
  lighthouseUnavailable: boolean;
}
