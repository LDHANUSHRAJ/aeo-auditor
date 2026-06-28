"use client";

import type { SeoReport } from "@/lib/seoTypes";

function MetricRow({ label, value, good }: { label: string; value: boolean; good?: boolean }) {
  const ok = good ?? value;
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
      <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{label}</span>
      <div style={{ width: 7, height: 7, borderRadius: "50%", background: ok ? "#16a34a" : "var(--red)" }} />
    </div>
  );
}

export default function SeoSection({ report }: { report: SeoReport }) {
  const { score, serpResults, lighthouse, schema, openGraph, fixes, serpUnavailable, lighthouseUnavailable } = report;

  const scoreColor = score.overall >= 70 ? "#16a34a" : score.overall >= 40 ? "#D97706" : "var(--red)";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* SEO Score header */}
      <div style={{
        background: "rgba(255,255,255,0.6)", border: "1px solid rgba(0,0,0,0.05)",
        borderRadius: 20, padding: "24px 28px",
        display: "grid", gridTemplateColumns: "auto 1fr", gap: 24, alignItems: "center",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, fontWeight: 800, letterSpacing: "-0.04em", color: scoreColor, lineHeight: 1 }}>{score.overall}</div>
          <div style={{ fontSize: 10, color: "var(--text-tertiary)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginTop: 4 }}>SEO Score</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[
            { label: "SERP Positions", value: score.serpScore, tip: "40% weight" },
            { label: "Lighthouse SEO", value: score.lighthouseSeoScore, tip: "30% weight" },
            { label: "Performance", value: score.lighthousePerfScore, tip: "15% weight" },
            { label: "Structured Data", value: score.structuredDataScore, tip: "15% weight" },
          ].map((m) => (
            <div key={m.label}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: 11, color: "var(--text-tertiary)", fontWeight: 600 }}>{m.label}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: m.value >= 70 ? "#16a34a" : m.value >= 40 ? "#D97706" : "var(--red)" }}>{m.value}</span>
              </div>
              <div className="progress-bar-track">
                <div className="progress-bar-fill" style={{ width: `${m.value}%` }} />
              </div>
              <div style={{ fontSize: 9, color: "var(--text-tertiary)", marginTop: 3 }}>{m.tip}</div>
            </div>
          ))}
        </div>
      </div>

      {/* SERP results */}
      <div>
        <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
          SERP Positions
          {serpUnavailable && <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 999, background: "rgba(0,0,0,0.05)", color: "var(--text-tertiary)", fontWeight: 600 }}>API key not configured</span>}
        </p>
        <div style={{ background: "rgba(255,255,255,0.5)", border: "1px solid rgba(0,0,0,0.05)", borderRadius: 16, overflow: "hidden" }}>
          {serpResults.slice(0, 6).map((r, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderBottom: i < 5 ? "1px solid rgba(0,0,0,0.04)" : "none" }}>
              <span style={{ fontSize: 10, color: "var(--text-tertiary)", width: 14, fontFamily: "monospace" }}>{i + 1}</span>
              <p style={{ fontSize: 12, color: "var(--text-secondary)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.query}</p>
              {r.error ? (
                <span style={{ fontSize: 10, color: "var(--text-tertiary)" }}>—</span>
              ) : r.targetPosition !== null ? (
                <span style={{ fontSize: 11, fontWeight: 700, color: r.targetPosition <= 3 ? "#16a34a" : r.targetPosition <= 10 ? "#D97706" : "var(--red)", minWidth: 48, textAlign: "right" }}>
                  #{r.targetPosition}
                </span>
              ) : (
                <span style={{ fontSize: 10, fontWeight: 600, color: "var(--text-tertiary)", minWidth: 48, textAlign: "right" }}>Not found</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Technical signals */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {/* Lighthouse */}
        <div style={{ background: "rgba(255,255,255,0.5)", border: "1px solid rgba(0,0,0,0.05)", borderRadius: 16, padding: "18px 20px" }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
            Lighthouse
            {lighthouseUnavailable && <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 999, background: "rgba(0,0,0,0.05)", color: "var(--text-tertiary)", fontWeight: 600 }}>timeout</span>}
          </p>
          {lighthouse && !lighthouse.timedOut ? (
            <div>
              <MetricRow label="Meta description" value={lighthouse.hasMetaDescription} />
              <MetricRow label="Viewport tag" value={lighthouse.hasViewport} />
              <MetricRow label="Document title" value={lighthouse.hasDocumentTitle} />
              <MetricRow label="Canonical URL" value={lighthouse.hasCanonical} />
            </div>
          ) : (
            <p style={{ fontSize: 12, color: "var(--text-tertiary)" }}>Could not complete — site may block headless browsers.</p>
          )}
        </div>

        {/* Schema + OG */}
        <div style={{ background: "rgba(255,255,255,0.5)", border: "1px solid rgba(0,0,0,0.05)", borderRadius: 16, padding: "18px 20px" }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12 }}>Structured Data</p>
          {schema ? (
            <div>
              <MetricRow label="LocalBusiness schema" value={schema.hasLocalBusiness} />
              <MetricRow label="Review / Rating schema" value={schema.hasReview} />
              <MetricRow label="FAQPage schema" value={schema.hasFAQPage} />
              <MetricRow label="Open Graph tags" value={!!openGraph?.hasTitle} />
            </div>
          ) : (
            <p style={{ fontSize: 12, color: "var(--text-tertiary)" }}>Could not fetch page HTML.</p>
          )}
        </div>
      </div>

      {/* SEO fixes */}
      {fixes.length > 0 && (
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12 }}>SEO Fix List</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {fixes.map((f, i) => {
              const bg = f.priority === "high" ? "rgba(255,67,86,0.05)" : f.priority === "medium" ? "rgba(255,122,69,0.05)" : "rgba(0,0,0,0.02)";
              const border = f.priority === "high" ? "rgba(255,67,86,0.15)" : f.priority === "medium" ? "rgba(255,122,69,0.15)" : "rgba(0,0,0,0.06)";
              return (
                <div key={i} style={{ background: bg, border: `1px solid ${border}`, borderRadius: 14, padding: "14px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>{f.title}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 999, background: border, color: f.priority === "high" ? "#C41230" : f.priority === "medium" ? "#C2410C" : "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      {f.priority}
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.55 }}>{f.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
