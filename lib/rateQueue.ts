"use client";

// Client-side rate-limited request queue for Gemini API calls.
//
// WHY: Gemini free tier enforces ~10-15 RPM. With Option B (combined execute+parse),
// each query is now 1 call instead of 2, so we can safely target 10 RPM instead of 8.
// Requests are sent sequentially. On 429, exponential backoff applies before retry.
// All config is in named constants — tune here, logic doesn't change.

import { GeminiError } from "./gemini";
import type { QueryResult, QuerySignal } from "./types";

// ── Rate-limit config ─────────────────────────────────────────────────────────
// 10 RPM is safe on free tier now that Option B halved our call count per query
const TARGET_RPM = 10;
export const REQUEST_INTERVAL_MS = Math.ceil((60 / TARGET_RPM) * 1000); // 6000ms

const BACKOFF_BASE_MS = 1000;
const BACKOFF_MAX_MS = 30000;
const MAX_RETRIES = 4;
// ─────────────────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function backoffDelay(retryCount: number): number {
  return Math.min(BACKOFF_BASE_MS * Math.pow(2, retryCount), BACKOFF_MAX_MS);
}

export type ProgressCallback = (results: QueryResult[]) => void;

export interface QueueJob {
  query: string;
  // Option B: single call returns answer + structured signals together
  executeAndParse: (query: string) => Promise<QuerySignal>;
}

export async function runQueue(
  jobs: QueueJob[],
  onProgress: ProgressCallback
): Promise<QueryResult[]> {
  const results: QueryResult[] = jobs.map((j) => ({
    query: j.query,
    status: "pending",
    retryCount: 0,
  }));

  onProgress([...results]);

  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i];
    let retries = 0;
    let succeeded = false;

    while (!succeeded && retries <= MAX_RETRIES) {
      results[i] = {
        ...results[i],
        status: retries === 0 ? "running" : "retrying",
        retryCount: retries,
      };
      onProgress([...results]);

      try {
        const signal = await job.executeAndParse(job.query);

        results[i] = { ...results[i], status: "done", signal, retryCount: retries };
        onProgress([...results]);
        succeeded = true;
      } catch (err) {
        if (err instanceof GeminiError && err.status === 429) {
          const delay = backoffDelay(retries);
          results[i] = {
            ...results[i],
            status: "retrying",
            error: `Rate limited. Retrying in ${Math.round(delay / 1000)}s...`,
            retryCount: retries,
          };
          onProgress([...results]);
          await sleep(delay);
          retries++;
        } else {
          results[i] = {
            ...results[i],
            status: "failed",
            error: err instanceof Error ? err.message : String(err),
            retryCount: retries,
          };
          onProgress([...results]);
          break;
        }
      }
    }

    if (!succeeded && results[i].status !== "failed") {
      results[i] = {
        ...results[i],
        status: "failed",
        error: "Max retries exceeded after repeated rate limiting",
      };
      onProgress([...results]);
    }

    if (i < jobs.length - 1) {
      await sleep(REQUEST_INTERVAL_MS);
    }
  }

  return results;
}
