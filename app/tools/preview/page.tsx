import type { Metadata } from "next";
import { Suspense } from "react";
import type { CSSProperties, ReactNode } from "react";
import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";
import LatexEditor from "@/components/LatexEditor";
import { breadcrumbSchema } from "@/lib/breadcrumbs";

export const metadata: Metadata = {
  title: "Online LaTeX Preview with KaTeX Math Rendering",
  description:
    "Paste LaTeX source and see a live preview instantly — equations rendered by KaTeX, sections, tables, figures, theorem environments. No install, no signup, no compiler wait.",
  keywords: [
    "online latex preview", "latex previewer", "katex online renderer",
    "latex to html converter", "check latex equation online",
    "latex preview no installation", "live latex editor", "latex equation renderer",
  ],
  alternates: { canonical: "/tools/preview" },
  openGraph: {
    title: "Online LaTeX Preview — latexci",
    description: "Live LaTeX preview with KaTeX math rendering. Free, no signup.",
    url: "/tools/preview", type: "website",
  },
  twitter: { card: "summary_large_image", title: "Online LaTeX Preview — latexci" },
};

const appSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "LaTeX Preview — latexci",
  description: "Browser-based LaTeX preview with live KaTeX math rendering.",
  url: "https://latexci.com/tools/preview",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Web Browser",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

const FAQS = [
  {
    q: "Is this a real LaTeX compiler?",
    a: "No — it's a fast, browser-based preview. Math is rendered with KaTeX and document structure with an HTML renderer, which is what makes it instant. For byte-exact output with full packages, bibliographies, and cross-references, export to PDF or use a full TeX distribution.",
  },
  {
    q: "Are my files uploaded anywhere?",
    a: "No. Rendering happens entirely in your browser. Your LaTeX source never leaves your device, so the preview works even with sensitive or unpublished drafts.",
  },
  {
    q: "Which math commands are supported?",
    a: "Everything KaTeX supports — fractions, matrices, aligned environments, big operators, Greek letters, and most AMS-math — plus any macros you define with \\newcommand. Commands that need a full TeX engine or extra packages may not render.",
  },
  {
    q: "Do I need an account?",
    a: "No. The live preview is free and needs no signup. PDF export is part of the optional Pro plan, but previewing your document is always free.",
  },
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

const srOnly: CSSProperties = {
  position: "absolute", width: 1, height: 1, overflow: "hidden",
  clip: "rect(0,0,0,0)", whiteSpace: "nowrap",
};
const h2: CSSProperties = { color: "var(--fg)", fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 1rem" };
const h3: CSSProperties = { color: "var(--fg)", fontSize: "1.05rem", fontWeight: 600, margin: "2rem 0 0.6rem" };
const para: CSSProperties = { color: "var(--fg-muted)", fontSize: "0.95rem", lineHeight: 1.75, margin: "0 0 1rem" };

function Code({ children }: { children: ReactNode }) {
  return (
    <code style={{
      background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4,
      padding: "0.08em 0.35em", fontFamily: "var(--font-mono), monospace", fontSize: "0.85em",
    }}>{children}</code>
  );
}

export default function PreviewPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema({ name: "LaTeX Preview", path: "/tools/preview" })) }} />

      <Navbar />

      {/* Single top-level heading for the page (visually hidden — the tool itself is the UI). */}
      <h1 style={srOnly}>Online LaTeX Preview with KaTeX Math Rendering</h1>

      {/* The tool. LatexEditor self-sizes to calc(100dvh - 56px), so it fills the
          viewport under the sticky nav; the explainer below sits past the fold. */}
      <Suspense>
        <LatexEditor />
      </Suspense>

      {/* Server-rendered, indexable explainer + FAQ. This is the crawlable prose the
          full-screen editor alone can't provide (fixes a thin, "crawled – not indexed" page). */}
      <section aria-label="About the LaTeX preview tool" style={{ background: "var(--surface)", borderTop: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 820, margin: "0 auto", padding: "3.5rem 1.5rem" }}>
          <h2 style={h2}>Preview LaTeX in your browser — no install, no compiler wait</h2>
          <p style={para}>
            Paste your LaTeX source into the editor and see it rendered beside it, instantly. Math is
            typeset with KaTeX, so equations, fractions, matrices, aligned blocks, Greek letters, and the
            common AMS-math commands update in real time as you type. Document structure is rendered too —
            sections and subsections, <Code>itemize</Code> and <Code>enumerate</Code> lists, tables, figures
            with captions, and theorem-style environments. Everything runs locally in your browser: your{" "}
            <Code>.tex</Code> is never uploaded to a server.
          </p>

          <h3 style={h3}>What it&rsquo;s for &mdash; and what it isn&rsquo;t</h3>
          <p style={para}>
            This preview is built for quick checks while you write: does that equation compile, is the table
            shaped right, did the section numbering come out as expected. KaTeX covers the large majority of
            everyday math, and macros you define with <Code>{"\\newcommand"}</Code> are expanded. It is not a
            full TeX engine, though — package-specific layout, custom document classes, bibliographies, and
            references that need multiple compile passes won&rsquo;t match a real build. When you need a final,
            publication-ready PDF, export it from here (a Pro feature) or compile with a full TeX distribution
            such as TeX&nbsp;Live with <Code>latexmk</Code>, or Overleaf.
          </p>

          <h3 style={h3}>How to use it</h3>
          <ol style={{ ...para, paddingLeft: "1.25rem" }}>
            <li style={{ marginBottom: "0.5rem" }}>Paste or type your LaTeX in the left-hand editor.</li>
            <li style={{ marginBottom: "0.5rem" }}>Watch the preview render as you type — a mistake in a formula shows up right where it happens, so you can fix it without a compile cycle.</li>
            <li>Copy the source back into your main editor, or export to PDF (Pro) when the document looks right.</li>
          </ol>

          <h2 style={{ ...h2, marginTop: "2.75rem" }}>Frequently asked questions</h2>
          {FAQS.map((f) => (
            <div key={f.q} style={{ marginBottom: "1.4rem" }}>
              <h3 style={{ ...h3, margin: "0 0 0.4rem" }}>{f.q}</h3>
              <p style={{ ...para, margin: 0 }}>{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
