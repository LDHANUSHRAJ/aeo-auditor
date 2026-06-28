"use client";

import { useAuditStore } from "@/lib/auditStore";
import type { QueryResult } from "@/lib/types";

const STATUS_DOT: Record<string, React.CSSProperties> = {
  pending:  { background: "rgba(0,0,0,0.1)" },
  running:  { background: "#3B82F6", boxShadow: "0 0 0 3px rgba(59,130,246,0.2)", animation: "pulse-ambient 1.2s ease-in-out infinite" },
  retrying: { background: "#F59E0B", boxShadow: "0 0 0 3px rgba(245,158,11,0.2)", animation: "pulse-ambient 1.2s ease-in-out infinite" },
  done:     { background: "var(--red)", boxShadow: "0 0 0 2px rgba(255,67,86,0.15)" },
  failed:   { background: "#7F1D1D" },
};

function QueryRow({ result, index }: { result: QueryResult; index: number }) {
  const s = result.signal;
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 12, padding: "11px 16px",
      borderBottom: "1px solid rgba(0,0,0,0.04)", transition: "background 0.15s",
    }}>
      <span style={{ fontSize: 10, color: "var(--text-tertiary)", width: 16, textAlign: "right", fontFamily: "monospace", marginTop: 3, flexShrink: 0 }}>{index + 1}</span>
      <div style={{ width: 7, height: 7, borderRadius: "50%", marginTop: 4, flexShrink: 0, ...(STATUS_DOT[result.status] ?? {}) }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{result.query}</p>
        {result.error && <p style={{ fontSize: 11, color: "#B45309", marginTop: 3 }}>{result.error}</p>}
        {result.status === "done" && s && (
          <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
            {s.mentioned ? (
              <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 999, background: "rgba(255,67,86,0.09)", color: "#C41230", fontWeight: 600 }}>Mentioned</span>
            ) : (
              <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 999, background: "rgba(0,0,0,0.05)", color: "var(--text-tertiary)", fontWeight: 600 }}>Not mentioned</span>
            )}
            {s.mentioned && (
              <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 999, background: "rgba(0,0,0,0.06)", color: "var(--text-secondary)", fontWeight: 600, textTransform: "capitalize" }}>
                {s.position.replace(/_/g, " ")}
              </span>
            )}
            {s.competitors_mentioned.length > 0 && (
              <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 999, background: "rgba(255,122,69,0.09)", color: "#C2410C", fontWeight: 600 }}>
                {s.competitors_mentioned.length} competitor{s.competitors_mentioned.length > 1 ? "s" : ""}
              </span>
            )}
          </div>
        )}
      </div>
      <span style={{ fontSize: 11, color: result.status === "done" ? "var(--red)" : result.status === "failed" ? "#7F1D1D" : "var(--text-tertiary)", fontWeight: 600, flexShrink: 0, marginTop: 1 }}>
        {result.status === "retrying" ? `Retry ${result.retryCount}` : result.status.charAt(0).toUpperCase() + result.status.slice(1)}
      </span>
    </div>
  );
}

function SeoStatusBadge() {
  const { seoStatus, seoReport, seoError, input } = useAuditStore();
  if (!input?.websiteUrl || seoStatus === "idle") return null;

  return (
    <div style={{
      background: "rgba(255,255,255,0.7)", border: "1px solid rgba(0,0,0,0.06)",
      borderRadius: 14, padding: "14px 18px", marginBottom: 16,
      display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {seoStatus === "running" && (
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#3B82F6", animation: "pulse-ambient 1.2s ease-in-out infinite" }} />
        )}
        {seoStatus === "done" && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#16a34a" }} />}
        {seoStatus === "failed" && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#7F1D1D" }} />}
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
          SEO Technical Audit
        </span>
        <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>
          {seoStatus === "running" ? "(Lighthouse + SERP — running on server...)" :
           seoStatus === "done" ? `(Score: ${seoReport?.score.overall}/100)` :
           "(failed — will show AEO results only)"}
        </span>
      </div>
      {seoStatus === "running" && (
        <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(59,130,246,0.2)", borderTopColor: "#3B82F6", animation: "spin-slow 0.9s linear infinite" }} />
      )}
      {seoStatus === "failed" && seoError && (
        <span style={{ fontSize: 11, color: "#7F1D1D" }}>{seoError.slice(0, 60)}</span>
      )}
    </div>
  );
}

export default function LiveProgress() {
  const { liveResults, input } = useAuditStore();
  const done = liveResults.filter((r) => r.status === "done").length;
  const failed = liveResults.filter((r) => r.status === "failed").length;
  const total = liveResults.length;
  const progress = total > 0 ? Math.round(((done + failed) / total) * 100) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* AEO progress header */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
              AEO Audit · {input?.businessName}
            </p>
            <p style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 2 }}>
              {done + failed} of {total} queries complete
            </p>
          </div>
          <div style={{
            width: 52, height: 52, borderRadius: "50%", display: "flex", alignItems: "center",
            justifyContent: "center", fontWeight: 800, fontSize: 15, color: "#fff",
            background: "linear-gradient(135deg,#FF4356,#FF7A45)",
          }}>
            {progress}%
          </div>
        </div>
        <div className="progress-bar-track">
          <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
        </div>
        <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
          <span style={{ fontSize: 11, color: "var(--text-tertiary)", display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--red)", display: "inline-block" }} />
            {done} done
          </span>
          {failed > 0 && (
            <span style={{ fontSize: 11, color: "var(--text-tertiary)", display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#7F1D1D", display: "inline-block" }} />
              {failed} failed
            </span>
          )}
          <span style={{ fontSize: 11, color: "var(--text-tertiary)", marginLeft: "auto" }}>
            ~10 RPM · 1 call per query
          </span>
        </div>
      </div>

      {/* SEO parallel status */}
      <SeoStatusBadge />

      {/* Query list */}
      <div style={{ background: "rgba(255,255,255,0.55)", border: "1px solid rgba(0,0,0,0.05)", borderRadius: 16, overflow: "hidden" }}>
        {liveResults.map((result, i) => (
          <QueryRow key={i} result={result} index={i} />
        ))}
      </div>
    </div>
  );
}
