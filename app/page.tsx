import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";
import AdUnit from "@/components/AdUnit";
import FaqAccordion from "@/components/FaqAccordion";

export const metadata: Metadata = {
  title: "Free Online LaTeX Tools — Preview, Diff, Table Generator & More",
  description:
    "latexci: live LaTeX preview with KaTeX math, side-by-side diff, Word-to-LaTeX conversion, table generator, and templates — all free, in your browser, no signup.",
  keywords: [
    "latex preview online", "latex diff tool", "word to latex converter",
    "latex table generator", "latex equation preview", "online latex editor",
    "free latex tools", "latex thesis template", "overleaf alternative",
    "katex online renderer",
  ],
  alternates: { canonical: "/" },
};

// ── Data ───────────────────────────────────────────────────────────────────

const TOOLS = [
  { href: "/tools/preview",       icon: "⚡", label: "Preview",       tag: "Live",    color: "#10b981",
    desc: "Paste .tex → see equations render via KaTeX. Shareable URL." },
  { href: "/tools/diff",          icon: "↕",  label: "Diff",          tag: "Compare", color: "#7c6cf8",
    desc: "Two .tex files, side by side. Additions green, deletions red." },
  { href: "/tools/word-to-latex", icon: "↗",  label: "Word → LaTeX",  tag: "Convert", color: "#f59e0b",
    desc: "Upload .docx, .odt, or .rtf — get clean LaTeX source back." },
  { href: "/tools/table",         icon: "▦",  label: "Table",         tag: "New",     color: "#06b6d4",
    desc: "Visual grid → booktabs or simple tabular environment." },
  { href: "/tools/templates",     icon: "▤",  label: "Templates",     tag: "Library", color: "#ec4899",
    desc: "CV, thesis, IEEE paper, Beamer, cover letter. One-click open." },
];

const SCENARIOS = [
  {
    quote: "Meeting in two hours. Just need to check this equation renders before I send the chapter.",
    tool: "LaTeX Preview",
    href: "/tools/preview",
    color: "#10b981",
  },
  {
    quote: "Advisor sent back my draft with changes. Need to see exactly what they edited.",
    tool: "LaTeX Diff",
    href: "/tools/diff",
    color: "#7c6cf8",
  },
  {
    quote: "Collaborator left comments in a Word file. Need those back in LaTeX to merge.",
    tool: "Word → LaTeX",
    href: "/tools/word-to-latex",
    color: "#f59e0b",
  },
];

const FAQS = [
  { q: "Is latexci really free?",
    a: "Yes. All tools are free, there is no paid plan, and no account is required. The code is open source on GitHub under the MIT license." },
  { q: "Does the preview support math equations?",
    a: "Yes — inline math ($...$), display math (\\[...\\]), and block environments like align, gather, and equation all render via KaTeX, the same engine used by Khan Academy and Wikipedia." },
  { q: "What file types does Word → LaTeX accept?",
    a: ".docx (Word 2007+), .odt (LibreOffice), and .rtf. The conversion runs server-side via pandoc, and your file is deleted immediately after." },
  { q: "Is my LaTeX source stored anywhere?",
    a: "No. The preview, diff, and table tools run entirely in your browser — your LaTeX never leaves your machine. Only Word → LaTeX sends a file to our server, only to convert it." },
  { q: "How is this different from Overleaf?",
    a: "Overleaf is a full collaborative editor that compiles real LaTeX. latexci is for the quick in-between moments: checking if a formula renders, reviewing a diff, or converting a Word file — without logging in or waiting for compilation." },
  { q: "Can I use latexci offline?",
    a: "Preview, diff, and table work fully offline once the page is loaded. Word → LaTeX needs a connection. The preview tool also supports shareable URLs via LZ compression." },
];

// ── Structured data ────────────────────────────────────────────────────────

const SCHEMAS = [
  {
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: FAQS.map(f => ({ "@type": "Question", name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a } })),
  },
  {
    "@context": "https://schema.org", "@type": "SoftwareApplication",
    name: "latexci", applicationCategory: "DeveloperApplication",
    operatingSystem: "Web Browser",
    description: "Free browser-based LaTeX tools: live preview, diff, Word to LaTeX, table generator, templates.",
    url: "https://latexci-web.vercel.app",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  },
  {
    "@context": "https://schema.org", "@type": "WebSite",
    name: "latexci", url: "https://latexci-web.vercel.app",
    description: "Free online LaTeX tools for researchers and students.",
  },
];

