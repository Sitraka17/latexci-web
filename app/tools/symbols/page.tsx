import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";
import Link from "next/link";
import SymbolSearch from "@/components/SymbolSearch";
import { breadcrumbSchema } from "@/lib/breadcrumbs";
import { SYMBOLS, CATEGORIES } from "@/lib/symbols";
import { symbolsByCategory, symbolSlug, titleCase } from "@/lib/seo-pages";

export const metadata: Metadata = {
  title: "LaTeX Symbol Search — 380+ Symbols with Live Preview",
  description:
    "Search 380+ LaTeX symbols by name, command, or Unicode — Greek, operators, arrows, logic, physics, stats. One-click copy with live KaTeX preview. Faster than Detexify.",
  keywords: [
    "latex symbols",
    "latex symbol search",
    "find latex command",
    "latex math symbols",
    "latex greek letters",
    "latex arrows list",
    "latex operators",
    "detexify alternative",
    "latex symbol list",
    "katex symbols",
    "latex physics symbols",
    "latex statistics symbols",
    "argmax latex",
    "latex expected value symbol",
    "latex big O notation",
    "latex braket notation",
  ],
  alternates: { canonical: "/tools/symbols" },
  openGraph: {
    title: "LaTeX Symbol Search — latexci",
    description: "Find any LaTeX symbol instantly. Search by name, command, or Unicode. Live KaTeX preview.",
    url: "/tools/symbols",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LaTeX Symbol Search — 380+ Symbols with Live Preview — latexci",
    description: "Find any LaTeX symbol instantly. Search by name, command, or Unicode. Live KaTeX preview.",
  },
};

export default function SymbolsPage() {
  const totalSymbols = SYMBOLS.length;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema({ name: "Symbol Search", path: "/tools/symbols" })) }} />
      <Navbar />

      <main style={{ flex: 1 }}>
        {/* Hero */}
        <section style={{
          padding: "3.5rem 1.5rem 2rem",
          borderBottom: "1px solid var(--border)",
          textAlign: "center",
        }}>
          <div style={{ maxWidth: 700, margin: "0 auto" }}>
            <div style={{
              display: "inline-block",
              fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em",
              color: "var(--accent2)",
              background: "color-mix(in srgb, var(--accent) 10%, transparent)",
              border: "1px solid color-mix(in srgb, var(--accent) 25%, transparent)",
              padding: "0.3rem 0.9rem", borderRadius: 20, marginBottom: "1.25rem",
              textTransform: "uppercase",
            }}>
              {totalSymbols}+ symbols · {CATEGORIES.length} categories
            </div>
            <h1 style={{
              fontSize: "clamp(1.8rem, 4.5vw, 2.6rem)",
              fontWeight: 800, letterSpacing: "-0.035em", lineHeight: 1.2,
              marginBottom: "0.85rem",
            }}>
              LaTeX Symbol Search
            </h1>
            <p style={{
              fontSize: "1rem", color: "var(--fg-muted)", lineHeight: 1.75,
              marginBottom: "0.5rem",
            }}>
              Search by name, command, or paste a Unicode character.
              Click any symbol to copy its LaTeX command.
              Live{" "}
              <span style={{
                fontWeight: 600,
                background: "linear-gradient(135deg, var(--accent), var(--accent2))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>
                KaTeX
              </span>{" "}
              preview — no compile needed.
            </p>
          </div>
        </section>

        {/* Tool */}
        <section style={{ padding: "2rem 1.5rem 4rem" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <SymbolSearch />
          </div>
        </section>

        {/* Tips section */}
        <section style={{
          padding: "3rem 1.5rem",
          background: "var(--surface)",
          borderTop: "1px solid var(--border)",
        }}>
          <div style={{ maxWidth: 860, margin: "0 auto" }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "1.25rem" }}>
              Tips for using symbols in LaTeX
            </h2>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "1rem",
            }}>
              {[
                {
                  title: "Math mode required",
                  body: "Most symbols only work inside math mode: $\\alpha$ or \\[ \\sum_{i=1}^n \\]. Text symbols like \\copyright work anywhere.",
                },
                {
                  title: "\\left…\\right for auto-sizing",
                  body: "Use \\left( \\right) instead of plain ( ) to get brackets that resize to fit tall expressions like fractions.",
                },
                {
                  title: "\\mathbb for number sets",
                  body: "\\mathbb{R} requires \\usepackage{amssymb}. In beamer, it's usually pre-loaded. Always check if amsmath vs amssymb is needed.",
                },
                {
                  title: "\\text{} inside math",
                  body: "For words inside equations — like conditions — use \\text{for all } x, not plain text. Requires amsmath.",
                },
              ].map((tip) => (
                <div key={tip.title} style={{
                  padding: "1rem 1.1rem",
                  background: "var(--surface2)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                }}>
                  <div style={{ fontWeight: 700, fontSize: "0.88rem", marginBottom: "0.4rem" }}>{tip.title}</div>
                  <div style={{ fontSize: "0.82rem", color: "var(--fg-muted)", lineHeight: 1.6 }}>{tip.body}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Crawlable directory — a dedicated page per symbol (SEO + deep links). */}
        <section style={{ padding: "3rem 1.5rem", borderTop: "1px solid var(--border)" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "0.5rem" }}>
              Browse every LaTeX symbol
            </h2>
            <p style={{ color: "var(--fg-muted)", fontSize: "0.9rem", lineHeight: 1.7, margin: "0 0 1.5rem", maxWidth: 640 }}>
              Every symbol has its own page with the command, a rendered preview, the package it needs,
              and related symbols. Handy when you land here from a search like “argmax latex”.
            </p>
            {symbolsByCategory().map(({ category, symbols }) => (
              <div key={category} style={{ marginBottom: "1.75rem" }}>
                <h3 style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--fg-muted)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 0.6rem" }}>
                  {category}
                </h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                  {symbols.map((s) => (
                    <Link
                      key={symbolSlug(s)}
                      href={`/tools/symbols/${symbolSlug(s)}`}
                      title={`${titleCase(s.name)} — ${s.command}`}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: "0.35rem",
                        padding: "0.25rem 0.55rem", borderRadius: 6,
                        border: "1px solid var(--border)", background: "var(--surface2)",
                        fontSize: "0.75rem", color: "var(--fg-muted)", textDecoration: "none",
                      }}
                    >
                      <span aria-hidden="true" style={{ color: "var(--fg)" }}>{s.unicode}</span>
                      <code style={{ fontFamily: "var(--font-mono), monospace" }}>{s.command}</code>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
