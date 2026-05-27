import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { TEMPLATES } from "@/lib/templates";
import LZString from "lz-string";

export const metadata: Metadata = {
  title: "LaTeX for PhD Students & Researchers — Thesis Templates, Diff & Tools",
  description:
    "Free LaTeX tools built for academic writing: PhD and Master's thesis templates, live preview, advisor diff workflow, Word-to-LaTeX conversion, and a 12-package reference guide. No signup.",
  alternates: { canonical: "/academics" },
  keywords: [
    "phd thesis latex template",
    "latex for phd students",
    "thesis writing latex",
    "latex dissertation template",
    "academic paper latex template",
    "overleaf alternative for thesis",
    "latex thesis structure",
    "master thesis latex template",
    "latex research paper template",
    "latex for academics",
    "track changes latex thesis",
  ],
  openGraph: {
    title: "LaTeX for PhD Students & Researchers — latexci",
    description:
      "PhD thesis templates, advisor diff workflow, Word to LaTeX, and a 12-package guide. All free, in your browser.",
    url: "/academics",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LaTeX for PhD Students — latexci",
    description: "Thesis templates, diff tool, and Word → LaTeX. Free, no signup.",
  },
};

const THESIS_TEMPLATES = TEMPLATES.filter(t => t.category === "Thesis" || t.id === "article" || t.id === "ieee-paper");

const ESSENTIAL_PACKAGES = [
  { pkg: "amsmath, amssymb, amsthm", use: "All math — equations, symbols, theorem environments" },
  { pkg: "geometry", use: "Page margins — universities have strict margin requirements" },
  { pkg: "hyperref", use: "Clickable cross-references, URLs, and PDF bookmarks" },
  { pkg: "biblatex + biber", use: "Modern bibliography management (replaces BibTeX)" },
  { pkg: "graphicx", use: "Insert figures, logos, plots" },
  { pkg: "booktabs", use: "Professional tables (\\toprule, \\midrule, \\bottomrule)" },
  { pkg: "setspace", use: "Line spacing control (\\onehalfspacing, \\doublespacing)" },
  { pkg: "microtype", use: "Micro-typography: better justification, fewer overflows" },
  { pkg: "listings or minted", use: "Code listings with syntax highlighting" },
  { pkg: "algorithm2e", use: "Algorithm pseudocode environments" },
  { pkg: "cleveref", use: "Smart cross-references: auto-detects \\cref{fig:1} → Figure 1" },
  { pkg: "todonotes", use: "Inline TODO/fixme notes during draft phase" },
];

const WORKFLOW_STEPS = [
  {
    step: "01",
    title: "Pick a thesis template",
    desc: "Start from our PhD or Master's template — title page, chapters, appendices, and bibliography already wired up.",
    cta: "Browse thesis templates →",
    href: "/tools/templates",
    accent: "#6c63ff",
  },
  {
    step: "02",
    title: "Preview while you write",
    desc: "Paste your LaTeX source into the live preview. See math, sections, and tables render instantly — no compile cycle.",
    cta: "Open Live Preview →",
    href: "/tools/preview",
    accent: "#10b981",
  },
  {
    step: "03",
    title: "Diff revisions with your advisor",
    desc: "Your advisor sent back a revised version? Drag both .tex files into the diff tool — see every change highlighted.",
    cta: "Try LaTeX Diff →",
    href: "/tools/diff",
    accent: "#f59e0b",
  },
  {
    step: "04",
    title: "Convert advisor feedback from Word",
    desc: "Advisor comments in a .docx? Upload it to Word → LaTeX converter and get clean .tex output to merge back in.",
    cta: "Convert Word → LaTeX →",
    href: "/tools/word-to-latex",
    accent: "#ec4899",
  },
];