// ── Page ───────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {SCHEMAS.map((s, i) => (
        <script key={i} type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }} />
      ))}

      <Navbar />

      {/* ── Hero ────────────────────────────────────────────── */}
      <section
        className="has-grid"
        style={{ padding: "4rem 1.5rem 3.5rem" }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "4rem",
            alignItems: "center",
          }}
          className="hero-grid"
        >
          {/* Left: text */}
          <div>
            <h1
              style={{
                fontSize: "clamp(2rem, 4.5vw, 3.2rem)",
                fontWeight: 800,
                lineHeight: 1.1,
                letterSpacing: "-0.04em",
                marginBottom: "1.1rem",
                color: "var(--fg)",
              }}
            >
              LaTeX in your browser.
              <br />
              <span
                style={{
                  background: "linear-gradient(135deg, var(--accent), var(--accent2))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                No setup.
              </span>
            </h1>

            <p
              style={{
                fontSize: "1rem",
                color: "var(--fg-muted)",
                lineHeight: 1.8,
                maxWidth: 420,
                marginBottom: "2rem",
              }}
            >
              Preview equations, compare revisions, convert Word files, and
              generate tables — all in a tab, all free, no account needed.
            </p>

            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <Link
                href="/tools/preview"
                style={{
                  display: "inline-flex", alignItems: "center", gap: "0.4rem",
                  padding: "0.72rem 1.6rem", borderRadius: 8,
                  background: "linear-gradient(135deg, var(--accent), var(--accent2))",
                  color: "#fff", fontWeight: 700, fontSize: "0.92rem",
                  textDecoration: "none",
                  boxShadow: "0 4px 18px color-mix(in srgb, var(--accent) 40%, transparent)",
                }}
              >
                Open Preview
              </Link>
              <Link
                href="/tools/templates"
                style={{
                  display: "inline-flex", alignItems: "center", gap: "0.4rem",
                  padding: "0.72rem 1.4rem", borderRadius: 8,
                  background: "var(--surface)", color: "var(--fg)",
                  fontWeight: 600, fontSize: "0.92rem", textDecoration: "none",
                  border: "1px solid var(--border)",
                }}
              >
                Browse templates
              </Link>
            </div>

            <p style={{ marginTop: "1.5rem", fontSize: "0.76rem", color: "var(--fg-muted)" }}>
              Works in any browser · Files never stored · Open source
            </p>
          </div>

          {/* Right: product mockup */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {/* Editor card */}
            <div
              style={{
                background: "#1e1e1e",
                borderRadius: 10,
                overflow: "hidden",
                boxShadow: "0 8px 40px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.05)",
              }}
            >
              {/* Window chrome */}
              <div
                style={{
                  background: "#141419",
                  padding: "0.55rem 0.9rem",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  borderBottom: "1px solid #2c2c3e",
                }}
              >
                {["#ff5f57", "#ffbd2e", "#28c840"].map((c) => (
                  <span key={c}
                    style={{ width: 10, height: 10, borderRadius: "50%", background: c, display: "inline-block" }} />
                ))}
                <span
                  style={{
                    marginLeft: 8, fontSize: "0.68rem",
                    color: "#5a5878",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  main.tex
                </span>
              </div>
              {/* Code */}
              <div
                style={{
                  padding: "0.9rem 1rem",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.72rem",
                  lineHeight: 1.75,
                }}
              >
                <div><span style={{ color: "#569cd6" }}>{"\\section"}</span><span style={{ color: "#ce9178" }}>{"{"}</span><span style={{ color: "#d4d4d4" }}>Gaussian Integral</span><span style={{ color: "#ce9178" }}>{"}"}</span></div>
                <div style={{ color: "#d4d4d4" }}>A beautiful result in analysis:</div>
                <div style={{ color: "#9cdcfe", marginTop: "0.2rem" }}>{"\\["}</div>
                <div style={{ paddingLeft: "1.2rem", color: "#b5cea8" }}>{"  \\int_{-\\infty}^{\\infty}"}</div>
                <div style={{ paddingLeft: "1.2rem", color: "#b5cea8" }}>{"    e^{-x^2}\\,dx = \\sqrt{\\pi}"}</div>
                <div style={{ color: "#9cdcfe" }}>{"\\]"}</div>
              </div>
            </div>

            {/* Preview card */}
            <div
              style={{
                background: "#fdfcf8",
                borderRadius: 10,
                padding: "1.1rem 1.4rem",
                boxShadow: "0 4px 20px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.06)",
                fontFamily: "Georgia, 'Times New Roman', serif",
                color: "#111",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  marginBottom: "0.65rem",
                  paddingBottom: "0.45rem",
                  borderBottom: "1px solid #e0dcd6",
                }}
              >
                <span style={{
                  width: 7, height: 7, borderRadius: "50%",
                  background: "#10b981", display: "inline-block",
                  boxShadow: "0 0 5px #10b981",
                }} />
                <span style={{ fontSize: "0.65rem", color: "#8a8078", fontFamily: "system-ui, sans-serif" }}>
                  Preview · live
                </span>
              </div>
              <div style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.35rem" }}>
                Gaussian Integral
              </div>
              <div style={{ fontSize: "0.82rem", color: "#333", marginBottom: "0.5rem" }}>
                A beautiful result in analysis:
              </div>
              <div
                style={{
                  textAlign: "center",
                  fontSize: "1.05rem",
                  padding: "0.5rem 0",
                  color: "#111",
                  letterSpacing: "0.01em",
                }}
              >
                ∫<sub>−∞</sub><sup>+∞</sup> e<sup>−x²</sup> dx = √π
              </div>
            </div>
          </div>
        </div>

        <style>{`
          @media (max-width: 760px) {
            .hero-grid { grid-template-columns: 1fr !important; gap: 2rem !important; }
          }
        `}</style>
      </section>

      {/* ── Tools ───────────────────────────────────────────── */}
      <section
        style={{
          padding: "2rem 1.5rem 2.5rem",
          maxWidth: 1100,
          margin: "0 auto",
          width: "100%",
        }}
      >
        <p
          style={{
            fontSize: "0.7rem",
            fontWeight: 700,
            color: "var(--fg-muted)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            marginBottom: "1rem",
          }}
        >
          Five tools
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "0.75rem",
          }}
        >
          {TOOLS.map((t) => (
            <Link key={t.href} href={t.href} className="tool-card" style={{ textDecoration: "none" }}>
              <div
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  padding: "1.25rem",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.45rem",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <span style={{ fontSize: "1.1rem", color: "var(--fg-muted)", fontFamily: "monospace" }}>
                    {t.icon}
                  </span>
                  <span
                    style={{
                      fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.05em",
                      padding: "0.15rem 0.45rem", borderRadius: 999,
                      background: `${t.color}1a`, color: t.color,
                      border: `1px solid ${t.color}33`,
                    }}
                  >
                    {t.tag}
                  </span>
                </div>
                <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--fg)" }}>{t.label}</div>
                <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--fg-muted)", lineHeight: 1.6, flex: 1 }}>
                  {t.desc}
                </p>
                <span style={{ fontSize: "0.75rem", color: "var(--accent)", fontWeight: 600, marginTop: "0.25rem" }}>
                  Open →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Ad unit ─────────────────────────────────────────── */}
      <div style={{ maxWidth: 1100, margin: "0 auto", width: "100%", padding: "0 1.5rem" }}>
        <AdUnit />
      </div>

      {/* ── Scenarios ───────────────────────────────────────── */}
      <section
        style={{
          padding: "2.5rem 1.5rem 3rem",
          maxWidth: 1100,
          margin: "0 auto",
          width: "100%",
        }}
      >
        <p
          style={{
            fontSize: "0.7rem",
            fontWeight: 700,
            color: "var(--fg-muted)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            marginBottom: "1rem",
          }}
        >
          Built for these moments
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "0.75rem",
          }}
        >
          {SCENARIOS.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              style={{ textDecoration: "none" }}
              className="scenario-card"
            >
              <div
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderLeft: `3px solid ${s.color}`,
                  borderRadius: "0 10px 10px 0",
                  padding: "1.3rem 1.4rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.9rem",
                  height: "100%",
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.9rem",
                    color: "var(--fg)",
                    lineHeight: 1.65,
                    fontStyle: "italic",
                    flex: 1,
                  }}
                >
                  &ldquo;{s.quote}&rdquo;
                </p>
                <span
                  style={{
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    color: s.color,
                  }}
                >
                  → {s.tool}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Academics callout ────────────────────────────────── */}
      <section
        style={{
          padding: "0 1.5rem 3rem",
          maxWidth: 1100,
          margin: "0 auto",
          width: "100%",
        }}
      >
        <Link href="/academics" style={{ textDecoration: "none", display: "block" }}>
          <div
            className="callout-card"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: "2rem 2.25rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "2rem",
              flexWrap: "wrap",
              transition: "border-color 0.18s",
            }}
          >
            <div>
              <p style={{
                margin: "0 0 0.4rem",
                fontSize: "0.7rem",
                fontWeight: 700,
                color: "var(--accent2)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}>
                For PhD students & researchers
              </p>
              <h2 style={{ margin: "0 0 0.4rem", fontSize: "1.2rem", fontWeight: 700, color: "var(--fg)" }}>
                Writing a thesis?
              </h2>
              <p style={{
                margin: 0, fontSize: "0.85rem",
                color: "var(--fg-muted)", lineHeight: 1.7, maxWidth: 460,
              }}>
                PhD thesis templates, 12-package reference guide, advisor diff
                workflow, and every tool you need for heavy LaTeX documents.
              </p>
            </div>
            <span
              style={{
                display: "inline-flex", alignItems: "center",
                padding: "0.65rem 1.4rem", borderRadius: 8,
                background: "linear-gradient(135deg, var(--accent), var(--accent2))",
                color: "#fff", fontWeight: 700, fontSize: "0.88rem", flexShrink: 0,
              }}
            >
              Academics hub →
            </span>
          </div>
        </Link>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────── */}
      <section
        style={{
          padding: "0 1.5rem 5rem",
          maxWidth: 740,
          margin: "0 auto",
          width: "100%",
        }}
      >
        <h2
          style={{
            fontSize: "1.2rem",
            fontWeight: 700,
            marginBottom: "1.25rem",
            color: "var(--fg)",
          }}
        >
          Questions
        </h2>
        <FaqAccordion items={FAQS} />
      </section>

      <SiteFooter />

      <style>{`
        .callout-card:hover { border-color: var(--accent) !important; }
        .scenario-card > div { transition: border-color 0.18s, box-shadow 0.18s, transform 0.18s; }
        .scenario-card:hover > div { box-shadow: var(--shadow-md); transform: translateY(-1px); }
      `}</style>
    </div>
  );
}
