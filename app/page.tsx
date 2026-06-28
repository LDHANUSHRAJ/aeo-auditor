import Link from "next/link";
import NavBar from "@/components/NavBar";

/* ── Abstract 3D hero scene (CSS + SVG, no Three.js) ────────────────────────── */
function HeroScene() {
  return (
    <div className="relative w-full h-full flex items-center justify-center" aria-hidden="true">
      {/* Red ambient glow — very subtle, behind everything */}
      <div className="red-ambient" style={{ width: 520, height: 520, top: "50%", left: "50%", transform: "translate(-50%,-50%)" }} />

      {/* Outer thin ring (SVG ellipse = tilted ring illusion) */}
      <svg viewBox="0 0 340 140" style={{ position: "absolute", width: 340, animation: "float-c 9s ease-in-out infinite", opacity: 0.55 }}>
        <ellipse cx="170" cy="70" rx="165" ry="60" fill="none" stroke="rgba(0,0,0,0.09)" strokeWidth="1.2" />
        <ellipse cx="170" cy="70" rx="135" ry="45" fill="none" stroke="rgba(0,0,0,0.055)" strokeWidth="0.8" />
      </svg>

      {/* Spinning wireframe ring */}
      <svg viewBox="0 0 200 200" style={{ position: "absolute", width: 200, animation: "spin-slow 28s linear infinite", opacity: 0.18 }}>
        <circle cx="100" cy="100" r="94" fill="none" stroke="#0A0A0A" strokeWidth="0.8" strokeDasharray="4 6" />
      </svg>

      {/* Large center sphere */}
      <div className="float-a" style={{
        position: "absolute",
        width: 148, height: 148,
        borderRadius: "50%",
        background: "radial-gradient(circle at 36% 28%, #fff 0%, #ededed 52%, #d8d8d8 100%)",
        boxShadow: "14px 22px 52px rgba(0,0,0,0.13), -4px -6px 20px rgba(255,255,255,0.9), inset -3px -5px 14px rgba(0,0,0,0.04)",
      }} />

      {/* Small sphere — top right */}
      <div className="float-b" style={{
        position: "absolute", top: "12%", right: "14%",
        width: 46, height: 46, borderRadius: "50%",
        background: "radial-gradient(circle at 38% 32%, #fff 0%, #e5e5e5 100%)",
        boxShadow: "4px 8px 22px rgba(0,0,0,0.1), inset -2px -2px 8px rgba(0,0,0,0.04)",
      }} />

      {/* Small sphere — bottom left */}
      <div className="float-c" style={{
        position: "absolute", bottom: "16%", left: "12%",
        width: 32, height: 32, borderRadius: "50%",
        background: "radial-gradient(circle at 38% 32%, #fff 0%, #e8e8e8 100%)",
        boxShadow: "3px 6px 16px rgba(0,0,0,0.09)",
      }} />

      {/* Medium sphere — top left */}
      <div style={{
        position: "absolute", top: "22%", left: "16%",
        width: 64, height: 64, borderRadius: "50%",
        background: "radial-gradient(circle at 36% 30%, #fff 0%, #e2e2e2 100%)",
        boxShadow: "6px 12px 28px rgba(0,0,0,0.1)",
        animation: "float-b 6.5s ease-in-out infinite 2s",
      }} />

      {/* Thin cylinder / rod */}
      <div style={{
        position: "absolute", top: "35%", right: "18%",
        width: 6, height: 80, borderRadius: 3,
        background: "linear-gradient(180deg, #e8e8e8, #c8c8c8)",
        boxShadow: "2px 4px 12px rgba(0,0,0,0.08)",
        animation: "float-a 8s ease-in-out infinite 1s",
      }} />

      {/* Tiny particle cluster */}
      {[
        { top: "18%", left: "38%", size: 6 } as const,
        { top: "72%", left: "62%", size: 4 } as const,
        { top: "55%", right: "10%", size: 5 } as const,
        { top: "8%",  left: "55%", size: 4 } as const,
      ].map((p, i) => {
        const { size, ...pos } = p;
        return (
          <div key={i} style={{
            position: "absolute", ...pos,
            width: size, height: size, borderRadius: "50%",
            background: "rgba(0,0,0,0.12)",
            animation: `float-${["a","b","c","b"][i]} ${[6,7,5,8][i]}s ease-in-out infinite ${i * 1.2}s`,
          }} />
        );
      })}

      {/* Inner thin ring — smaller, counter-rotating */}
      <svg viewBox="0 0 140 140" style={{ position: "absolute", width: 140, animation: "spin-slow-rev 18s linear infinite", opacity: 0.3 }}>
        <circle cx="70" cy="70" r="64" fill="none" stroke="#0A0A0A" strokeWidth="1" />
      </svg>
    </div>
  );
}

