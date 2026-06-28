// Scoring and fix-list generation — fully deterministic, no LLM calls.
// This is intentionally transparent so every number can be explained in an interview.

import type {
  QueryResult,
  VisibilityScore,
  FixItem,
  CompetitorStats,
} from "./types";

// ── Scoring weights (must sum to 1.0) ────────────────────────────────────────
// Mention rate carries the most weight — being mentioned at all is the first gate.
// Position quality matters second — first recommendation >> buried in a list.
// Sentiment skew matters less — neutral is still a win vs. not mentioned.
// Competitor dominance is an inverted penalty signal.
const WEIGHT_MENTION_RATE = 0.45;
const WEIGHT_POSITION = 0.30;
const WEIGHT_SENTIMENT = 0.10;
const WEIGHT_COMPETITOR = 0.15;
// ─────────────────────────────────────────────────────────────────────────────

// Position quality map — "first" is maximum signal strength
const POSITION_SCORES: Record<string, number> = {
  first: 100,
  listed: 60,
  passing_mention: 25,
  not_mentioned: 0,
};

const SENTIMENT_SCORES: Record<string, number> = {
  positive: 100,
  neutral: 60,
  negative: 10,
  not_applicable: 0,
};

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export function computeScore(
  results: QueryResult[],
  businessName: string
): { score: VisibilityScore; competitorStats: CompetitorStats[] } {
  const done = results.filter((r) => r.status === "done" && r.signal);
  const total = done.length;

  if (total === 0) {
    return {
      score: {
        overall: 0,
        mentionRate: 0,
        positionScore: 0,
        sentimentScore: 0,
        competitorDominanceScore: 0,
      },
      competitorStats: [],
    };
  }

  // 1. Mention rate: % of completed queries where business was mentioned
  const mentioned = done.filter((r) => r.signal!.mentioned);
  const mentionRate = (mentioned.length / total) * 100;

  // 2. Position score: average position quality across completed queries
  const positionScore = avg(
    done.map((r) => POSITION_SCORES[r.signal!.position] ?? 0)
  );

  // 3. Sentiment score: average sentiment quality across mentioned queries only
  const mentionedResults = done.filter((r) => r.signal!.mentioned);
  const sentimentScore =
    mentionedResults.length > 0
      ? avg(mentionedResults.map((r) => SENTIMENT_SCORES[r.signal!.sentiment] ?? 60))
      : 0;

  // 4. Competitor dominance: how often competitors appear vs. the business.
  // Build a competitor mention counter
  const competitorCounts: Record<string, number> = {};
  for (const r of done) {
    for (const c of r.signal!.competitors_mentioned) {
      // Normalize: lowercase, trim
      const key = c.toLowerCase().trim();
      if (key && key !== businessName.toLowerCase().trim()) {
        competitorCounts[key] = (competitorCounts[key] ?? 0) + 1;
      }
    }
  }

  // Total competitor mentions across all queries
  const totalCompetitorMentions = Object.values(competitorCounts).reduce(
    (a, b) => a + b,
    0
  );
  // Our own mention count
  const ourMentions = mentioned.length;

  // Competitor dominance score (inverted): 100 = we dominate, 0 = competitors dominate
  let competitorDominanceScore: number;
  if (ourMentions + totalCompetitorMentions === 0) {
    competitorDominanceScore = 50; // neutral — nobody mentioned
  } else {
    const ourShare = ourMentions / (ourMentions + totalCompetitorMentions);
    competitorDominanceScore = Math.round(ourShare * 100);
  }

  // Build competitor stats sorted by mention count
  const competitorStats: CompetitorStats[] = Object.entries(competitorCounts)
    .map(([name, count]) => ({
      name,
      mentionCount: count,
      mentionRate: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.mentionCount - a.mentionCount)
    .slice(0, 10);

  // Weighted overall score
  const overall = Math.round(
    mentionRate * WEIGHT_MENTION_RATE +
      positionScore * WEIGHT_POSITION +
      sentimentScore * WEIGHT_SENTIMENT +
      competitorDominanceScore * WEIGHT_COMPETITOR
  );

  return {
    score: {
      overall,
      mentionRate: Math.round(mentionRate),
      positionScore: Math.round(positionScore),
      sentimentScore: Math.round(sentimentScore),
      competitorDominanceScore,
    },
    competitorStats,
  };
}

// Deterministic fix-list generation based on score signals.
// Logic: if a signal is weak → recommend the corresponding AEO fix.
// This is intentionally rule-based, not another LLM call — explainability matters.
export function generateFixList(
  score: VisibilityScore,
  results: QueryResult[]
): FixItem[] {
  const fixes: FixItem[] = [];
  const done = results.filter((r) => r.status === "done" && r.signal);
  const citationRate =
    done.length > 0
      ? done.filter((r) => r.signal!.has_citation_signal).length / done.length
      : 0;

  // Low overall mention rate → schema markup is the primary fix
  if (score.mentionRate < 40) {
    fixes.push({
      priority: "high",
      category: "schema",
      title: "Add LocalBusiness schema.org JSON-LD",
      description:
        'AI assistants rely on structured data to discover and surface businesses. Add a <script type="application/ld+json"> block with LocalBusiness schema to your homepage, including name, address, telephone, url, openingHours, and priceRange.',
    });
    fixes.push({
      priority: "high",
      category: "citations",
      title: "Get listed on major directories and review platforms",
      description:
        "AI systems often pull from Justdial, Google Business Profile, IndiaMART, Sulekha, and similar platforms. Claim or create your listing on each with consistent NAP (Name, Address, Phone) data.",
    });
  }

  // Low citation signals → business has weak structured-data footprint
  if (citationRate < 0.3) {
    fixes.push({
      priority: "high",
      category: "citations",
      title: "Build authoritative third-party citations",
      description:
        "Less than 30% of AI responses about you contained verifiable facts (citations). Get reviewed on Google, Trustpilot, or industry-specific platforms. Press mentions and Wikipedia/Wikidata presence dramatically boost AI citation confidence.",
    });
  }

  // Medium mention rate but poor position → content optimization
  if (score.mentionRate >= 20 && score.positionScore < 50) {
    fixes.push({
      priority: "medium",
      category: "content",
      title: 'Add FAQ content matching real customer queries',
      description:
        "You are sometimes mentioned but rarely as the top result. Add FAQ sections to your site that directly answer questions like the ones tested in this audit. AI assistants favor sources that answer questions directly.",
    });
  }

  // Low or no mention rate → basic presence fix
  if (score.mentionRate < 20) {
    fixes.push({
      priority: "high",
      category: "presence",
      title: "Write a clear, crawlable About/Services page",
      description:
        "Your business barely appears in AI responses. Ensure your website has a dedicated page that clearly states: what you do, where you operate, who your customers are, and what makes you different — in plain language, not only in images.",
    });
  }

  // Sentiment is negative when mentioned
  if (score.sentimentScore < 40 && score.mentionRate > 20) {
    fixes.push({
      priority: "medium",
      category: "citations",
      title: "Respond to and resolve negative reviews",
      description:
        "When AI assistants mention your business, the framing skews negative. Actively respond to 1-star reviews on Google and Justdial. Recent positive reviews outweigh old negative ones in AI training data.",
    });
  }

  // Competitor dominance is very high
  if (score.competitorDominanceScore < 30) {
    fixes.push({
      priority: "medium",
      category: "content",
      title: "Create comparison and category-authority content",
      description:
        "Competitors are being recommended far more often than you. Publish category-level content (e.g., 'Best eyewear stores in Bengaluru') where your business is featured. AI assistants frequently source from review round-ups and comparison articles.",
    });
  }

  // Missing review schema
  if (score.mentionRate < 60) {
    fixes.push({
      priority: "medium",
      category: "schema",
      title: "Add Review and AggregateRating schema",
      description:
        "Adding Review/AggregateRating JSON-LD signals review legitimacy to AI systems. Even a few marked-up reviews on your site can improve how AI assistants characterize your reputation.",
    });
  }

  // General good-to-do regardless of score
  fixes.push({
    priority: "low",
    category: "schema",
    title: "Add Product/Service and BreadcrumbList schema",
    description:
      "Mark up your specific products or services with schema.org/Product or schema.org/Service so AI assistants can reference specific offerings, not just your brand name.",
  });

  return fixes;
}
