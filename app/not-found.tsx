import Link from "next/link";
import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";

const TOOLS = [
  { href: "/tools/preview",       label: "LaTeX Preview" },
  { href: "/tools/diff",          label: "LaTeX Diff" },
  { href: "/tools/word-to-latex", label: "Word → LaTeX" },
  { href: "/tools/table",         label: "Table Generator" },
  { href: "/tools/templates",     label: "Templates" },
];

export default function NotFound() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />

      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "4rem 1.5rem",
          textAlign: "center",
        }}
      >
        {/* Code-style 404 */}
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.8rem",
            color: "var(--fg-muted)",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: "1rem 1.5rem",
            marginBottom: "2rem",
            lineHeight: 1.7,
          }}
        >
          <span style={{ color: "var(--red)" }}>Error</span>
          {" "}<span style={{ color: "var(--accent2)" }}>404</span>
          {" — "}<span style={{ color: "var(--fg-muted)" }}>page not found</span>
        </div>

        <h1
          style={{
            fontSize: "clamp(1.6rem, 4vw, 2.2rem)",
            fontWeight: 800,
            letterSpacing: "-0.03em",
            marginBottom: "0.6rem",
            color: "var(--fg)",
          }}
        >
          This page doesn&apos;t exist.
        </h1>
        <p
          style={{
            color: "var(--fg-muted)",
            fontSize: "0.92rem",
            marginBottom: "2.5rem",
            maxWidth: 380,
            lineHeight: 1.7,
          }}
        >
          The URL might be wrong, or this page was removed.
          Try one of the tools below.
        </p>

        {/* Tool quick-links */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.6rem",
            justifyContent: "center",
            marginBottom: "2rem",
          }}
        >
          {TOOLS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              style={{
                padding: "0.45rem 1rem",
                borderRadius: 7,
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--fg-muted)",
                fontSize: "0.85rem",
                textDecoration: "none",
                transition: "border-color 0.15s, color 0.15s",
              }}
            >
              {label}
            </Link>
          ))}
        </div>

        <Link
          href="/"
          style={{
            padding: "0.6rem 1.5rem",
            borderRadius: 8,
            background: "linear-gradient(135deg, var(--accent), var(--accent2))",
            color: "#fff",
            fontWeight: 600,
            fontSize: "0.88rem",
            textDecoration: "none",
          }}
        >
          ← Back to home
        </Link>
      </main>

      <SiteFooter />
    </div>
  );
}
