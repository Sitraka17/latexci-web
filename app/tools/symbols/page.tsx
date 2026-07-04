import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";
import SymbolSearch from "@/components/SymbolSearch";
import { SYMBOLS, CATEGORIES } from "@/lib/symbols";

export const metadata: Metadata = {
  title: "LaTeX Symbol Search — 380+ Symbols with Live Preview — latexci",
  description:
    "Search 380+ LaTeX symbols by name, command, or Unicode: Greek letters, math operators, arrows, logic, sets, physics, statistics, CS complexity. Copy the command in one click with live KaTeX preview. Faster than Detexify.",
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
      </main>

      <SiteFooter />
    </div>
  );
}
