import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";
import Faq from "@/components/Faq";
import { breadcrumbSchema } from "@/lib/breadcrumbs";
import CopyButton from "@/components/CopyButton";
import { TEMPLATES } from "@/lib/templates";
import LZString from "lz-string";

export const metadata: Metadata = {
  title: "LaTeX for PhD Students: Thesis Templates, Diff and Tools",
  description:
    "Free LaTeX tools for academic writing: thesis templates, live preview, advisor diff, Word to LaTeX (free Google sign-in) and a 12-package reference guide.",
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
    title: "LaTeX for PhD Students & Researchers | latexci",
    description:
      "PhD thesis templates, advisor diff workflow, Word to LaTeX, and a 12-package guide. All free, in your browser.",
    url: "/academics",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LaTeX for PhD Students | latexci",
    description: "Thesis templates, diff tool, and Word → LaTeX. Every tool free, no paid plan.",
  },
};

// Template titles and descriptions come from lib/templates.ts; set any long
// dash there as a colon so the page keeps one punctuation style.
const plain = (s: string) => s.replace(/\s*\u2014\s*/g, ": ");
const previewHref = (source: string) => `/tools/preview#s=${LZString.compressToEncodedURIComponent(source)}`;

const THESIS_TEMPLATES = TEMPLATES.filter(t =>
  t.category === "Thesis" || t.id === "article" || t.id === "ieee-paper"
);
const GRANDE_ECOLE_TEMPLATES = TEMPLATES.filter(t => t.category === "Grande École");
const ML_CONFERENCE_TEMPLATE  = TEMPLATES.find(t => t.id === "ml-conference");

const ESSENTIAL_PACKAGES = [
  { pkg: "amsmath, amssymb, amsthm", use: "All math: equations, symbols, theorem environments", copy: String.raw`\usepackage{amsmath,amssymb,amsthm}` },
  { pkg: "geometry", use: "Page margins (universities have strict margin requirements)", copy: String.raw`\usepackage{geometry}` },
  { pkg: "hyperref", use: "Clickable cross-references, URLs, and PDF bookmarks", copy: String.raw`\usepackage{hyperref}` },
  { pkg: "biblatex + biber", use: "Modern bibliography management (replaces BibTeX)", copy: String.raw`\usepackage[backend=biber]{biblatex}` },
  { pkg: "graphicx", use: "Insert figures, logos, plots", copy: String.raw`\usepackage{graphicx}` },
  { pkg: "booktabs", use: String.raw`Professional tables (\toprule, \midrule, \bottomrule)`, copy: String.raw`\usepackage{booktabs}` },
  { pkg: "setspace", use: String.raw`Line spacing control (\onehalfspacing, \doublespacing)`, copy: String.raw`\usepackage{setspace}` },
  { pkg: "microtype", use: "Micro-typography: better justification, fewer overflows", copy: String.raw`\usepackage{microtype}` },
  { pkg: "listings or minted", use: "Code listings with syntax highlighting", copy: String.raw`\usepackage{listings}` },
  { pkg: "algorithm2e", use: "Algorithm pseudocode environments", copy: String.raw`\usepackage{algorithm2e}` },
  { pkg: "cleveref", use: String.raw`Smart cross-references: \cref{fig:1} prints "Figure 1"`, copy: String.raw`\usepackage{cleveref}` },
  { pkg: "todonotes", use: "Inline TODO and fixme notes during the draft phase", copy: String.raw`\usepackage{todonotes}` },
];

// Figure 1: a thesis preamble built from Table 3 (String.raw keeps the backslashes).
const PREAMBLE_SOURCE = String.raw`\documentclass[12pt,a4paper]{report}
\usepackage{amsmath,amssymb,amsthm}
\usepackage[margin=2.5cm]{geometry}
\usepackage{setspace}\onehalfspacing
\usepackage{graphicx,booktabs,microtype}
\usepackage[backend=biber,style=apa]{biblatex}
\addbibresource{thesis.bib}
\usepackage{hyperref}
\usepackage{cleveref}   % load after hyperref
\numberwithin{equation}{chapter}

\begin{document}
\include{chapters/introduction}
\include{chapters/methods}
\printbibliography
\end{document}`;

