"use client";

import { useState } from "react";
import { useAuditStore } from "@/lib/auditStore";
import SeoSection from "./SeoSection";
import type { AuditReport, FixItem, QueryResult } from "@/lib/types";

type Tab = "overview" | "aeo" | "seo";

function ScoreRing({ value, label }: { value: number; label: string }) {
  const color = value >= 70 ? "#16a34a" : value >= 40 ? "#D97706" : "var(--red)";
  const r = 32, circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ position: "relative", width: 80, height: 80, margin: "0 auto 8px" }}>
        <svg width="80" height="80" viewBox="0 0 80 80" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="5" />
          <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="5"
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, color }}>
          {value}
        </div>
      </div>
      <div style={{ fontSize: 11, color: "var(--text-tertiary)", fontWeight: 600, lineHeight: 1.3 }}>{label}</div>
    </div>
  );
}

function FixCard({ fix }: { fix: FixItem }) {
  const bg = fix.priority === "high" ? "rgba(255,67,86,0.05)" : fix.priority === "medium" ? "rgba(255,122,69,0.05)" : "rgba(0,0,0,0.02)";
  const border = fix.priority === "high" ? "rgba(255,67,86,0.15)" : fix.priority === "medium" ? "rgba(255,122,69,0.15)" : "rgba(0,0,0,0.06)";
  const ic: Record<string, string> = { schema: "⚙", citations: "🔗", content: "📝", presence: "🏪" };
  return (
    <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 16, padding: "16px 18px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <span style={{ fontSize: 16 }}>{ic[fix.category] ?? "•"}</span>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{fix.title}</p>
            <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 999,
              background: border, color: fix.priority === "high" ? "#C41230" : fix.priority === "medium" ? "#C2410C" : "var(--text-tertiary)",
              textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {fix.priority}
            </span>
          </div>
          <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>{fix.description}</p>
        </div>
      </div>
    </div>
  );
}

function QueryRow({ result, index }: { result: QueryResult; index: number }) {
  const s = result.signal;
  return (
    <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
      <td style={{ padding: "9px 12px", fontSize: 10, color: "var(--text-tertiary)", fontFamily: "monospace" }}>{index + 1}</td>
      <td style={{ padding: "9px 12px", fontSize: 12, color: "var(--text-secondary)", maxWidth: 240 }}>
        <span style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{result.query}</span>
      </td>
      <td style={{ padding: "9px 12px", textAlign: "center" }}>
        {result.status === "failed" ? (
          <span style={{ fontSize: 10, color: "#7F1D1D", fontWeight: 600 }}>Failed</span>
        ) : s?.mentioned ? (
          <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 999, background: "rgba(255,67,86,0.09)", color: "#C41230", fontWeight: 600 }}>Yes</span>
        ) : (
          <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 999, background: "rgba(0,0,0,0.05)", color: "var(--text-tertiary)", fontWeight: 600 }}>No</span>
        )}
      </td>
      <td style={{ padding: "9px 12px", fontSize: 11, color: "var(--text-tertiary)", textTransform: "capitalize" }}>
        {s ? s.position.replace(/_/g, " ") : "—"}
      </td>
      <td style={{ padding: "9px 12px", fontSize: 11, color: "var(--text-tertiary)" }}>
        <span style={{ display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {s?.competitors_mentioned.length ? s.competitors_mentioned.join(", ") : "—"}
        </span>
      </td>
    </tr>
  );
}

