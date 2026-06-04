"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import ThemeToggle from "./ThemeToggle";
import AuthButton from "./AuthButton";

const tools = [
  { href: "/tools/preview",      label: "Preview" },
  { href: "/tools/diff",         label: "Diff" },
  { href: "/tools/word-to-latex",label: "Word → LaTeX" },
  { href: "/tools/bibtex",       label: "BibTeX" },
  { href: "/tools/symbols",      label: "Symbols" },
  { href: "/tools/table",        label: "Table" },
  { href: "/tools/templates",    label: "Templates" },
  { href: "/academics",          label: "Academics" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav
      aria-label="Main navigation"
      style={{
        background: "var(--nav-bg)",
        borderBottom: "1px solid var(--nav-border)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        style={{
          maxWidth: 1160,
          margin: "0 auto",
          padding: "0 1.25rem",
          display: "flex",
          alignItems: "center",
          height: 54,
          gap: "0.25rem",
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          style={{
            fontWeight: 800,
            fontSize: "1.05rem",
            letterSpacing: "-0.03em",
            textDecoration: "none",
            flexShrink: 0,
            marginRight: "0.75rem",
          }}
        >
          <span
            style={{
              background: "linear-gradient(135deg, var(--accent), var(--accent2))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            latexci
          </span>
        </Link>

        {/* Desktop nav links */}
        <div
          className="desktop-nav"
          style={{ display: "flex", gap: "0.1rem", flex: 1, alignItems: "center" }}
        >
          {tools.map((t) => {
            const active = pathname === t.href;
            return (
              <Link
                key={t.href}
                href={t.href}
                style={{
                  padding: "0.3rem 0.75rem",
                  borderRadius: 6,
                  fontSize: "0.84rem",
                  fontWeight: active ? 600 : 400,
                  textDecoration: "none",
                  color: active ? "var(--fg)" : "var(--fg-muted)",
                  background: active ? "var(--surface2)" : "transparent",
                  border: active ? "1px solid var(--border)" : "1px solid transparent",
                  transition: "color 0.15s, background 0.15s",
                }}
              >
                {t.label}
              </Link>
            );
          })}
        </div>

        {/* Right side actions */}
        <div
          className="desktop-nav"
          style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}
        >
          <ThemeToggle />

          <AuthButton />

          <Link
            href="/pricing"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.3rem",
              padding: "0.3rem 0.85rem",
              borderRadius: 6,
              background: "color-mix(in srgb, var(--accent) 12%, transparent)",
              border: "1px solid color-mix(in srgb, var(--accent) 35%, transparent)",
              fontSize: "0.78rem",
              fontWeight: 700,
              color: "var(--accent2)",
              textDecoration: "none",
              letterSpacing: "0.01em",
            }}
          >
            ✦ Pricing
          </Link>

          {/* Discord community button */}
          <a
            href="https://discord.gg/latexci"
            target="_blank"
            rel="noopener noreferrer"
            title="Join the latexci Discord community"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              fontSize: "0.82rem",
              color: "#5865F2",
              textDecoration: "none",
              padding: "0.3rem 0.65rem",
              borderRadius: 6,
              border: "1px solid rgba(88,101,242,0.35)",
              background: "rgba(88,101,242,0.08)",
              fontWeight: 600,
              transition: "background 0.15s, border-color 0.15s",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "rgba(88,101,242,0.16)";
              e.currentTarget.style.borderColor = "rgba(88,101,242,0.6)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "rgba(88,101,242,0.08)";
              e.currentTarget.style.borderColor = "rgba(88,101,242,0.35)";
            }}
          >
            {/* Discord logo */}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.001.022.013.043.031.056a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
            </svg>
            Community
          </a>

          <a
            href="https://github.com/Sitraka17/latexci-web"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              fontSize: "0.82rem",
              color: "var(--fg-muted)",
              textDecoration: "none",
              padding: "0.3rem 0.65rem",
              borderRadius: 6,
              border: "1px solid var(--border)",
              background: "var(--surface)",
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            GitHub
          </a>
        </div>

        {/* Mobile: theme toggle + hamburger */}
        <div
          className="mobile-controls"
          style={{ display: "none", alignItems: "center", gap: "0.5rem", marginLeft: "auto" }}
        >
          <ThemeToggle />
          <button
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
            style={{
              background: "none",
              border: "none",
              color: "var(--fg)",
              cursor: "pointer",
              /* min 44×44 px touch target (Apple HIG + WCAG 2.5.8) */
              padding: "0.6rem",
              minWidth: 44,
              minHeight: 44,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
            }}
          >
            <span
              style={{
                display: "block", width: 20, height: 2,
                background: "currentColor", transition: "all 0.2s",
                transform: menuOpen ? "rotate(45deg) translate(4px, 4px)" : "none",
              }}
            />
            <span
              style={{
                display: "block", width: 20, height: 2,
                background: "currentColor",
                opacity: menuOpen ? 0 : 1, transition: "opacity 0.2s",
              }}
            />
            <span
              style={{
                display: "block", width: 20, height: 2,
                background: "currentColor", transition: "all 0.2s",
                transform: menuOpen ? "rotate(-45deg) translate(4px, -4px)" : "none",
              }}
            />
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div
          style={{
            borderTop: "1px solid var(--border)",
            background: "var(--surface)",
            padding: "0.5rem 1.25rem 1rem",
            /* Safe-area bottom padding for iPhone home indicator */
            paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
          }}
        >
          {tools.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              onClick={() => setMenuOpen(false)}
              style={{
                display: "block",
                padding: "0.7rem 0",
                borderBottom: "1px solid var(--border)",
                fontSize: "0.9rem",
                color: pathname === t.href ? "var(--accent)" : "var(--fg)",
                textDecoration: "none",
                fontWeight: pathname === t.href ? 600 : 400,
              }}
            >
              {t.label}
            </Link>
          ))}
          <Link
            href="/pricing"
            onClick={() => setMenuOpen(false)}
            style={{
              display: "block",
              padding: "0.7rem 0",
              borderBottom: "1px solid var(--border)",
              fontSize: "0.9rem",
              color: pathname === "/pricing" ? "var(--accent)" : "var(--accent2)",
              textDecoration: "none",
              fontWeight: 700,
            }}
          >
            ✦ Pricing
          </Link>
          <a
            href="https://discord.gg/latexci"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setMenuOpen(false)}
            style={{
              display: "block",
              padding: "0.7rem 0",
              borderBottom: "1px solid var(--border)",
              fontSize: "0.9rem",
              color: "#5865F2",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            💬 Discord community ↗
          </a>
          <a
            href="https://github.com/Sitraka17/latexci-web"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "block",
              padding: "0.7rem 0",
              borderBottom: "1px solid var(--border)",
              fontSize: "0.9rem",
              color: "var(--fg-muted)",
              textDecoration: "none",
            }}
          >
            GitHub ↗
          </a>
          {/* Auth button — sign in / account (important for mobile users) */}
          <div style={{ paddingTop: "0.75rem" }}>
            <AuthButton />
          </div>
        </div>
      )}

      <style>{`
        /* Collapse to hamburger at 900px — covers all phones and most tablets.
           At 900px the desktop nav (8 tools + 4 action buttons) is too cramped. */
        @media (max-width: 900px) {
          .desktop-nav { display: none !important; }
          .mobile-controls { display: flex !important; }
        }
      `}</style>
    </nav>
  );
}
