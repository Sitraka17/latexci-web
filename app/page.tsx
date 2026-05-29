import type { Metadata } from "next";
import Link from "next/link";
import katex from "katex";
import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";
import AdUnit from "@/components/AdUnit";
import FaqAccordion from "@/components/FaqAccordion";

// Pre-render at build time — no runtime cost, pixel-perfect math
const HERO_FORMULA = katex.renderToString(
  "\\int_{-\\infty}^{+\\infty} e^{-x^2}\\,dx = \\sqrt{\\pi}",
  { displayMode: true, throwOnError: false, output: "html" }
);

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
  { href: "/tools/preview",       icon: "⚡", label: "Preview + PDF",  tag: "Live",    color: "#10b981",
    desc: "Paste .tex → equations render instantly via KaTeX. Export to PDF with one click." },
  { href: "/tools/diff",          icon: "↕",  label: "Diff",           tag: "Compare", color: "#7c6cf8",
    desc: "Two .tex files, side by side. Additions green, deletions red. Drag to resize." },
  { href: "/tools/word-to-latex", icon: "↗",  label: "Word → LaTeX",   tag: "Convert", color: "#f59e0b",
    desc: ".docx converts in-browser via mammoth.js — headings, tables, lists. Nothing uploaded." },
  { href: "/tools/table",         icon: "▦",  label: "Table Generator", tag: "Build",   color: "#06b6d4",
    desc: "Visual grid editor → booktabs or simple tabular. Copy LaTeX instantly." },
  { href: "/tools/templates",     icon: "▤",  label: "Templates",       tag: "Library", color: "#ec4899",
    desc: "11 templates: CV, thesis, IEEE, Beamer, Centrale Marseille, AMSE. One-click open." },
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
    a: ".docx (Word 2007+) converts directly in your browser via mammoth.js — the file is never uploaded anywhere. .odt and .rtf require pandoc installed locally; the tool shows you the exact command to run." },
  { q: "Is my LaTeX source stored anywhere?",
    a: "No. The preview, diff, table, and Word → LaTeX (.docx) tools all run entirely in your browser — nothing leaves your machine. The PDF export calls an external compile service (latexonline.cc) but sends only the LaTeX source text, not any identifying information." },
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

      {/* ── Announcement strip ──────────────────────────────── */}
      <div className="announce-strip" style={{
        background: "linear-gradient(90deg, rgba(0,56,168,0.08), rgba(124,108,248,0.08))",
        borderBottom: "1px solid rgba(124,108,248,0.18)",
        padding: "0.55rem 1.5rem",
        textAlign: "center",
        fontSize: "0.78rem",
        color: "var(--fg-muted)",
        lineHeight: 1.4,
      }}>
        <span style={{ marginRight: "0.4rem" }}>🆕</span>
        <strong style={{ color: "var(--accent2)" }}>New:</strong>
        <span className="announce-long">{" "}Centrale Marseille &amp; AMSE templates, PDF export, and Word → LaTeX improvements —{" "}</span>
        <span className="announce-short">{" "}</span>
        <a href="/tools/templates" style={{ color: "var(--accent)", fontWeight: 600, textDecoration: "none" }}>
          explore templates →
        </a>
      </div>

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

          {/* Right: product mockup — hidden on mobile (too tall) */}
          <div className="hero-mockup" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
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
              {/* KaTeX-rendered formula — pre-built at compile time */}
              <div
                style={{ color: "#111", overflowX: "auto" }}
                dangerouslySetInnerHTML={{ __html: HERO_FORMULA }}
              />
            </div>
          </div>
        </div>

      </section>

      {/* ── Mobile-only formula preview ─────────────────────── */}
      <div className="hero-mobile-preview" style={{
        display: "none",
        margin: "0 1.5rem 1.5rem",
        background: "#fdfcf8",
        borderRadius: 10,
        padding: "1rem 1.25rem",
        boxShadow: "0 4px 20px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.06)",
        color: "#111",
        fontFamily: "Georgia, 'Times New Roman', serif",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.5rem", paddingBottom: "0.4rem", borderBottom: "1px solid #e0dcd6" }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#10b981", display: "inline-block", boxShadow: "0 0 5px #10b981" }} />
          <span style={{ fontSize: "0.63rem", color: "#8a8078", fontFamily: "system-ui, sans-serif" }}>Preview · live</span>
        </div>
        <div style={{ fontSize: "0.92rem", fontWeight: 700, marginBottom: "0.3rem" }}>Gaussian Integral</div>
        <div style={{ fontSize: "0.79rem", color: "#444", marginBottom: "0.25rem" }}>A beautiful result in analysis:</div>
        <div style={{ color: "#111", overflowX: "auto" }} dangerouslySetInnerHTML={{ __html: HERO_FORMULA }} />
      </div>

      {/* ── Stats band ──────────────────────────────────────── */}
      <div style={{ borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", background: "var(--surface)" }}>
        <div className="stats-band" style={{
          maxWidth: 1100, margin: "0 auto", padding: "1rem 1.5rem",
          display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: "0.5rem",
        }}>
          {[
            { n: "11",   label: "Templates" },
            { n: "5",    label: "Tools" },
            { n: "0",    label: "Setup needed" },
            { n: "100%", label: "Free forever" },
          ].map(({ n, label }) => (
            <div key={label} style={{ textAlign: "center", padding: "0.35rem 1rem" }}>
              <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--accent2)", lineHeight: 1 }}>{n}</div>
              <div style={{ fontSize: "0.72rem", color: "var(--fg-muted)", marginTop: "0.2rem" }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tools ───────────────────────────────────────────── */}
      <section
        style={{
          padding: "2.5rem 1.5rem 2.5rem",
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
          Everything you need
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

      {/* ── Grande École callout ────────────────────────────────── */}
      <section style={{ padding: "0 1.5rem 1.25rem", maxWidth: 1100, margin: "0 auto", width: "100%" }}>
        <Link href="/tools/templates?cat=Grande+%C3%89cole" style={{ textDecoration: "none", display: "block" }}>
          <div className="ge-callout" style={{
            background: "linear-gradient(135deg, rgba(0,56,168,0.07) 0%, rgba(95,106,122,0.04) 100%)",
            border: "1px solid rgba(0,56,168,0.2)",
            borderLeft: "4px solid #003BA0",
            borderRadius: "0 10px 10px 0",
            padding: "1.1rem 1.5rem",
            display: "flex", alignItems: "center", gap: "1.25rem", flexWrap: "wrap",
            transition: "box-shadow 0.18s",
          }}>
            <span style={{ fontSize: "1.5rem", flexShrink: 0 }}>🏛️</span>
            <div style={{ flex: 1, minWidth: 200 }}>
              <p style={{ margin: "0 0 0.2rem", fontWeight: 700, fontSize: "0.9rem", color: "#003BA0" }}>
                Centrale Marseille &amp; AMSE templates
              </p>
              <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--fg-muted)" }}>
                Rapport de projet, rapport de stage, AMSE working paper — avec la mise en page officielle.
              </p>
            </div>
            <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#003BA0", flexShrink: 0 }}>
              Voir les templates →
            </span>
          </div>
        </Link>
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
        /* Hover effects */
        .callout-card:hover { border-color: var(--accent) !important; }
        .scenario-card > div { transition: border-color 0.18s, box-shadow 0.18s, transform 0.18s; }
        .scenario-card:hover > div { box-shadow: var(--shadow-md); transform: translateY(-1px); }
        .ge-callout:hover { box-shadow: var(--shadow-md); }

        /* KaTeX hero formula — keep it compact inside the preview card */
        .katex-display { margin: 0.4rem 0 !important; overflow-x: auto; }
        .katex-display > .katex { font-size: 1.05em !important; }

        /* Responsive: hero grid → single column */
        @media (max-width: 760px) {
          .hero-grid { grid-template-columns: 1fr !important; gap: 1.5rem !important; }
          .hero-mockup { display: none !important; }
          .hero-mobile-preview { display: block !important; }
        }

        /* Responsive: stats band — tighter on small screens */
        @media (max-width: 480px) {
          .stats-band { padding: 0.75rem 0.75rem !important; gap: 0 !important; }
          .stats-band > div { padding: 0.4rem 0.5rem !important; }
        }

        /* Announcement strip — hide long copy on tiny screens */
        .announce-short { display: none; }
        @media (max-width: 520px) {
          .announce-long { display: none; }
          .announce-short { display: inline; }
          .announce-strip { font-size: 0.72rem !important; }
        }

        /* Tool cards — 2 columns on mobile instead of 1 */
        @media (max-width: 540px) {
          .tool-card { min-width: 0 !important; }
        }

        /* Scenarios — full width on mobile */
        @media (max-width: 640px) {
          .scenario-card > div { border-left-width: 4px !important; }
        }

        /* GE callout — stack on mobile */
        @media (max-width: 540px) {
          .ge-callout { padding: 0.9rem 1rem !important; gap: 0.75rem !important; }
        }

        /* Academics callout — stack on mobile */
        @media (max-width: 640px) {
          .callout-card { padding: 1.4rem !important; gap: 1.25rem !important; }
          .callout-card > div:last-child { width: 100% !important; text-align: center !important; }
        }
      `}</style>
    </div>
  );
}
