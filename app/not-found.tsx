import Link from "next/link";
import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";

const TOOLS = [
  { href: "/tools/preview",       label: "LaTeX Preview",     icon: "⚡" },
  { href: "/tools/diff",          label: "LaTeX Diff",        icon: "↕" },
  { href: "/tools/word-to-latex", label: "Word → LaTeX",      icon: "↗" },
  { href: "/tools/table",         label: "Table Generator",   icon: "▦" },
  { href: "/tools/templates",     label: "Templates",         icon: "▤" },
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
        {/* LaTeX-style error block */}
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.78rem",
            color: "var(--fg-muted)",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            padding: "1.25rem 1.75rem",
            marginBottom: "2.5rem",
            lineHeight: 2,
            textAlign: "left",
            maxWidth: 500,
            width: "100%",
            boxShadow: "var(--shadow-md)",
          }}
        >
          <div>
            <span style={{ color: "var(--fg-muted)", opacity: 0.6 }}>!</span>{" "}
            <span style={{ color: "var(--red)" }}>LaTeX Error:</span>{" "}
            <span style={{ color: "var(--fg)" }}>Page not found.</span>
          </div>
          <div style={{ opacity: 0.55, marginLeft: "1rem" }}>
            See the latexci documentation for explanation.
          </div>
          <div style={{ marginTop: "0.25rem" }}>
            <span style={{ color: "var(--fg-muted)", opacity: 0.6 }}>l.404</span>{" "}
            <span style={{ color: "var(--accent2)" }}>\href{"{"}</span>
            <span style={{ color: "var(--red)" }}>this-page</span>
            <span style={{ color: "var(--accent2)" }}>{"}"}</span>
            <span style={{ color: "var(--fg-muted)" }}>{"{"}</span>
            <span style={{ color: "#ce9178" }}>undefined</span>
            <span style={{ color: "var(--fg-muted)" }}>{"}"}</span>
          </div>
          <div style={{ marginTop: "0.5rem", opacity: 0.45, fontSize: "0.72rem" }}>
            ? x to quit, &lt;RETURN&gt; to proceed, or press Ctrl+C
          </div>
        </div>

        <h1
          style={{
            fontSize: "clamp(1.5rem, 4vw, 2rem)",
            fontWeight: 800,
            letterSpacing: "-0.03em",
            marginBottom: "0.6rem",
            color: "var(--fg)",
          }}
        >
          This page doesn&apos;t compile.
        </h1>
        <p
          style={{
            color: "var(--fg-muted)",
            fontSize: "0.9rem",
            marginBottom: "3rem",
            maxWidth: 380,
            lineHeight: 1.75,
          }}
        >
          The URL might be wrong, or this page was removed.
          Try one of the tools below — they definitely exist.
        </p>

        {/* Tool quick-links */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: "0.6rem",
            marginBottom: "2.5rem",
            width: "100%",
            maxWidth: 560,
          }}
        >
          {TOOLS.map(({ href, label, icon }) => (
            <Link
              key={href}
              href={href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.65rem 0.9rem",
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--fg-muted)",
                fontSize: "0.83rem",
                fontWeight: 500,
                textDecoration: "none",
                transition: "border-color 0.15s, color 0.15s, background 0.15s",
              }}
            >
              <span style={{ fontSize: "1rem" }}>{icon}</span>
              {label}
            </Link>
          ))}
        </div>

        <Link
          href="/"
          style={{
            padding: "0.65rem 1.75rem",
            borderRadius: 8,
            background: "linear-gradient(135deg, var(--accent), var(--accent2))",
            color: "#fff",
            fontWeight: 700,
            fontSize: "0.9rem",
            textDecoration: "none",
            boxShadow: "0 4px 18px color-mix(in srgb, var(--accent) 35%, transparent)",
          }}
        >
          ← Back to home
        </Link>
      </main>

      <SiteFooter />
    </div>
  );
}