const FAQS = [
  {
    q: "Which document class should I use for my thesis?",
    a: "Use \\documentclass[12pt,a4paper]{report} for most theses. The report class gives you \\chapter commands and produces professional multi-chapter documents. Some universities provide their own class file — check your institution's guidelines first.",
  },
  {
    q: "How do I manage my bibliography for hundreds of references?",
    a: "Use biblatex with Biber as the backend (\\usepackage[style=apa]{biblatex}). Keep all your references in a .bib file and cite with \\cite{key}. Zotero and Mendeley can export directly to .bib format.",
  },
  {
    q: "My thesis is 200+ pages. Will LaTeX handle it?",
    a: "Yes — LaTeX is specifically designed for long documents. Use \\include{chapters/intro} to split chapters into separate files and \\includeonly{} to compile just one chapter at a time for faster iteration.",
  },
  {
    q: "How do I number equations, figures, and tables per chapter?",
    a: "With the report class, add \\numberwithin{equation}{chapter} in your preamble. Figures and tables auto-number per chapter when you use the report class. Your table of figures (\\listoffigures) updates automatically.",
  },
  {
    q: "Can I use latexci to check my thesis formatting?",
    a: "Yes — paste sections into the Live Preview to check math rendering and structure. Use the Diff tool to compare thesis drafts with your advisor's changes. Both tools work with any length of LaTeX.",
  },
  {
    q: "Does the preview support theorem, lemma, and proof environments?",
    a: "The preview renders the document structure, math, and text. Complex custom environments (theorem/lemma/proof) will show their content. For full rendering of custom environments, compile locally with tectonic or pdflatex.",
  },
];

