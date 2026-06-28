"use client";

import { useState } from "react";
import { useAuditStore } from "@/lib/auditStore";
import { generateQueries, validateApiKey } from "@/lib/gemini";
import { saveLead } from "@/lib/supabase";
import type { BusinessInput } from "@/lib/types";

export default function InputForm() {
  const { setInput, setGeneratedQueries, setStep, setIsGeneratingQueries, setQueryGenError } = useAuditStore();

  const [form, setForm] = useState<BusinessInput>({
    businessName: "", websiteUrl: "", category: "", city: "", email: "", apiKey: "", competitors: ["", "", ""],
  });
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(field: keyof BusinessInput, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }
  function updateCompetitor(i: number, v: string) {
    setForm((f) => { const c = [...f.competitors]; c[i] = v; return { ...f, competitors: c }; });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.businessName || !form.category || !form.city || !form.email || !form.apiKey) {
      setError("Please fill in all required fields.");
      return;
    }
    setValidating(true);
    try {
      const valid = await validateApiKey(form.apiKey);
      if (!valid) { setError("API key validation failed. Check your Gemini API key."); return; }
    } catch { setError("Could not reach Gemini API. Check your internet connection."); return; }
    finally { setValidating(false); }

    const cleaned: BusinessInput = { ...form, competitors: form.competitors.filter((c) => c.trim()) };
    saveLead(cleaned); // fire-and-forget
    setInput(cleaned);
    setIsGeneratingQueries(true);
    setQueryGenError(null);
    setStep("queries");

    try {
      const queries = await generateQueries(cleaned.apiKey, cleaned.businessName, cleaned.category, cleaned.city);
      setGeneratedQueries(queries);
    } catch (err) {
      setQueryGenError(err instanceof Error ? err.message : "Failed to generate queries.");
    } finally { setIsGeneratingQueries(false); }
  }

  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)",
    letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8,
  };
  const req = <span style={{ color: "var(--red)" }}>*</span>;

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Privacy notice */}
      <div style={{
        background: "rgba(255,67,86,0.04)", border: "1px solid rgba(255,67,86,0.12)",
        borderRadius: 14, padding: "14px 16px",
        display: "flex", gap: 12, alignItems: "flex-start",
      }}>
        <div style={{
          width: 20, height: 20, borderRadius: "50%", flexShrink: 0, marginTop: 1,
          background: "linear-gradient(135deg,#FF4356,#FF7A45)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 10, color: "#fff", fontWeight: 700,
        }}>i</div>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 3 }}>
            Your API key stays in your browser
          </p>
          <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.55 }}>
            All Gemini calls go directly from your device to Google. We never see or store your key.
            Google may use free-tier inputs to improve their models — don&apos;t audit confidential data.
          </p>
        </div>
      </div>

      {/* Business fields */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div>
          <label style={labelStyle}>Business Name {req}</label>
          <input type="text" value={form.businessName} onChange={(e) => update("businessName", e.target.value)}
            placeholder="e.g. Lenzify" className="input-premium" required suppressHydrationWarning />
        </div>
        <div>
          <label style={labelStyle}>Website URL</label>
          <input type="url" value={form.websiteUrl} onChange={(e) => update("websiteUrl", e.target.value)}
            placeholder="https://lenzify.in" className="input-premium" suppressHydrationWarning />
        </div>
        <div>
          <label style={labelStyle}>Business Category {req}</label>
          <input type="text" value={form.category} onChange={(e) => update("category", e.target.value)}
            placeholder="e.g. eyewear store" className="input-premium" required suppressHydrationWarning />
        </div>
        <div>
          <label style={labelStyle}>City / Location {req}</label>
          <input type="text" value={form.city} onChange={(e) => update("city", e.target.value)}
            placeholder="e.g. Bengaluru" className="input-premium" required suppressHydrationWarning />
        </div>
      </div>

      {/* Email */}
      <div>
        <label style={labelStyle}>Your Email {req}</label>
        <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)}
          placeholder="you@example.com" className="input-premium" required suppressHydrationWarning />
        <p style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 6 }}>
          Used only to send you your report and occasional AEO tips. No spam.
        </p>
      </div>

      {/* API Key */}
      <div>
        <label style={labelStyle}>Gemini API Key {req}</label>
        <input type="password" value={form.apiKey} onChange={(e) => update("apiKey", e.target.value)}
          placeholder="AIza..." className="input-premium" style={{ fontFamily: "monospace", letterSpacing: "0.05em" }}
          autoComplete="off" required suppressHydrationWarning />
        <p style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 6 }}>
          Free key at <span style={{ fontFamily: "monospace", color: "var(--red)" }}>aistudio.google.com</span> · Uses gemini-2.5-flash (free tier)
        </p>
      </div>

      {/* Competitors */}
      <div>
        <label style={labelStyle}>Known Competitors <span style={{ color: "var(--text-tertiary)", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional, up to 3)</span></label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          {[0, 1, 2].map((i) => (
            <input key={i} type="text" value={form.competitors[i]} onChange={(e) => updateCompetitor(i, e.target.value)}
              placeholder={`Competitor ${i + 1}`} className="input-premium" suppressHydrationWarning />
          ))}
        </div>
      </div>

      {error && (
        <div style={{
          background: "rgba(255,67,86,0.05)", border: "1px solid rgba(255,67,86,0.18)",
          borderRadius: 12, padding: "12px 16px", fontSize: 13, color: "#C41230", fontWeight: 500,
        }}>{error}</div>
      )}

      <button type="submit" disabled={validating} className="btn-cta"
        style={{ width: "100%", fontSize: 15, height: 52 }} suppressHydrationWarning>
        {validating ? "Validating key..." : "Generate Audit Queries →"}
      </button>
    </form>
  );
}