const WORKFLOW_STEPS = [
  {
    title: "Pick a thesis template.",
    desc: "Start from the PhD or Master's template: title page, chapters, appendices, and bibliography already wired up.",
    cta: "Browse thesis templates",
    href: "/tools/templates",
  },
  {
    title: "Preview while you write.",
    desc: "Paste your LaTeX source into the live preview. Math, sections, and tables render as you type, with no compile cycle.",
    cta: "Open the live preview",
    href: "/tools/preview",
  },
  {
    title: "Diff revisions with your advisor.",
    desc: "Your advisor sent back a revised version? Drag both .tex files into the diff tool and see every change highlighted.",
    cta: "Try the LaTeX diff",
    href: "/tools/diff",
  },
  {
    title: "Convert advisor feedback from Word.",
    desc: "Advisor comments in a .docx? Load it into the Word to LaTeX converter and get clean .tex output to merge back in.",
    cta: "Convert Word to LaTeX",
    href: "/tools/word-to-latex",
  },
];

const WHY_LATEX = [
  { title: "Math that looks right.", desc: "LaTeX sets equations (fractions, integrals, matrices) with professional typesetting that Word cannot match." },
  { title: "Cross-references never break.", desc: String.raw`\label and \ref mean Figure 3.2 stays Figure 3.2 even when you add a figure before it. Word breaks these constantly.` },
  { title: "BibTeX and the bibliography.", desc: String.raw`Manage 300 references in a .bib file and cite with \cite{}. The bibliography formats itself in APA, IEEE, or any style.` },
  { title: "Git-friendly.", desc: "Plain text files diff cleanly in Git. Track every change across months of writing and collaborate without merge conflicts on a binary .docx." },
  { title: "Precise layout control.", desc: "Universities have strict margin, font, and spacing rules. geometry and setspace handle them in two lines." },
  { title: "Focus on content.", desc: "LaTeX separates structure from formatting. You write, LaTeX typesets: no fighting with Word's auto-formatting at 2 a.m. before a deadline." },
];

const FAQS = [
  {
    q: "Which document class should I use for my thesis?",
    a: "Use \\documentclass[12pt,a4paper]{report} for most theses. The report class gives you \\chapter commands and produces professional multi-chapter documents. Some universities provide their own class file: check your institution's guidelines first.",
  },
  {
    q: "How do I manage my bibliography for hundreds of references?",
    a: "Use biblatex with Biber as the backend (\\usepackage[style=apa]{biblatex}). Keep all your references in a .bib file and cite with \\cite{key}. Zotero and Mendeley can export directly to .bib format.",
  },
  {
    q: "My thesis is 200+ pages. Will LaTeX handle it?",
    a: "Yes. LaTeX is specifically designed for long documents. Use \\include{chapters/intro} to split chapters into separate files and \\includeonly{} to compile just one chapter at a time for faster iteration.",
  },
  {
    q: "How do I number equations, figures, and tables per chapter?",
    a: "With the report class, add \\numberwithin{equation}{chapter} in your preamble. Figures and tables auto-number per chapter when you use the report class. Your table of figures (\\listoffigures) updates automatically.",
  },
  {
    q: "Can I use latexci to check my thesis formatting?",
    a: "Yes. Paste sections into the Live Preview to check math rendering and structure. Use the Diff tool to compare thesis drafts with your advisor's changes. Both tools work with any length of LaTeX.",
  },
  {
    q: "Does the preview support theorem, lemma, and proof environments?",
    a: "Yes. The preview renders theorem, lemma, proposition, corollary, definition, example and proof environments, including the ones you declare with \\newtheorem. For packages the preview does not know, export a PDF or compile locally with tectonic or pdflatex.",
  },
];

