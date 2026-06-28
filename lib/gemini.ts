"use client";

// Gemini API client — all calls happen client-side using the user's own key.
// NEVER import this in any server-side API route.

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

export const DEFAULT_MODEL = "gemini-2.5-flash";
export const FALLBACK_MODEL = "gemini-2.5-flash-lite";

export interface GeminiResponse {
  text: string;
  model: string;
}

export class GeminiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "GeminiError";
  }
}

async function callGemini(
  apiKey: string,
  prompt: string,
  model: string = DEFAULT_MODEL,
  jsonMode: boolean = false
): Promise<GeminiResponse> {
  const url = `${GEMINI_BASE}/${model}:generateContent?key=${apiKey}`;

  const body: Record<string, unknown> = {
    contents: [{ parts: [{ text: prompt }] }],
  };

  if (jsonMode) {
    body.generationConfig = { responseMimeType: "application/json" };
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new GeminiError(res.status, `Gemini API error ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  return { text, model };
}

export async function validateApiKey(apiKey: string): Promise<boolean> {
  try {
    await callGemini(apiKey, "Say OK", DEFAULT_MODEL);
    return true;
  } catch {
    return false;
  }
}

export async function generateQueries(
  apiKey: string,
  businessName: string,
  category: string,
  city: string
): Promise<string[]> {
  const prompt = `You are simulating realistic search queries a potential customer would type into
an AI assistant (like ChatGPT or Gemini) when looking for a business like this:

Business category: ${category}
Location: ${city}
Business name: ${businessName}

Generate 10 realistic, natural-language questions a real customer might ask an AI
assistant. Mix general category searches (not naming the business) with a few
that might mention the business by name. Do not include explanations, numbering,
prose, or extra text — return ONLY a JSON array of strings.

Example format: ["best eyewear store in Bengaluru", "affordable glasses near me", ...]`;

  const { text } = await callGemini(apiKey, prompt, DEFAULT_MODEL, true);
  const queries: string[] = JSON.parse(text.trim());

  if (!Array.isArray(queries) || queries.length === 0) {
    throw new Error("Query generation returned invalid format");
  }

  return queries.slice(0, 12);
}

// ── Option B: combined execute + parse in a single API call ──────────────────
// WHY: The old approach made 2 calls per query (execute → parse). This collapses
// them into 1. Gemini answers the customer question and simultaneously self-analyzes
// whether the target business was mentioned — in the same context window, so it has
// full awareness of what it just said. Halves total API calls: 10 queries → 10 calls
// instead of 20, cutting audit time by ~50%.
export interface CombinedQueryResult {
  answer_text: string;
  mentioned: boolean;
  position: "first" | "listed" | "passing_mention" | "not_mentioned";
  sentiment: "positive" | "neutral" | "negative" | "not_applicable";
  competitors_mentioned: string[];
  has_citation_signal: boolean;
}

export async function executeAndParseQuery(
  apiKey: string,
  businessName: string,
  query: string
): Promise<CombinedQueryResult> {
  const prompt = `You are a helpful AI assistant. A customer has asked you a question.

Customer query: "${query}"

Answer the customer's question naturally and helpfully. Then, analyze your own answer for signals about a specific business.

Business to track: "${businessName}"

Return ONLY a valid JSON object with no other text, using this exact schema:
{
  "answer_text": "<your full natural answer to the customer query>",
  "mentioned": <true if "${businessName}" appears or is clearly referenced in your answer, false otherwise>,
  "position": "<first | listed | passing_mention | not_mentioned>",
  "sentiment": "<positive | neutral | negative | not_applicable>",
  "competitors_mentioned": ["<any other business names you mentioned>"],
  "has_citation_signal": <true if your answer references specific verifiable facts about "${businessName}" like its website, reviews, address, or unique offerings>
}

Position guide: "first" = top/primary recommendation, "listed" = in a list but not first, "passing_mention" = mentioned incidentally, "not_mentioned" = not in answer at all.`;

  const { text } = await callGemini(apiKey, prompt, DEFAULT_MODEL, true);
  const parsed: CombinedQueryResult = JSON.parse(text.trim());
  return parsed;
}