export default function ReportView({ report: propReport }: { report?: AuditReport }) {
  const storeReport = useAuditStore((s) => s.report);
  const storeId = useAuditStore((s) => s.reportId);
  const storeSeo = useAuditStore((s) => s.seoReport);
  const seoStatus = useAuditStore((s) => s.seoStatus);
  const reset = useAuditStore((s) => s.reset);

  const report = propReport ?? storeReport;
  const seoReport = report?.seo ?? storeSeo;
  const [tab, setTab] = useState<Tab>("overview");

  if (!report) return null;

  const { score, fixes, competitor_stats, queries, queries_completed, queries_total } = report;
  const missed = queries_total - queries_completed;
  const overallColor = score.overall >= 70 ? "#16a34a" : score.overall >= 40 ? "#D97706" : "var(--red)";

  const tabStyle = (t: Tab): React.CSSProperties => ({
    padding: "8px 18px", borderRadius: 999, fontSize: 13, fontWeight: 600,
    cursor: "pointer", border: "none", transition: "all 0.2s",
    background: tab === t ? "#fff" : "transparent",
    color: tab === t ? "var(--text-primary)" : "var(--text-tertiary)",
    boxShadow: tab === t ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
            <span className="label-tag label-dark">{report.category}</span>
            <span className="label-tag label-light">{report.city}</span>
            {storeId && storeId !== "local" && (
              <span className="label-tag label-light" style={{ fontFamily: "monospace", fontSize: 9 }}>ID: {storeId.slice(0,8)}</span>
            )}
          </div>
          <h2 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em", color: "var(--text-primary)", marginBottom: 4 }}>
            {report.business_name}
          </h2>
          {report.website_url && (
            <a href={report.website_url} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 12, color: "var(--text-tertiary)", textDecoration: "none" }}>
              {report.website_url}
            </a>
          )}
          {missed > 0 && (
            <p style={{ fontSize: 11, marginTop: 8, color: "#B45309", background: "rgba(245,158,11,0.08)", padding: "4px 10px", borderRadius: 8, display: "inline-block" }}>
              {missed} of {queries_total} AEO queries failed — score based on {queries_completed} completed
            </p>
          )}
        </div>
        <button onClick={reset} className="btn-ghost-sm">← New audit</button>
      </div>

      {/* Dual score headline */}
      <div style={{
        background: "rgba(255,255,255,0.65)", border: "1px solid rgba(0,0,0,0.05)",
        borderRadius: 20, padding: "28px 32px",
      }}>
        <div style={{ display: "grid", gridTemplateColumns: seoReport ? "1fr 1px 1fr" : "1fr", gap: 32, alignItems: "center" }}>
          {/* AEO Score */}
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>
              AI Visibility (AEO)
            </div>
            <div style={{ fontSize: 64, fontWeight: 900, letterSpacing: "-0.04em", color: overallColor, lineHeight: 1 }}>
              {score.overall}
              <span style={{ fontSize: 24, fontWeight: 500, color: "rgba(0,0,0,0.2)" }}>/100</span>
            </div>
            <p style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 8 }}>
              {score.overall >= 70 ? "AI assistants know your business" :
               score.overall >= 40 ? "You appear sometimes — gaps to fix" :
               "AI assistants rarely mention you"}
            </p>
          </div>

          {/* Divider */}
          {seoReport && <div style={{ width: 1, background: "rgba(0,0,0,0.06)", alignSelf: "stretch" }} />}

          {/* SEO Score */}
          {seoReport && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>
                Google SEO
              </div>
              <div style={{ fontSize: 64, fontWeight: 900, letterSpacing: "-0.04em",
                color: seoReport.score.overall >= 70 ? "#16a34a" : seoReport.score.overall >= 40 ? "#D97706" : "var(--red)", lineHeight: 1 }}>
                {seoReport.score.overall}
                <span style={{ fontSize: 24, fontWeight: 500, color: "rgba(0,0,0,0.2)" }}>/100</span>
              </div>
              {/* Gap insight */}
              <p style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 8 }}>
                {score.overall > seoReport.score.overall + 20
                  ? "AI-visible but weak on Google — unusual. Check backlinks."
                  : seoReport.score.overall > score.overall + 20
                  ? "Ranking on Google but invisible to AI — fix schema + citations"
                  : "Both scores similar — fix both in parallel"}
              </p>
            </div>
          )}

          {seoStatus === "running" && !seoReport && (
            <div style={{ textAlign: "center", color: "var(--text-tertiary)" }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", border: "3px solid rgba(0,0,0,0.08)", borderTopColor: "var(--red)", animation: "spin-slow 0.9s linear infinite", margin: "0 auto 8px" }} />
              <p style={{ fontSize: 12 }}>SEO audit loading...</p>
            </div>
          )}
        </div>
      </div>

      {/* AEO sub-scores */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <ScoreRing value={score.mentionRate} label="Mention Rate" />
        <ScoreRing value={score.positionScore} label="Position Quality" />
        <ScoreRing value={score.sentimentScore} label="Sentiment" />
        <ScoreRing value={score.competitorDominanceScore} label="vs Competitors" />
      </div>

      {/* Tab nav */}
      <div style={{ display: "flex", alignItems: "center", background: "rgba(0,0,0,0.04)", borderRadius: 999, padding: 4, gap: 2, width: "fit-content" }}>
        <button onClick={() => setTab("overview")} style={tabStyle("overview")}>Overview</button>
        <button onClick={() => setTab("aeo")} style={tabStyle("aeo")}>AEO Details</button>
        {(seoReport || seoStatus !== "idle") && (
          <button onClick={() => setTab("seo")} style={tabStyle("seo")}>
            SEO Details{seoStatus === "running" ? " ..." : ""}
          </button>
        )}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {tab === "overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div style={{ width: 3, height: 20, borderRadius: 2, background: "linear-gradient(180deg,var(--red),var(--orange))" }} />
              <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
                {fixes.length + (seoReport?.fixes.length ?? 0)} unified recommendations
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {fixes.map((fix, i) => <FixCard key={`aeo-${i}`} fix={fix} />)}
              {seoReport?.fixes.map((f, i) => (
                <FixCard key={`seo-${i}`} fix={{ ...f, category: "schema" as const }} />
              ))}
            </div>
          </div>

          {competitor_stats.length > 0 && (
            <div style={{ background: "rgba(255,255,255,0.55)", border: "1px solid rgba(0,0,0,0.05)", borderRadius: 16, padding: "20px 22px" }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 14 }}>Competitors mentioned by AI</p>
              {competitor_stats.map((s, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: i < competitor_stats.length - 1 ? "1px solid rgba(0,0,0,0.04)" : "none" }}>
                  <span style={{ fontSize: 13, color: "var(--text-secondary)", flex: 1, fontWeight: 500, textTransform: "capitalize" }}>{s.name}</span>
                  <div style={{ width: 100, height: 3, background: "rgba(0,0,0,0.06)", borderRadius: 999, overflow: "hidden" }}>
                    <div style={{ height: "100%", background: "linear-gradient(90deg,#FF7A45,#F2AD63)", width: `${s.mentionRate}%`, borderRadius: 999 }} />
                  </div>
                  <span style={{ fontSize: 11, color: "var(--text-tertiary)", width: 32, textAlign: "right" }}>{s.mentionRate}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── AEO TAB ── */}
      {tab === "aeo" && (
        <div style={{ background: "rgba(255,255,255,0.5)", border: "1px solid rgba(0,0,0,0.05)", borderRadius: 16, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "rgba(0,0,0,0.025)", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                  {["#", "Query", "Mentioned?", "Position", "Competitors"].map((h) => (
                    <th key={h} style={{ padding: "10px 12px", fontSize: 10, fontWeight: 700, color: "var(--text-tertiary)", textAlign: "left", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {queries.map((r, i) => <QueryRow key={i} result={r} index={i} />)}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── SEO TAB ── */}
      {tab === "seo" && (
        seoReport ? <SeoSection report={seoReport} /> :
        seoStatus === "running" ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-tertiary)", fontSize: 13 }}>
            SEO audit still running — check back in a moment...
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-tertiary)", fontSize: 13 }}>
            SEO audit did not complete. Add a website URL and SERPER_API_KEY to enable this.
          </div>
        )
      )}
    </div>
  );
}