/* ── Floating analytics cards ────────────────────────────────────────────────── */
function ScoreCard() {
  return (
    <div className="float-card anim-fade-up-d3 p-4" style={{ width: 176 }}>
      <div style={{ fontSize: 11, color: "var(--text-tertiary)", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 8 }}>
        Visibility Score
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ position: "relative", width: 52, height: 52, flexShrink: 0 }}>
          <svg width="52" height="52" viewBox="0 0 52 52" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="26" cy="26" r="22" fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth="3.5" />
            <circle cx="26" cy="26" r="22" fill="none"
              stroke="url(#rg)" strokeWidth="3.5"
              strokeDasharray="138" strokeDashoffset="25"
              strokeLinecap="round" />
            <defs>
              <linearGradient id="rg" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FF4356" />
                <stop offset="100%" stopColor="#FF7A45" />
              </linearGradient>
            </defs>
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "var(--text-primary)" }}>82</div>
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700 }}>82</div>
          <div style={{ fontSize: 10, color: "#16a34a", fontWeight: 600 }}>Excellent</div>
        </div>
      </div>
    </div>
  );
}

function CompetitorsCard() {
  return (
    <div className="float-card anim-fade-up-d4 p-4" style={{ width: 188 }}>
      <div style={{ fontSize: 11, color: "var(--text-tertiary)", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 8 }}>
        AI Engines Tested
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        {["ChatGPT", "Gemini", "Claude", "Perplexity"].map((e) => (
          <div key={e} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 500 }}>{e}</span>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#16a34a" }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function MentionCard() {
  return (
    <div className="float-card anim-fade-up-d3 p-4" style={{ width: 164 }}>
      <div style={{ fontSize: 11, color: "var(--text-tertiary)", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 6 }}>
        Competitors Mentioned
      </div>
      <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.03em", color: "var(--text-primary)" }}>4</div>
      <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 2 }}>in AI responses</div>
    </div>
  );
}

