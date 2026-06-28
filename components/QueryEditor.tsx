"use client";

import { useState } from "react";
import { useAuditStore } from "@/lib/auditStore";
import { executeAndParseQuery } from "@/lib/gemini";
import { runQueue, REQUEST_INTERVAL_MS } from "@/lib/rateQueue";
import { computeScore, generateFixList } from "@/lib/scoring";
import { saveReport } from "@/lib/supabase";
import type { QuerySignal, QueryResult } from "@/lib/types";
import type { SeoReport } from "@/lib/seoTypes";

export default function QueryEditor() {
  const { input, generatedQueries, isGeneratingQueries, queryGenError,
    updateQuery, removeQuery, addQuery, setLiveResults, setReport, setStep,
    setSeoStatus, setSeoReport, setSeoError } = useAuditStore();

  const [newQuery, setNewQuery] = useState("");
  const [starting, setStarting] = useState(false);

  if (isGeneratingQueries) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "60px 0", gap: 16 }}>
        <div style={{
          width: 44, height: 44, borderRadius: "50%",
          border: "3px solid rgba(255,67,86,0.15)",
          borderTopColor: "var(--red)",
          animation: "spin-slow 0.9s linear infinite",
        }} />
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>Generating queries...</p>
          <p style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 4 }}>Using your Gemini key to build realistic customer questions</p>
        </div>
      </div>
    );
  }

  if (queryGenError) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ background: "rgba(255,67,86,0.05)", border: "1px solid rgba(255,67,86,0.18)", borderRadius: 14, padding: 20 }}>
          <p style={{ fontWeight: 600, color: "#C41230", marginBottom: 6 }}>Query generation failed</p>
          <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>{queryGenError}</p>
        </div>
        <button onClick={() => useAuditStore.getState().setStep("input")} className="btn-ghost-sm" style={{ width: "fit-content" }}>
          ← Go back
        </button>
      </div>
    );
  }

  function handleAddQuery() {
    if (newQuery.trim()) { addQuery(newQuery.trim()); setNewQuery(""); }
  }

  async function startAudit() {
    if (!input || generatedQueries.length === 0) return;
    setStarting(true);
    setStep("running");

    // Kick off SEO audit in parallel (server-side) — doesn't block AEO queue
    if (input.websiteUrl) {
      setSeoStatus("running");
      fetch("/api/seo-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ queries: generatedQueries, websiteUrl: input.websiteUrl }),
      })
        .then((r) => r.json())
        .then((data: SeoReport) => { setSeoReport(data); setSeoStatus("done"); })
        .catch((err) => { setSeoError(err.message); setSeoStatus("failed"); });
    }

    // AEO queue — client-side, rate-limited
    const jobs = generatedQueries.map((query) => ({
      query,
      executeAndParse: async (q: string): Promise<QuerySignal> => {
        const r = await executeAndParseQuery(input.apiKey, input.businessName, q);
        return { query: q, rawResponse: r.answer_text, mentioned: r.mentioned,
          position: r.position, sentiment: r.sentiment,
          competitors_mentioned: r.competitors_mentioned, has_citation_signal: r.has_citation_signal };
      },
    }));

    const results = await runQueue(jobs, (r: QueryResult[]) => setLiveResults(r));
    const { score, competitorStats } = computeScore(results, input.businessName);
    const fixes = generateFixList(score, results);
    const completed = results.filter((r) => r.status === "done").length;

    const reportData = {
      business_name: input.businessName, website_url: input.websiteUrl,
      category: input.category, city: input.city, competitors: input.competitors,
      queries: results, score, fixes, competitor_stats: competitorStats,
      queries_completed: completed, queries_total: results.length,
    };

    let savedId = "local";
    try { savedId = await saveReport(reportData); } catch { /* show local result */ }

    setReport(reportData, savedId);
    setStep("report");
    setStarting(false);
  }

  const estMins = Math.ceil((generatedQueries.length * REQUEST_INTERVAL_MS) / 60000);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Query list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {generatedQueries.map((q, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 11, color: "var(--text-tertiary)", width: 18, textAlign: "right", fontFamily: "monospace", flexShrink: 0 }}>{i + 1}</span>
            <input type="text" value={q} onChange={(e) => updateQuery(i, e.target.value)} className="input-premium" style={{ flex: 1 }} />
            <button onClick={() => removeQuery(i)} style={{
              width: 26, height: 26, borderRadius: "50%", border: "none", background: "transparent",
              color: "var(--text-tertiary)", cursor: "pointer", fontSize: 16, display: "flex",
              alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s",
            }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,67,86,0.08)"; e.currentTarget.style.color = "var(--red)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-tertiary)"; }}>
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Add query */}
      <div style={{ display: "flex", gap: 8 }}>
        <input type="text" value={newQuery} onChange={(e) => setNewQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddQuery()}
          placeholder="Add a custom query..." className="input-premium"
          style={{ flex: 1, borderStyle: "dashed" }} />
        <button onClick={handleAddQuery} disabled={!newQuery.trim()} className="btn-ghost-sm">+ Add</button>
      </div>

      {/* Time estimate */}
      <div style={{
        background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.06)",
        borderRadius: 14, padding: "14px 18px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
          <strong style={{ color: "var(--text-primary)" }}>{generatedQueries.length} queries</strong>
          <span style={{ color: "var(--text-tertiary)" }}> · 1 Gemini call each · 10 RPM · SEO audit runs in parallel</span>
        </div>
        <span className="label-tag label-dark" style={{ fontSize: 10 }}>~{estMins} min</span>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
        <button onClick={() => useAuditStore.getState().setStep("input")} className="btn-secondary" style={{ height: 48 }}>
          ← Back
        </button>
        <button onClick={startAudit} disabled={starting || generatedQueries.length === 0} className="btn-cta"
          style={{ flex: 1, height: 48 }}>
          {starting ? "Starting..." : `Run Audit (${generatedQueries.length} queries) →`}
        </button>
      </div>
    </div>
  );
}
