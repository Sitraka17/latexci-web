import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";
import LatexDiff from "@/components/LatexDiff";
import Faq from "@/components/Faq";
import { breadcrumbSchema } from "@/lib/breadcrumbs";

export const metadata: Metadata = {
  title: "Online LaTeX Diff: Compare .tex Files Side by Side",
  description:
    "Compare two LaTeX files in your browser: additions in green, deletions in red. Drop in .tex files to track advisor revisions. Free, no signup.",
  keywords: [
    "latex diff tool online", "latexdiff web browser", "compare latex files",
    "track changes latex", "latex file comparison", "tex diff viewer",
  ],
  alternates: { canonical: "/tools/diff" },
  openGraph: {
    title: "Online LaTeX Diff Tool | latexci",
    description: "Compare two .tex files side by side. Free, works in any browser.",
    url: "/tools/diff", type: "website",
  },
  twitter: { card: "summary_large_image", title: "Online LaTeX Diff | latexci" },
};

const FAQS = [
  {
    q: "Are my .tex files uploaded?",
    a: "No. Both versions are compared inside your browser and never sent to a server, so unpublished chapters and drafts stay on your machine. The diff also works without an account.",
  },
  {
    q: "What is the difference between line mode and word mode?",
    a: "Line mode marks whole changed lines, like git diff, and is best for code-like edits and for producing a patch. Word mode highlights the individual words that changed inside a line, which is easier to read when an advisor rewrites a sentence in a long paragraph.",
  },
  {
    q: "How do I apply the downloaded .patch file?",
    a: "The .patch file is a Git-style unified diff for the file named next to the download button (main.tex by default, or the last .tex you dropped in). From the folder that holds that file, run git apply --check changes.patch, then git apply changes.patch, or patch -p1 < changes.patch without Git. The patch is always built line by line, whichever mode is shown on screen.",
  },
  {
    q: "Is this the same as latexdiff?",
    a: "No. latexdiff produces a new .tex file that compiles to a PDF with changes marked in the typeset output. This tool compares the source text and shows the changes on screen, with no TeX installation. Use it to review what changed; use latexdiff when you need a marked-up PDF to send back.",
  },
  {
    q: "Can I compare two arXiv versions of a paper?",
    a: "Yes, by hand: download the source of each version from arXiv (the e-print link, for example arxiv.org/src/2301.00001v1 and v2), extract the archives, and paste or drop the matching .tex files into the two panes.",
  },
];

const appSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "LaTeX Diff | latexci",
  description: "Browser-based LaTeX diff. Compare two .tex files with changes highlighted, by line or by word, and download a unified .patch.",
  url: "https://latexci.com/tools/diff",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Web Browser",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
};

const srOnly: CSSProperties = {
  position: "absolute", width: 1, height: 1, overflow: "hidden",
  clip: "rect(0,0,0,0)", whiteSpace: "nowrap",
};
const h2: CSSProperties = { color: "var(--fg)", fontSize: "1.4rem", fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 1rem" };
const h3: CSSProperties = { color: "var(--fg)", fontSize: "1.02rem", fontWeight: 600, margin: "1.8rem 0 0.5rem" };
const para: CSSProperties = { color: "var(--fg-muted)", fontSize: "0.95rem", lineHeight: 1.75, margin: "0 0 1rem" };

function Code({ children }: { children: ReactNode }) {
  return (
    <code style={{
      background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4,
      padding: "0.08em 0.35em", fontFamily: "var(--font-mono), monospace", fontSize: "0.85em",
    }}>{children}</code>
  );
}

export default function DiffPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema({ name: "LaTeX Diff", path: "/tools/diff" })) }} />

      <Navbar />
      <h1 style={srOnly}>Online LaTeX Diff Tool: Compare .tex Files Side by Side</h1>

      {/* The tool fills the viewport under the nav (LatexDiff sizes to 100%);
          the indexable explainer and FAQ sit below the fold. */}
      <div style={{ height: "calc(100dvh - 56px)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <LatexDiff />
      </div>

      <section aria-label="About the LaTeX diff tool" style={{ background: "var(--surface)", borderTop: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 820, margin: "0 auto", padding: "3rem 1.5rem" }}>
          <h2 style={h2}>Review advisor revisions without track changes</h2>
          <p style={para}>
            LaTeX has no built-in track changes, so when a supervisor or co-author edits your chapter and sends
            the file back, the question is always the same: what did they actually change? Put your version in
            the left pane (<Code>original.tex</Code>) and theirs in the right pane (<Code>revised.tex</Code>),
            by pasting the source or dropping the <Code>.tex</Code> files. Removals show in red, additions in
            green, with a running count of added, removed and unchanged lines. If you loaded them the wrong way
            round, the swap button flips the two sides.
          </p>

          <h3 style={h3}>Line mode or word mode</h3>
          <p style={para}>
            <strong>Line mode</strong> compares whole lines, as <Code>git diff</Code> does: ideal for preamble
            changes, new equations or moved paragraphs. <strong>Word mode</strong> highlights the exact words
            that changed inside a line, which matters in LaTeX because a paragraph is often a single long line:
            a one-word correction would otherwise mark the whole paragraph. Both modes work in the unified view
            (one column, line numbers) and the side-by-side view (original and revised aligned row by row).
          </p>

          <h3 style={h3}>Download a patch and apply it</h3>
          <p style={para}>
            The <Code>.patch</Code> button downloads <Code>changes.patch</Code>, a standard unified diff built
            line by line whatever mode is on screen (&ldquo;copy diff&rdquo; instead copies a simple +/- listing, handy for an email).
            It is a Git-style patch for the file named next to the button (the last <Code>.tex</Code> you
            dropped in, <Code>main.tex</Code> by default; edit it if your file has another name or lives in a
            subfolder, e.g. <Code>chapters/intro.tex</Code>). From the folder that holds the file:
          </p>
          <pre style={{
            ...para, fontFamily: "var(--font-mono), monospace", fontSize: "0.85rem",
            background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 6,
            padding: "0.75rem 1rem", overflowX: "auto", color: "var(--fg)",
          }}>{`git apply --check changes.patch   # check first
git apply changes.patch           # apply
patch -p1 < changes.patch         # same thing without Git`}</pre>
          <p style={para}>
            Keep the project under Git and every round of advisor revisions becomes one commit, with a
            proper history you can compare or roll back.
          </p>

          <h3 style={h3}>Compare two arXiv versions</h3>
          <p style={para}>
            To see what changed between v1 and v2 of a preprint, download each version&rsquo;s source from arXiv
            (the e-print link on the abstract page), extract both archives, and drop the matching main
            <Code>.tex</Code> files into the two panes. Word mode is usually the most readable here, since
            authors tend to rewrite sentences rather than lines.
          </p>
          <p style={para}>
            Everything runs in your browser. Once the source looks right, open it in the{" "}
            <Link href="/tools/preview" style={{ color: "var(--accent)" }}>live LaTeX preview</Link> to check the
            equations, or start a new chapter from one of the{" "}
            <Link href="/tools/templates" style={{ color: "var(--accent)" }}>free templates</Link>.
          </p>

          <h2 style={{ ...h2, marginTop: "2.5rem" }}>Frequently asked questions</h2>
          <Faq items={FAQS} name="diff-faq" />
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
