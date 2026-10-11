import type { Metadata } from "next";
import Link from "next/link";
import katex from "katex";
import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";
import Faq from "@/components/Faq";

// Pre-render at build time — no runtime cost, pixel-perfect math
const HERO_FORMULA = katex.renderToString(
  "\\int_{-\\infty}^{+\\infty} e^{-x^2}\\,dx = \\sqrt{\\pi}",
  { displayMode: true, throwOnError: false, output: "html" }
);

export const metadata: Metadata = {
  title: "The Tools Overleaf Forgot: Free LaTeX Utilities",
  description:
    "Free LaTeX tools for researchers: BibTeX cleaner, Word to LaTeX, live preview, diff, 28 templates. PDF export and Word import with a one-click Google sign-in.",
  keywords: [
    "bibtex cleaner online", "word to latex converter", "latex diff tool",
    "doi to bibtex", "arxiv to bibtex", "latex preview online",
    "overleaf alternative", "overleaf complement", "free latex tools",
    "latex bibliography tool", "latex thesis template", "bibtex formatter",
    "katex online renderer", "overleaf after graduation",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title: "The Tools Overleaf Forgot: Free LaTeX Utilities",
    description:
      "latexci: BibTeX cleaner, Word to LaTeX, instant preview, diff, and templates. All free, no install; PDF export and Word import with a Google sign-in.",
    url: "/",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Tools Overleaf Forgot: Free LaTeX Utilities",
    description:
      "BibTeX cleaner, Word to LaTeX converter, instant preview, diff, and templates. Every tool free, no paid plan.",
  },
};

// Figure 1 source, kept verbatim (String.raw: backslashes are LaTeX, not escapes).
const FIGURE_SOURCE = String.raw`\section{Gaussian integral}
A beautiful result in analysis:
\[
  \int_{-\infty}^{+\infty} e^{-x^2}\,dx
    = \sqrt{\pi}
\]`;

// ── Data ───────────────────────────────────────────────────────────────────

const TOOLS: { href: string; label: string; desc: string; access: string }[] = [
  { href: "/tools/preview", label: "Live preview and PDF",
    desc: "Paste a .tex file and see it typeset as you type: equations, theorems, tables, references. Export a real PDF.",
    access: "PDF: Google sign-in" },
  { href: "/tools/word-to-latex", label: "Word to LaTeX",
    desc: "Turn a .docx into clean LaTeX: headings, lists, booktabs tables, footnotes and Word equations, with a quality report.",
    access: "Google sign-in" },
  { href: "/tools/bibtex", label: "BibTeX tools",
    desc: "Clean and deduplicate a .bib file; get an entry from a DOI, an arXiv ID, a PubMed ID or an ISBN.",
    access: "No account" },
  { href: "/tools/diff", label: "LaTeX diff",
    desc: "Compare two versions of a paper line by line or word by word, and download a patch for git apply.",
    access: "No account" },
  { href: "/tools/table", label: "Table generator",
    desc: "Type or paste from Excel and copy a booktabs tabular, ready for the document body.",
    access: "No account" },
  { href: "/tools/cv-builder", label: "CV generator",
    desc: "Fill a form, import publications from ORCID, get an academic or industry CV in LaTeX, in English or French.",
    access: "No account" },
  { href: "/tools/templates", label: "Templates",
    desc: "28 starting points: PhD thesis, NeurIPS, ICML, ACL, Beamer, CVs, school reports.",
    access: "No account" },
  { href: "/tools/symbols", label: "Symbol search",
    desc: "Find the command for any of 350+ symbols by name, by command or by pasting the character.",
    access: "No account" },
];

const SCENARIOS = [
  { quote: "Meeting in two hours. I just need to check this equation renders before I send the chapter.", tool: "the live preview", href: "/tools/preview" },
  { quote: "My advisor sent back the draft with changes. I need to see exactly what was edited.", tool: "the diff", href: "/tools/diff" },
  { quote: "A co-author left comments in a Word file. I need them back in LaTeX.", tool: "Word to LaTeX", href: "/tools/word-to-latex" },
];

const FAQS = [
  { q: "What does latexci cost?",
    a: "Nothing. Every tool is free: preview, PDF export, Word to LaTeX, BibTeX tools, diff, table and CV generators, symbols and all templates. There is no paid plan." },
  { q: "Does the preview support math equations?",
    a: "Yes: inline math ($...$), display math (\\[...\\]), and block environments like align, gather, and equation all render via KaTeX, with automatic equation numbering, \\ref cross-references, and bibliography rendering." },
  { q: "What file types does Word → LaTeX accept?",
    a: ".docx (Word 2007+) converts directly in your browser: the file is never uploaded. Word equations (OMML) are converted to LaTeX math in place, inline or displayed. .odt and .rtf need local pandoc; the tool shows you the exact command." },
  { q: "Is my LaTeX source stored anywhere?",
    a: "No. Preview, diff, table, symbol search, and Word → LaTeX all run entirely in your browser. Nothing is uploaded. PDF export sends only your LaTeX source to YToTech's compile server and downloads the result directly." },
  { q: "I have Overleaf through my university. Why use this?",
    a: "latexci does things Overleaf doesn't: convert Word files with equation detection, clean and deduplicate .bib files, look up DOIs and arXiv IDs in one click, and diff two .tex files side by side. Use Overleaf as your editor, and latexci for the rest. When you graduate and lose institutional access, latexci is still here." },
  { q: "Do I need an account?",
    a: "Only for PDF export and Word to LaTeX: one click with Google, free. Everything else works without an account, and documents you save stay in your browser." },
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
    url: "https://latexci.com",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  },
  {
    "@context": "https://schema.org", "@type": "WebSite",
    name: "latexci", url: "https://latexci.com",
    description: "Free online LaTeX tools for researchers and students.",
  },
];

