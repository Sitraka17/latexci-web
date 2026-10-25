import type { Metadata } from "next";
import Link from "@/components/Link";
import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";
import RelatedTools from "@/components/RelatedTools";
import LatexDiff from "@/components/LatexDiff";
import Faq from "@/components/Faq";
import { breadcrumbSchema } from "@/lib/breadcrumbs";
import "./diff.css";

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

export default function DiffPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema({ name: "LaTeX Diff", path: "/tools/diff" })) }} />

      <Navbar />
      <main style={{ flex: 1, width: "100%" }}>
        <header className="tool-head">
          <h1>Online LaTeX Diff Tool: Compare .tex Files Side by Side</h1>
          <p className="lede">
            Paste or drop two versions of a <code>.tex</code> file to see what was added and removed, by line
            or by word, and download the changes as a patch.
          </p>
        </header>

        <div className="ld-wrap">
          <figure>
            <div className="tool-frame">
              <LatexDiff />
            </div>
            <figcaption className="tool-caption">
              <b>Figure 1.</b> The original and the revised source, and their differences: removals in red,
              additions in green. Nothing leaves your browser.
            </figcaption>
          </figure>
        </div>

        <article className="paper ld-prose" aria-label="About the LaTeX diff tool">
          <h2><span className="secnum">1</span>Review advisor revisions without track changes</h2>
          <p>
            LaTeX has no built-in track changes, so when a supervisor or co-author edits your chapter and sends
            the file back, the question is always the same: what did they actually change? Put your version in
            the left pane (<code>original.tex</code>) and theirs in the right pane (<code>revised.tex</code>),
            by pasting the source or dropping the <code>.tex</code> files. Removals show in red, additions in
            green, with a running count of added, removed and unchanged lines. If you loaded them the wrong way
            round, the Swap button flips the two sides.
          </p>

          <h2><span className="secnum">2</span>Line mode or word mode</h2>
          <p>
            <strong>Line mode</strong> compares whole lines, as <code>git diff</code> does: ideal for preamble
            changes, new equations or moved paragraphs. <strong>Word mode</strong> highlights the exact words
            that changed inside a line, which matters in LaTeX because a paragraph is often a single long line:
            a one-word correction would otherwise mark the whole paragraph. Both modes work in the unified view
            (one column, line numbers) and the side-by-side view (original and revised aligned row by row).
          </p>

          <h2><span className="secnum">3</span>Download a patch and apply it</h2>
          <p>
            The Download patch button saves <code>changes.patch</code>, a standard unified diff built
            line by line whatever mode is on screen (Copy diff instead copies a simple +/- listing, handy for an email).
            It is a Git-style patch for the file named next to the button (the last <code>.tex</code> you
            dropped in, <code>main.tex</code> by default; edit it if your file has another name or lives in a
            subfolder, e.g. <code>chapters/intro.tex</code>). From the folder that holds the file:
          </p>
          <pre className="codebox">{`git apply --check changes.patch   # check first
git apply changes.patch           # apply
patch -p1 < changes.patch         # same thing without Git`}</pre>
          <p>
            Keep the project under Git and every round of advisor revisions becomes one commit, with a
            proper history you can compare or roll back.
          </p>

          <h2><span className="secnum">4</span>Compare two arXiv versions</h2>
          <p>
            To see what changed between v1 and v2 of a preprint, download each version&rsquo;s source from arXiv
            (the e-print link on the abstract page), extract both archives, and drop the matching
            main <code>.tex</code> files into the two panes. Word mode is usually the most readable here, since
            authors tend to rewrite sentences rather than lines.
          </p>
          <p>
            Everything runs in your browser. Once the source looks right, open it in the{" "}
            <Link href="/tools/preview">live LaTeX preview</Link> to check the
            equations, or start a new chapter from one of the{" "}
            <Link href="/tools/templates">free templates</Link>.
          </p>

          <h2>Appendix A&ensp;Questions</h2>
          <Faq items={FAQS} name="diff-faq" />

          <RelatedTools tools={[
            { label: "Live LaTeX Preview", href: "/tools/preview" },
            { label: "Word to LaTeX",      href: "/tools/word-to-latex" },
            { label: "Table Generator",    href: "/tools/table" },
            { label: "LaTeX Templates",    href: "/tools/templates" },
            { label: "BibTeX Tools",       href: "/tools/bibtex" },
          ]} />
        </article>
      </main>

      <SiteFooter />
    </div>
  );
}