function RecommendCard() {
  return (
    <div className="float-card anim-fade-up-d4 p-4" style={{ width: 196 }}>
      <div style={{ fontSize: 11, color: "var(--text-tertiary)", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 8 }}>
        Top Recommendation
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8, flexShrink: 0,
          background: "linear-gradient(135deg, rgba(255,67,86,0.1), rgba(255,67,86,0.06))",
          border: "1px solid rgba(255,67,86,0.15)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13,
        }}>⚙</div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.3 }}>Add FAQ Schema</div>
          <div style={{ fontSize: 10, color: "var(--text-tertiary)", marginTop: 2 }}>High priority</div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", paddingBottom: 80 }}>

      {/* ── Sticky nav ─────────────────────────────────────────────────────── */}
      <NavBar />

      {/* ── Main glass container ────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "96px 24px 32px" }}>
        <div className="glass-container" style={{ minHeight: 680, display: "flex", flexDirection: "column" }}>

          {/* ── Hero ─────────────────────────────────────────────────────────── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0, flex: 1, minHeight: 580 }}>

            {/* Left — copy */}
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "64px 56px" }}>
              <div className="label-tag label-dark anim-fade-up" style={{ marginBottom: 28, width: "fit-content" }}>
                AEO + SEO Visibility Platform
              </div>

              <h1 className="hero-heading anim-fade-up-d1" style={{ marginBottom: 24 }}>
                Know if AI<br />
                Can Find<br />
                <span style={{
                  background: "linear-gradient(135deg, #0A0A0A 60%, rgba(255,67,86,0.7) 100%)",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                }}>Your Business.</span>
              </h1>

              <p className="anim-fade-up-d2" style={{ fontSize: 16, color: "var(--text-secondary)", lineHeight: 1.65, maxWidth: 380, marginBottom: 36 }}>
                Measure your visibility across ChatGPT, Gemini and AI search engines.
                Understand why competitors are recommended before you are.
              </p>

              <div className="anim-fade-up-d3" style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <Link href="/audit" className="btn-cta">
                  Start Free Audit →
                </Link>
                <a href="#how" className="btn-secondary" style={{ height: 52 }}>
                  See how it works
                </a>
              </div>

              {/* Trust strip */}
              <div className="anim-fade-up-d4" style={{ marginTop: 44, paddingTop: 28, borderTop: "1px solid rgba(0,0,0,0.06)", display: "flex", alignItems: "center", gap: 24 }}>
                {[
                  { n: "2", label: "Audit engines" },
                  { n: "10", label: "Queries per audit" },
                  { n: "0¢", label: "Server-side AI cost" },
                ].map((s) => (
                  <div key={s.label}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>{s.n}</div>
                    <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — 3D scene + floating cards */}
            <div style={{ position: "relative" }}>
              <HeroScene />

              {/* Floating cards — absolutely positioned */}
              <div style={{ position: "absolute", top: 32, right: 24 }}><ScoreCard /></div>
              <div style={{ position: "absolute", top: 48, left: -12 }}><MentionCard /></div>
              <div style={{ position: "absolute", bottom: 40, right: 16 }}><CompetitorsCard /></div>
              <div style={{ position: "absolute", bottom: 32, left: 0 }}><RecommendCard /></div>
            </div>
          </div>

          {/* Bottom strip inside container */}
          <div style={{
            borderTop: "1px solid rgba(0,0,0,0.05)",
            padding: "20px 56px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "rgba(0,0,0,0.015)",
            borderRadius: "0 0 40px 40px",
          }}>
            <p style={{ fontSize: 11, color: "var(--text-tertiary)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              BYOK · Zero server-side AI cost · Your key never leaves your browser
            </p>
            <p style={{ fontSize: 12, color: "var(--text-tertiary)", maxWidth: 440, textAlign: "right" }}>
              All Gemini API calls are made directly from your browser to Google. We see nothing. Store nothing.
            </p>
          </div>
        </div>

        {/* ── How it works ──────────────────────────────────────────────────── */}
        <div id="how" style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, scrollMarginTop: 96 }}>
          {[
            { n: "01", tag: "Input", title: "Describe your business", body: "Name, category, city and your free Gemini API key. It stays in your browser tab — never touches our servers." },
            { n: "02", tag: "Pipeline", title: "AI runs your queries", body: "10 realistic customer questions are sent to Gemini one at a time. Each call answers AND self-analyzes in a single request — Option B architecture." },
            { n: "03", tag: "Report", title: "Get your dual score", body: "AEO score (AI visibility) + SEO score (Google ranking + technical health) side by side. Plus a unified prioritized fix list." },
          ].map((s) => (
            <div key={s.n} className="glass-container" style={{ padding: "36px 32px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
                <span style={{ fontSize: 40, fontWeight: 900, color: "rgba(0,0,0,0.05)", lineHeight: 1 }}>{s.n}</span>
                <span className="label-tag label-light" style={{ fontSize: 10 }}>{s.tag}</span>
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)", marginBottom: 10, letterSpacing: "-0.01em" }}>{s.title}</h3>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.65 }}>{s.body}</p>
            </div>
          ))}
        </div>

        {/* ── Why AEO/GEO ───────────────────────────────────────────────────── */}
        <div id="why" className="glass-container" style={{ marginTop: 12, padding: "56px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56, alignItems: "center", scrollMarginTop: 96 }}>
          <div>
            <div className="section-divider" />
            <h2 className="section-heading" style={{ marginBottom: 20 }}>
              Google rank ≠<br />AI visibility.
            </h2>
            <p style={{ fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 16, maxWidth: 420 }}>
              When someone asks Gemini <em>"best eyewear store in Bengaluru"</em> the AI doesn&rsquo;t show links — it picks a winner. If your business isn&rsquo;t that winner, you lost the customer before they saw your site.
            </p>
            <p style={{ fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.7, maxWidth: 420 }}>
              <strong style={{ color: "var(--text-primary)" }}>Answer Engine Optimization</strong> fixes this through structured data, authoritative citations, and content that directly answers questions AI assistants are being asked.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { label: "Traditional SEO", sub: "Rank in Google blue links", score: 88, good: true },
              { label: "AI Answer Visibility", sub: "Appear in ChatGPT / Gemini answers", score: 12, good: false },
            ].map((r) => (
              <div key={r.label} className="float-card" style={{ padding: "20px 22px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>{r.label}</p>
                    <p style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 2 }}>{r.sub}</p>
                  </div>
                  <span style={{ fontSize: 24, fontWeight: 800, color: r.good ? "#16a34a" : "var(--red)", letterSpacing: "-0.02em" }}>
                    {r.score}%
                  </span>
                </div>
                <div className="progress-bar-track">
                  <div className="progress-bar-fill" style={{ width: `${r.score}%`, background: r.good ? "#16a34a" : undefined }} />
                </div>
              </div>
            ))}
            <p style={{ fontSize: 11, color: "var(--text-tertiary)", textAlign: "center", marginTop: 4 }}>
              Typical business before fixes — audited with this tool
            </p>
          </div>
        </div>

        {/* ── FAQ ───────────────────────────────────────────────────────────── */}
        <div id="faq" className="glass-container" style={{ marginTop: 12, padding: "48px 56px", scrollMarginTop: 96 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 32, color: "var(--text-primary)" }}>
            Frequently asked
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {[
              { q: "Is my API key safe?", a: "Yes. It's held in browser memory only and never transmitted to our servers. All Gemini calls go from your device directly to Google's API." },
              { q: "Will it cost me money?", a: "The AEO audit uses gemini-2.5-flash which is free tier eligible. 10 queries should cost you absolutely nothing." },
              { q: "How long does it take?", a: "About 1 minute for 10 AEO queries (rate-limited to 10 RPM) plus ~20-30 seconds for the parallel SEO/Lighthouse audit." },
              { q: "Can I share my report?", a: "Every completed audit gets a shareable URL (/report/id) that you can send to clients, team, or save for later." },
            ].map((f) => (
              <div key={f.q} className="float-card" style={{ padding: "20px 22px" }}>
                <p style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)", marginBottom: 8 }}>{f.q}</p>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>{f.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── CTA ───────────────────────────────────────────────────────────── */}
        <div className="glass-container" style={{ marginTop: 12, padding: "64px 56px", textAlign: "center", position: "relative", overflow: "hidden" }}>
          <div className="red-ambient" style={{ width: 600, height: 400, top: "50%", left: "50%", transform: "translate(-50%,-50%)" }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <div className="label-tag label-dark" style={{ marginBottom: 20, display: "inline-flex" }}>Start free — no signup</div>
            <h2 className="section-heading" style={{ marginBottom: 16, maxWidth: 560, marginLeft: "auto", marginRight: "auto" }}>
              Find out where you stand<br />in under 2 minutes
            </h2>
            <p style={{ fontSize: 15, color: "var(--text-secondary)", marginBottom: 36, maxWidth: 440, margin: "0 auto 36px" }}>
              No account required. Your API key never leaves your browser. We never see it.
            </p>
            <Link href="/audit" className="btn-cta" style={{ fontSize: 16, height: 56 }}>
              Audit Your AI Visibility →
            </Link>
          </div>
        </div>

        <footer style={{ textAlign: "center", padding: "32px 0 0", fontSize: 12, color: "var(--text-tertiary)" }}>
          Built with Next.js · Gemini API (BYOK) · Supabase · Lighthouse
        </footer>
      </div>
    </div>
  );
}