// ── Page ───────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div className="home" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {SCHEMAS.map((s, i) => (
        <script key={i} type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }} />
      ))}

      <Navbar />

      <main className="paper" style={{ flex: 1, width: "100%", boxSizing: "border-box", paddingBottom: "3rem" }}>
        {/* Title block, as \maketitle would set it */}
        <header className="titleblock">
          <h1>The tools Overleaf forgot</h1>
          <p className="subtitle">Free LaTeX utilities for researchers, in the browser</p>
          <p className="authors">latexci.com &middot; free and open to everyone</p>
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap", marginTop: "1.6rem" }}>
            <Link href="/tools/preview" className="btn btn-primary">Open the live preview</Link>
            <Link href="/tools/bibtex" className="btn">Clean a .bib file</Link>
          </div>
        </header>

        <section className="abstract" aria-label="Abstract">
          <p className="abstract-title">Abstract</p>
          <p>
            latexci gathers the small tools a LaTeX writer reaches for between two compilations: a live
            preview that typesets as you type, a converter from Word, a BibTeX cleaner with DOI, arXiv,
            PubMed and ISBN lookups, a diff for advisor revisions, a table generator, a CV generator and
            28 templates. Everything is free. Most tools need no account; PDF export and Word to LaTeX ask
            for a one-click Google sign-in.
          </p>
        </section>

        {/* Figure 1: source and rendering, side by side */}
        <figure style={{ margin: "2.5rem 0 0" }}>
          <div className="figure figure-grid">
            <pre style={{ margin: 0, fontFamily: "var(--font-tt)", fontSize: "0.88rem", lineHeight: 1.6, whiteSpace: "pre-wrap", color: "var(--fg)" }}>{FIGURE_SOURCE}</pre>
            <div style={{ fontFamily: "var(--font-serif)", color: "var(--fg)" }}>
              <p style={{ margin: "0 0 0.4rem", fontWeight: 700, fontSize: "1.1rem" }}>1&ensp;Gaussian integral</p>
              <p style={{ margin: 0, fontSize: "1rem" }}>A beautiful result in analysis:</p>
              <div style={{ fontSize: "1.1rem" }} dangerouslySetInnerHTML={{ __html: HERO_FORMULA }} />
            </div>
          </div>
          <figcaption className="caption"><b>Figure 1.</b> LaTeX source (left) and what the live preview shows (right), with no compilation.</figcaption>
        </figure>

        <h2><span className="secnum">1</span>The tools</h2>
        <p>
          Each tool is a single page that works without installing anything. Table 1 lists them; the
          documents you write stay in your browser.
        </p>
        <div style={{ overflowX: "auto", margin: "1.25rem 0 0" }}>
          <table className="booktabs">
            <thead>
              <tr><th>Tool</th><th>What it does</th><th className="hide-sm">Access</th></tr>
            </thead>
            <tbody>
              {TOOLS.map((t) => (
                <tr key={t.href}>
                  <td style={{ whiteSpace: "nowrap" }}><Link href={t.href}>{t.label}</Link></td>
                  <td>{t.desc}</td>
                  <td className="muted hide-sm">{t.access}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="caption"><b>Table 1.</b> The tools on latexci. All are free.</p>

        <h2><span className="secnum">2</span>When it helps</h2>
        <p>Three situations from real writing weeks, and the tool that settles each one:</p>
        <ol style={{ paddingLeft: "1.6rem", margin: "0.5rem 0 0" }}>
          {SCENARIOS.map((sc) => (
            <li key={sc.href} style={{ marginBottom: "0.6rem" }}>
              <em>&ldquo;{sc.quote}&rdquo;</em> Use <Link href={sc.href}>{sc.tool}</Link>.
            </li>
          ))}
        </ol>

        <h2><span className="secnum">3</span>Theses and school reports</h2>
        <p>
          Writing a thesis? The <Link href="/academics">academics hub</Link> gathers PhD thesis templates,
          a guide to the twelve packages a long document needs, and the advisor revision workflow with the diff.
        </p>
        <p>
          Students of Centrale Marseille and AMSE will find <Link href="/tools/templates?cat=Grande+%C3%89cole">templates
          with the official layout</Link>: <span lang="fr">rapport de projet, rapport de stage</span> and the AMSE working paper.
        </p>

        <h2><span className="secnum">4</span>Why another LaTeX site</h2>
        <p>
          Overleaf is an excellent editor. latexci does the things around it: converting a Word file with its
          equations, cleaning a bibliography, comparing two versions, finding a symbol. Use Overleaf to write and
          latexci for the rest. When a university licence ends at graduation, these tools stay free.
        </p>

        <h2 style={{ marginTop: "3rem" }}>Appendix A&ensp;Questions</h2>
        <Faq items={FAQS} />

        <p className="remark" style={{ marginTop: "2.25rem" }}>
          <b>Remark.</b> Questions, template requests or a compilation error you cannot solve? The{" "}
          <a href="https://discord.gg/latexci" target="_blank" rel="noopener">latexci Discord</a> is open to everyone.
        </p>
      </main>

      <SiteFooter />
    </div>
  );
}
