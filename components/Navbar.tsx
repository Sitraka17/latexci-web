"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const tools = [
  { href: "/tools/preview", label: "Preview" },
  { href: "/tools/diff", label: "Diff" },
  { href: "/tools/word-to-latex", label: "Word → LaTeX" },
  { href: "/tools/templates", label: "Templates" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav
      aria-label="Main navigation"
      style={{
        background: "rgba(10,10,15,0.88)",
        borderBottom: "1px solid var(--border)",
        backdropFilter: "blur(12px)",
        position: "sticky", top: 0, zIndex: 50,
      }}
    >
      <div style={{
        maxWidth: 1200, margin: "0 auto", padding: "0 1.25rem",
        display: "flex", alignItems: "center", height: 56, gap: "1.5rem",
      }}>
        {/* Logo */}
        <Link href="/" style={{
          fontWeight: 800, fontSize: "1.1rem", letterSpacing: "-0.02em",
          textDecoration: "none", flexShrink: 0,
        }}>
          <span style={{
            background: "linear-gradient(135deg, var(--accent), var(--accent2))",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>latexci</span>
        </Link>

        {/* Desktop nav links */}
        <div className="desktop-nav" style={{ display: "flex", gap: "0.2rem", flex: 1 }}>
          {tools.map(t => (
            <Link key={t.href} href={t.href} style={{
              padding: "0.3rem 0.8rem", borderRadius: 6, fontSize: "0.85rem", fontWeight: 500,
              textDecoration: "none",
              color: pathname === t.href ? "var(--fg)" : "var(--fg-muted)",
              background: pathname === t.href ? "var(--surface2)" : "transparent",
              border: pathname === t.href ? "1px solid var(--border)" : "1px solid transparent",
            }}>
              {t.label}
            </Link>
          ))}
        </div>

        {/* Pro teaser */}
        <a href="https://github.com/Sitraka17/latexci-web/discussions" target="_blank" rel="noopener noreferrer"
          className="desktop-nav"
          style={{
            display: "flex", alignItems: "center", gap: "0.35rem",
            padding: "0.3rem 0.75rem", borderRadius: 6,
            background: "linear-gradient(135deg, rgba(108,99,255,0.15), rgba(167,139,250,0.15))",
            border: "1px solid rgba(108,99,255,0.35)",
            fontSize: "0.78rem", fontWeight: 600, color: "var(--accent2)",
            textDecoration: "none", flexShrink: 0,
          }}>
          ✨ Pro — coming soon
        </a>

        {/* GitHub */}
        <a href="https://github.com/Sitraka17/latexci-web" target="_blank" rel="noopener noreferrer"
          className="desktop-nav"
          style={{
            display: "flex", alignItems: "center", gap: "0.35rem",
            fontSize: "0.82rem", color: "var(--fg-muted)", textDecoration: "none",
            padding: "0.3rem 0.7rem", borderRadius: 6,
            border: "1px solid var(--border)", background: "var(--surface)", flexShrink: 0,
          }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
          GitHub
        </a>

        {/* Hamburger (mobile) */}
        <button
          className="mobile-menu-btn"
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(o => !o)}
          style={{
            display: "none", background: "none", border: "none",
            color: "var(--fg)", cursor: "pointer", padding: "0.4rem",
            flexDirection: "column", gap: "4px", flexShrink: 0,
          }}
        >
          <span style={{ display: "block", width: 20, height: 2, background: "currentColor", transition: "all 0.2s", transform: menuOpen ? "rotate(45deg) translate(4px, 4px)" : "none" }} />
          <span style={{ display: "block", width: 20, height: 2, background: "currentColor", opacity: menuOpen ? 0 : 1, transition: "opacity 0.2s" }} />
          <span style={{ display: "block", width: 20, height: 2, background: "currentColor", transition: "all 0.2s", transform: menuOpen ? "rotate(-45deg) translate(4px, -4px)" : "none" }} />
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div style={{
          borderTop: "1px solid var(--border)", background: "var(--surface)",
          padding: "0.5rem 1.25rem 1rem",
        }}>
          {tools.map(t => (
            <Link key={t.href} href={t.href} onClick={() => setMenuOpen(false)} style={{
              display: "block", padding: "0.6rem 0",
              borderBottom: "1px solid var(--border)", fontSize: "0.9rem",
              color: pathname === t.href ? "var(--accent)" : "var(--fg)", textDecoration: "none",
              fontWeight: pathname === t.href ? 600 : 400,
            }}>
              {t.label}
            </Link>
          ))}
          <a href="https://github.com/Sitraka17/latexci-web" target="_blank" rel="noopener noreferrer"
            style={{ display: "block", padding: "0.6rem 0", fontSize: "0.9rem", color: "var(--fg-muted)", textDecoration: "none" }}>
            GitHub ↗
          </a>
        </div>
      )}

      <style>{`
        @media (max-width: 700px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; margin-left: auto; }
        }
      `}</style>
    </nav>
  );
}