export default function AcademicsPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map(f => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Navbar />

      {/* ── Hero ──────────────────────────────────── */}
      <section
        className="has-grid"
        style={{
          textAlign: "center",
          padding: "5rem 1.5rem 4rem",
        }}
      >
        <div style={{ maxWidth: 780, margin: "0 auto" }}>
          <span style={{
            display: "inline-block", padding: "0.3rem 1rem", borderRadius: 999,
            border: "1px solid rgba(108,99,255,0.4)", background: "rgba(108,99,255,0.08)",
            fontSize: "0.78rem", color: "var(--accent2)", fontWeight: 600,
            marginBottom: "1.5rem", letterSpacing: "0.05em",
          }}>
            🎓 FOR RESEARCHERS & PHD STUDENTS
          </span>

          <h1 style={{
            fontSize: "clamp(2rem, 5vw, 3.2rem)", fontWeight: 900,
            lineHeight: 1.1, letterSpacing: "-0.03em", marginBottom: "1.25rem",
          }}>
            LaTeX tools for{" "}
            <span style={{
              background: "linear-gradient(135deg, var(--accent), var(--accent2))",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              heavy academic work
            </span>
          </h1>

          <p style={{
            fontSize: "1.1rem", color: "var(--fg-muted)", lineHeight: 1.75,
            maxWidth: 600, margin: "0 auto 2rem",
          }}>
            Thesis is 200 pages. Your advisor sends changes in Word. The defense is in 3 months.
            latexci helps you move faster — preview, diff, convert, and start from pro templates.
          </p>

          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/tools/templates" style={{
              display: "inline-flex", alignItems: "center", gap: "0.5rem",
              padding: "0.75rem 1.75rem", borderRadius: 8,
              background: "linear-gradient(135deg, var(--accent), var(--accent2))",
              color: "#fff", fontWeight: 700, fontSize: "0.95rem", textDecoration: "none",
              boxShadow: "0 0 30px rgba(108,99,255,0.35)",
            }}>
              🎓 Start from a thesis template
            </Link>
            <Link href="/tools/preview" style={{
              display: "inline-flex", alignItems: "center", gap: "0.5rem",
              padding: "0.75rem 1.5rem", borderRadius: 8,
              background: "var(--surface)", color: "var(--fg)", fontWeight: 600,
              fontSize: "0.95rem", textDecoration: "none", border: "1px solid var(--border)",
            }}>
              ⚡ Live Preview
            </Link>
          </div>

          {/* Stats */}
          <div style={{
            display: "flex", gap: "2.5rem", justifyContent: "center",
            marginTop: "3rem", flexWrap: "wrap",
          }}>
            {[
              ["200+", "Pages handled easily"],
              ["0", "LaTeX install needed"],
              ["4", "Thesis templates"],
              ["Free", "No subscription"],
            ].map(([stat, label]) => (
              <div key={label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--accent2)" }}>{stat}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--fg-muted)", marginTop: "0.2rem" }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Workflow ────────────────────────────────── */}
      <section style={{ padding: "4rem 1.5rem", maxWidth: 1100, margin: "0 auto", width: "100%" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, textAlign: "center", marginBottom: "0.5rem" }}>
          Your thesis workflow — step by step
        </h2>
        <p style={{ textAlign: "center", color: "var(--fg-muted)", fontSize: "0.9rem", marginBottom: "3rem" }}>
          Every tool is free. No account. Works in your browser.
        </p>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "1.25rem",
        }}>
          {WORKFLOW_STEPS.map(s => (
            <div key={s.step} style={{
              background: "var(--surface)", border: "1px solid var(--border)",
              borderRadius: 12, padding: "1.75rem",
              display: "flex", flexDirection: "column", gap: "0.75rem",
            }}>
              <div style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                width: 40, height: 40, borderRadius: 8,
                background: `${s.accent}22`, border: `1px solid ${s.accent}44`,
                fontSize: "0.85rem", fontWeight: 800, color: s.accent, fontFamily: "monospace",
              }}>{s.step}</div>
              <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>{s.title}</h3>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--fg-muted)", lineHeight: 1.65 }}>{s.desc}</p>
              <Link href={s.href} style={{ fontSize: "0.83rem", color: s.accent, fontWeight: 600, textDecoration: "none", marginTop: "auto" }}>
                {s.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── Thesis templates quick-load ──────────────── */}
      <section style={{
        padding: "3.5rem 1.5rem",
        background: "var(--surface)",
        borderTop: "1px solid var(--border)",
        borderBottom: "1px solid var(--border)",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "0.4rem" }}>
            Thesis & research templates
          </h2>
          <p style={{ color: "var(--fg-muted)", fontSize: "0.9rem", marginBottom: "2rem" }}>
            One click loads the template into the live editor — ready to edit.
          </p>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "1rem",
          }}>
            {THESIS_TEMPLATES.map(t => {
              const compressed = LZString.compressToEncodedURIComponent(t.source);
              return (
                <a
                  key={t.id}
                  href={`/tools/preview#s=${compressed}`}
                  className="thesis-card"
                  style={{
                    display: "flex", gap: "1rem", alignItems: "flex-start",
                    background: "var(--bg)", border: "1px solid var(--border)",
                    borderRadius: 10, padding: "1.25rem", textDecoration: "none",
                  }}
                >
                  <span style={{ fontSize: "1.75rem", flexShrink: 0 }}>{t.icon}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.93rem", color: "var(--fg)", marginBottom: "0.2rem" }}>
                      {t.title}
                    </div>
                    <div style={{
                      display: "inline-block", fontSize: "0.68rem", fontWeight: 700,
                      padding: "0.1rem 0.45rem", borderRadius: 999,
                      background: "rgba(108,99,255,0.12)", color: "var(--accent2)",
                      border: "1px solid rgba(108,99,255,0.25)", marginBottom: "0.35rem",
                    }}>{t.category}</div>
                    <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--fg-muted)", lineHeight: 1.55 }}>{t.desc}</p>
                  </div>
                </a>
              );
            })}
          </div>
          <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
            <Link href="/tools/templates" style={{
              fontSize: "0.88rem", color: "var(--accent)", fontWeight: 600, textDecoration: "none",
            }}>
              View all templates →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Essential packages ───────────────────────── */}
      <section style={{ padding: "4rem 1.5rem", maxWidth: 1100, margin: "0 auto", width: "100%" }}>
        <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "0.4rem" }}>
          Essential LaTeX packages for thesis
        </h2>
        <p style={{ color: "var(--fg-muted)", fontSize: "0.9rem", marginBottom: "2rem" }}>
          Add these to your preamble. Each solves a common thesis pain point.
        </p>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
          gap: "0.75rem",
        }}>
          {ESSENTIAL_PACKAGES.map(p => (
            <div key={p.pkg} style={{
              display: "flex", gap: "1rem", alignItems: "flex-start",
              background: "var(--surface)", border: "1px solid var(--border)",
              borderRadius: 8, padding: "1rem",
            }}>
              <code style={{
                background: "rgba(108,99,255,0.1)", color: "var(--accent2)",
                padding: "0.2rem 0.55rem", borderRadius: 5, fontSize: "0.78rem",
                fontFamily: "JetBrains Mono, monospace", whiteSpace: "nowrap", flexShrink: 0,
              }}>
                {p.pkg.split(",")[0]}
              </code>
              <span style={{ fontSize: "0.83rem", color: "var(--fg-muted)", lineHeight: 1.5 }}>{p.use}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Why LaTeX for thesis ─────────────────────── */}
      <section style={{
        padding: "3.5rem 1.5rem",
        background: "var(--surface)",
        borderTop: "1px solid var(--border)",
        borderBottom: "1px solid var(--border)",
      }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <h2 style={{ fontSize: "1.4rem", fontWeight: 700, textAlign: "center", marginBottom: "2rem" }}>
            Why academics choose LaTeX over Word
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem" }}>
            {[
              { icon: "🧮", title: "Math that looks right", desc: "LaTeX renders equations — fractions, integrals, matrices — with professional typesetting that Word cannot match." },
              { icon: "🔗", title: "Cross-references never break", desc: "\\label + \\ref means Figure 3.2 stays Figure 3.2 even when you add a figure before it. Word breaks these constantly." },
              { icon: "📚", title: "BibTeX + bibliography", desc: "Manage 300 references in a .bib file. Cite with \\cite{}. The bibliography formats itself in APA, IEEE, or any style." },
              { icon: "🌿", title: "Git-friendly", desc: "Plain text files diff cleanly in Git. Track every change across months of writing. Collaborate without merge conflicts on a binary .docx." },
              { icon: "📏", title: "Precise layout control", desc: "Universities have strict margin, font, and spacing rules. LaTeX gives you exact control. geometry and setspace handle it in 2 lines." },
              { icon: "⚡", title: "Focus on content", desc: "LaTeX separates structure from formatting. You write; LaTeX typeset. No fighting with Word's auto-formatting at 2am before a deadline." },
            ].map(f => (
              <div key={f.title} style={{
                padding: "1.25rem", background: "var(--bg)",
                border: "1px solid var(--border)", borderRadius: 10,
                display: "flex", gap: "0.75rem", alignItems: "flex-start",
              }}>
                <span style={{ fontSize: "1.3rem", flexShrink: 0 }}>{f.icon}</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.88rem", marginBottom: "0.3rem" }}>{f.title}</div>
                  <div style={{ fontSize: "0.81rem", color: "var(--fg-muted)", lineHeight: 1.6 }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────── */}
      <section style={{ padding: "4rem 1.5rem 5rem", maxWidth: 760, margin: "0 auto", width: "100%" }}>
        <h2 style={{ fontSize: "1.4rem", fontWeight: 700, textAlign: "center", marginBottom: "2rem" }}>
          Thesis LaTeX — frequently asked
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {FAQS.map(({ q, a }) => (
            <div key={q} style={{
              padding: "1.25rem 1.5rem", background: "var(--surface)",
              border: "1px solid var(--border)", borderRadius: 10,
            }}>
              <div style={{ fontWeight: 600, fontSize: "0.92rem", marginBottom: "0.4rem" }}>{q}</div>
              <div style={{ fontSize: "0.85rem", color: "var(--fg-muted)", lineHeight: 1.7 }}>
                {a.split("\\").map((part, i) =>
                  i === 0 ? part : <span key={i}><code style={{ background: "var(--surface2)", padding: "0 0.3em", borderRadius: 3, fontSize: "0.8em" }}>\{part.split(" ")[0]}</code>{part.slice(part.split(" ")[0].length)}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer CTA ──────────────────────────────── */}
      <section style={{
        textAlign: "center", padding: "3rem 1.5rem 5rem",
        background: "radial-gradient(ellipse 60% 80% at 50% 100%, rgba(108,99,255,0.12), transparent)",
      }}>
        <h2 style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: "0.75rem" }}>
          Ready to write your thesis in LaTeX?
        </h2>
        <p style={{ color: "var(--fg-muted)", marginBottom: "2rem" }}>
          Start from a professional template. It&apos;s free — no account required.
        </p>
        <Link href="/tools/templates" style={{
          display: "inline-flex", alignItems: "center", gap: "0.5rem",
          padding: "0.85rem 2rem", borderRadius: 8,
          background: "linear-gradient(135deg, var(--accent), var(--accent2))",
          color: "#fff", fontWeight: 700, fontSize: "1rem", textDecoration: "none",
          boxShadow: "0 0 40px rgba(108,99,255,0.4)",
        }}>
          🎓 Browse thesis templates — free
        </Link>
      </section>

      {/* Footer */}
      <footer style={{
        marginTop: "auto", borderTop: "1px solid var(--border)",
        padding: "1.5rem", background: "var(--surface)",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", flexWrap: "wrap", gap: "1.5rem", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <span style={{ fontWeight: 800, background: "linear-gradient(135deg, var(--accent), var(--accent2))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>latexci</span>
            <span style={{ color: "var(--fg-muted)", fontSize: "0.8rem", marginLeft: "0.5rem" }}>Free LaTeX tools for academics</span>
          </div>
          <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
            {[["Academics", "/academics"], ["Preview", "/tools/preview"], ["Diff", "/tools/diff"], ["Word→LaTeX", "/tools/word-to-latex"], ["Templates", "/tools/templates"]].map(([label, href]) => (
              <Link key={label} href={href} style={{ fontSize: "0.82rem", color: "var(--fg-muted)", textDecoration: "none" }}>{label}</Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
