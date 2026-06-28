"use client";

import Link from "next/link";
import { useState } from "react";

const NAV_LINKS = [
  { label: "How it works", href: "#how" },
  { label: "Why AEO", href: "#why" },
  { label: "FAQ", href: "#faq" },
];

export default function NavBar() {
  const [menuOpen, setMenuOpen] = useState(false);

  function handleNavClick(href: string) {
    setMenuOpen(false);
    if (!href.startsWith("#")) return;
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <>
      <nav className="nav-bar">
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: "linear-gradient(135deg, #FF4356, #FF7A45)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ color: "#fff", fontSize: 10, fontWeight: 800 }}>AEO</span>
          </div>
          <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>Auditor</span>
        </div>

        {/* Desktop links */}
        <div className="nav-links-desktop">
          {NAV_LINKS.map(({ label, href }, i) => (
            <span key={label} style={{ display: "contents" }}>
              {i > 0 && <span className="nav-sep" />}
              <button className="nav-link" onClick={() => handleNavClick(href)}>
                {label}
              </button>
            </span>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="nav-links-desktop">
          <Link href="/audit" className="btn-ghost-sm">
            Launch Audit →
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="nav-hamburger"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          <span style={{ display: "block", width: 18, height: 1.5, background: "var(--text-primary)", borderRadius: 1, transition: "all 0.2s", transform: menuOpen ? "translateY(4px) rotate(45deg)" : "none" }} />
          <span style={{ display: "block", width: 18, height: 1.5, background: "var(--text-primary)", borderRadius: 1, transition: "all 0.2s", opacity: menuOpen ? 0 : 1 }} />
          <span style={{ display: "block", width: 18, height: 1.5, background: "var(--text-primary)", borderRadius: 1, transition: "all 0.2s", transform: menuOpen ? "translateY(-4px) rotate(-45deg)" : "none" }} />
        </button>
      </nav>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="nav-mobile-menu">
          {NAV_LINKS.map(({ label, href }) => (
            <button
              key={label}
              className="nav-mobile-link"
              onClick={() => handleNavClick(href)}
            >
              {label}
            </button>
          ))}
          <Link href="/audit" className="btn-cta" style={{ width: "100%", justifyContent: "center", height: 48, fontSize: 14 }} onClick={() => setMenuOpen(false)}>
            Launch Audit →
          </Link>
        </div>
      )}
    </>
  );
}
