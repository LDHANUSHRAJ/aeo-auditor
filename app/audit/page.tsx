"use client";

import Link from "next/link";
import { useAuditStore } from "@/lib/auditStore";
import InputForm from "@/components/InputForm";
import QueryEditor from "@/components/QueryEditor";
import LiveProgress from "@/components/LiveProgress";
import ReportView from "@/components/ReportView";

const STEPS = [
  { key: "input",   label: "Business Info" },
  { key: "queries", label: "Review Queries" },
  { key: "running", label: "Running" },
  { key: "report",  label: "Report" },
] as const;

function StepBar({ current }: { current: string }) {
  const idx = STEPS.findIndex((s) => s.key === current);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      {STEPS.map((step, i) => (
        <div key={step.key} style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <div style={{
              width: 22, height: 22, borderRadius: "50%", fontSize: 10,
              display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700,
              background: i < idx ? "linear-gradient(135deg,#FF4356,#FF7A45)" :
                          i === idx ? "linear-gradient(135deg,#FF4356,#FF7A45)" : "rgba(0,0,0,0.08)",
              color: i <= idx ? "#fff" : "var(--text-tertiary)",
              boxShadow: i === idx ? "0 0 0 3px rgba(255,67,86,0.15)" : "none",
            }}>
              {i < idx ? "✓" : i + 1}
            </div>
            <span style={{
              fontSize: 12, fontWeight: 600, display: "none",
              color: i === idx ? "var(--text-primary)" : "var(--text-tertiary)",
            }} className="sm-show">
              {step.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div style={{ width: 20, height: 1, background: i < idx ? "rgba(255,67,86,0.4)" : "rgba(0,0,0,0.1)" }} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function AuditPage() {
  const step = useAuditStore((s) => s.step);

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", padding: "24px 16px" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>

        {/* Top nav row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <div style={{
              width: 26, height: 26, borderRadius: 7,
              background: "linear-gradient(135deg,#FF4356,#FF7A45)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ color: "#fff", fontSize: 9, fontWeight: 800 }}>AEO</span>
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-secondary)" }}>Auditor</span>
          </Link>
          <StepBar current={step} />
        </div>

        {/* Main glass card */}
        <div className="glass-container" style={{ padding: step === "report" ? "40px 44px" : "44px 48px" }}>
          {step !== "report" && (
            <div style={{ marginBottom: 32 }}>
              <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.025em", color: "var(--text-primary)", marginBottom: 6 }}>
                {step === "input"   && "Tell us about your business"}
                {step === "queries" && "Review your audit queries"}
                {step === "running" && "Audit in progress"}
              </h1>
              <p style={{ fontSize: 13, color: "var(--text-tertiary)" }}>
                {step === "input"   && "Your API key stays in your browser — never sent to our servers."}
                {step === "queries" && "Edit, remove, or add queries before running. SEO audit runs in parallel on our servers."}
                {step === "running" && "AEO queries run one at a time · SEO technical audit runs in parallel on server."}
              </p>
            </div>
          )}

          {step === "input"   && <InputForm />}
          {step === "queries" && <QueryEditor />}
          {step === "running" && <LiveProgress />}
          {step === "report"  && <ReportView />}
        </div>
      </div>
    </div>
  );
}