const codeStyle = { fontFamily: "var(--font-tt)", fontSize: "0.92em" } as const;

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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema({ name: "For Academics", path: "/academics" })) }} />
      <Navbar />

      <main className="paper" style={{ flex: 1, width: "100%", boxSizing: "border-box", paddingBottom: "3rem" }}>
        <header className="titleblock">
          <h1>LaTeX tools for PhD students and researchers</h1>
          <p className="subtitle">Thesis templates, revision tools and a package reference, free in the browser</p>
          <p className="authors">latexci.com &middot; for researchers and PhD students</p>
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap", marginTop: "1.6rem" }}>
            <Link href="/tools/templates" className="btn btn-primary">Start from a thesis template</Link>
            <Link href="/tools/preview" className="btn">Open the live preview</Link>
          </div>
        </header>

        <section className="abstract" aria-label="Abstract">
          <p className="abstract-title">Abstract</p>
          <p>
            The thesis is 200 pages, the advisor sends changes in Word, and the defense is in three months.
            This page gathers what helps a researcher move faster: thesis and paper templates that open in
            the live preview, a diff for advisor revisions, a Word to LaTeX converter, and a reference of the
            twelve packages a long document needs. Every tool is free and needs no LaTeX install. Templates,
            preview and diff need no account; PDF export and Word to LaTeX ask for a one-click Google sign-in.
          </p>
        </section>

        <h2><span className="secnum">1</span>A thesis workflow in four steps</h2>
        <p>
          Each step below uses one tool. Every tool is free and works in your browser; only PDF export and
          Word to LaTeX ask for a one-click Google sign-in.
        </p>
        <ol style={{ paddingLeft: "1.6rem", margin: "0.6rem 0 0" }}>
          {WORKFLOW_STEPS.map(s => (
            <li key={s.href} style={{ marginBottom: "0.6rem" }}>
              <b>{s.title}</b> {s.desc} <Link href={s.href}>{s.cta}</Link>.
            </li>
          ))}
        </ol>

        <h2><span className="secnum">2</span>Thesis and research templates</h2>
        <p>
          A click on a template name in Table 1 loads it into the live editor, ready to edit. The full
          collection of 28 templates is on the <Link href="/tools/templates">templates page</Link>.
        </p>
        <div style={{ overflowX: "auto", margin: "1.25rem 0 0" }}>
          <table className="booktabs">
            <thead>
              <tr><th>Template</th><th>Description</th><th className="hide-sm">Category</th></tr>
            </thead>
            <tbody>
              {THESIS_TEMPLATES.map(t => (
                <tr key={t.id}>
                  <td style={{ whiteSpace: "nowrap" }}><a href={previewHref(t.source)}>{plain(t.title)}</a></td>
                  <td>{plain(t.desc)}</td>
                  <td className="muted hide-sm">{t.category}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="caption"><b>Table 1.</b> Templates for theses, proposals and research papers. Each opens in the live preview.</p>

        <h3>2.1&ensp;<span lang="fr">Centrale Marseille</span> and AMSE</h3>
        <p>
          Ready-to-compile templates with the correct title pages, headers, and colour schemes for
          <span lang="fr"> Centrale Méditerranée</span> reports, internship documents, and AMSE working papers
          (Table 2).
        </p>
        <div style={{ overflowX: "auto", margin: "1.25rem 0 0" }}>
          <table className="booktabs">
            <thead>
              <tr><th>Template</th><th>Description</th></tr>
            </thead>
            <tbody>
              {GRANDE_ECOLE_TEMPLATES.map(t => (
                <tr key={t.id}>
                  <td style={{ whiteSpace: "nowrap" }}><a href={previewHref(t.source)} lang="fr">{plain(t.title)}</a></td>
                  <td lang="fr">{plain(t.desc)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="caption"><b>Table 2.</b> <span lang="fr">Grande École</span> templates with the official layout.</p>
        <p className="remark" style={{ marginTop: "1rem", textIndent: 0 }}>
          <b>Remark.</b> Each template opens in the live editor. Replace the placeholder text, add{" "}
          <code style={codeStyle}>\includegraphics</code> for the real logo, and export to PDF with the PDF
          button of the <Link href="/tools/preview">live preview</Link> (one-click Google sign-in).
        </p>

        {ML_CONFERENCE_TEMPLATE && (
          <>
            <h3>2.2&ensp;ML conference paper</h3>
            <p>
              NeurIPS, ICML, ICLR and CVPR papers share the same article-class skeleton. This template wires up
              the anonymous review header, the contributions paragraph, an algorithm environment, theorem and
              proof, an ablation table in booktabs, and the appendix. Swap in the official{" "}
              <code style={codeStyle}>neurips_2025.sty</code> once you are ready to submit.
            </p>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "1rem" }}>
              <a href={previewHref(ML_CONFERENCE_TEMPLATE.source)} className="btn">Open the ML conference template</a>
            </div>
          </>
        )}

        <h2><span className="secnum">3</span>Essential packages for a thesis</h2>
        <p>
          Add these to your preamble; each solves a common thesis problem. The button in the last column of
          Table 3 copies the <code style={codeStyle}>\usepackage</code> line, and Figure 1 shows them
          assembled into a working preamble.
        </p>
        <div style={{ overflowX: "auto", margin: "1.25rem 0 0" }}>
          <table className="booktabs">
            <thead>
              <tr><th>Package</th><th>Purpose</th><th className="hide-sm" style={{ textAlign: "right" }}>Copy</th></tr>
            </thead>
            <tbody>
              {ESSENTIAL_PACKAGES.map(p => (
                <tr key={p.pkg}>
                  <td style={{ whiteSpace: "nowrap" }}><code style={codeStyle}>{p.pkg}</code></td>
                  <td>{p.use}</td>
                  <td className="hide-sm" style={{ textAlign: "right" }}><CopyButton text={p.copy} label={"\\usepackage"} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="caption"><b>Table 3.</b> Twelve packages that cover most thesis requirements.</p>

        <figure style={{ margin: "2rem 0 0" }}>
          <div className="figure">
            <pre style={{ margin: 0, padding: "1rem 1.15rem", fontFamily: "var(--font-tt)", fontSize: "0.86rem", lineHeight: 1.6, whiteSpace: "pre-wrap", color: "var(--fg)", overflowX: "auto" }}>{PREAMBLE_SOURCE}</pre>
          </div>
          <figcaption className="caption"><b>Figure 1.</b> A thesis preamble built from Table 3. Chapters live in their own files; <code style={codeStyle}>\includeonly</code> compiles one at a time.</figcaption>
        </figure>

        <h2><span className="secnum">4</span>Unpublished research stays in your browser</h2>
        <p>
          Preview, diff, and Word to LaTeX run entirely client-side: your .tex source, your Word documents and
          your research content are not uploaded to a server. Only PDF export, when you ask for it, sends the
          LaTeX source to the YToTech compile service and downloads the result. For EU institutions with GDPR
          obligations around unpublished research, this is a meaningful difference from cloud compilers that
          store every project.
        </p>
        <p className="remark" style={{ marginTop: "0.8rem", textIndent: 0 }}>
          <b>Local processing.</b> Preview, diff, and Word conversion run as JavaScript in your browser; the
          document content does not leave your machine.
        </p>
        <p className="remark" style={{ marginTop: "0.4rem", textIndent: 0 }}>
          <b>GDPR.</b> Because these tools never send document content to a server, there is no data transfer to
          declare and no consent to collect. Documents you save stay in your browser.
        </p>
        <p className="remark" style={{ marginTop: "0.4rem", textIndent: 0 }}>
          <b>Institutional confidence.</b> Share the link to this page with your IT or legal team: the
          architecture speaks for itself.
        </p>

        <h2><span className="secnum">5</span>Why academics choose LaTeX over Word</h2>
        <ol style={{ paddingLeft: "1.6rem", margin: "0.5rem 0 0" }}>
          {WHY_LATEX.map(f => (
            <li key={f.title} style={{ marginBottom: "0.5rem" }}>
              <b>{f.title}</b> {f.desc}
            </li>
          ))}
        </ol>

        <h2><span className="secnum">6</span>Getting started</h2>
        <p>
          Ready to write your thesis in LaTeX? Start from a professional template. It is free, and templates
          need no account.
        </p>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "1rem" }}>
          <Link href="/tools/templates" className="btn btn-primary">Browse thesis templates (free)</Link>
        </div>

        <h2 style={{ marginTop: "3rem" }}>Appendix A&ensp;Questions</h2>
        <Faq items={FAQS} />
      </main>

      <SiteFooter />
    </div>
  );
}
