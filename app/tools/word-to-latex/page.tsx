import type { Metadata } from "next";
import Link from "@/components/Link";
import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";
import RelatedTools from "@/components/RelatedTools";
import WordToLatex from "@/components/WordToLatex";
import Faq from "@/components/Faq";
import { breadcrumbSchema } from "@/lib/breadcrumbs";
import { WORD_SAMPLE_LATEX } from "@/lib/word-latex";
import katex from "katex";
import "./word.css";

export const metadata: Metadata = {
  title: "Word to LaTeX Converter: .docx to .tex in Your Browser",
  description:
    "Convert Word .docx to LaTeX in your browser: headings, lists, booktabs tables, figures and Word equations, with a quality report. Free, first file with no account.",
  keywords: [
    "word to latex converter", "docx to latex", "convert word to latex", "word to tex",
    "docx to tex converter", "word equations to latex", "omml to latex",
  ],
  alternates: { canonical: "/tools/word-to-latex" },
  openGraph: {
    title: "Word to LaTeX Converter | latexci",
    description: "Drop a .docx, get clean LaTeX: equations, tables, headings and a quality report. Runs in your browser.",
    url: "/tools/word-to-latex",
    type: "website",
  },
  twitter: { card: "summary_large_image", title: "Word to LaTeX Converter | latexci" },
};

const FAQS = [
  {
    q: "Is my Word file uploaded anywhere?",
    a: "No. The .docx is read and converted inside your browser; its content never reaches a server.",
  },
  {
    q: "Do I need an account?",
    a: "Not for your first file: convert it with no account. After that, a free one-click Google sign-in unlocks unlimited conversions. There is no paid plan; signing in only records that you used the converter, and the document itself stays in your browser.",
  },
  {
    q: "Are Word equations converted?",
    a: "Yes. Equations written with Word's equation editor (OMML) are translated into LaTeX math: fractions, roots, sub- and superscripts, sums and matrices. Check complex ones in the preview, as the conversion is best-effort. MathType objects are not converted: convert them to Office Math in Word first.",
  },
  {
    q: "What happens to images?",
    a: "Each image becomes a figure environment with an \\includegraphics placeholder and a caption to fill in. Upload the image files next to your .tex (in Overleaf or locally) under the names used in the placeholders.",
  },
  {
    q: "Can I convert .odt or .rtf files?",
    a: "The in-browser converter reads .docx. For .odt and .rtf the tool gives you the exact pandoc command to run, or you can re-save the document as .docx in Word or LibreOffice.",
  },
  {
    q: "How do I get headings right?",
    a: "Use Word's built-in Heading 1, 2 and 3 styles: they become \\section, \\subsection and \\subsubsection. Text that only looks like a heading (bold, larger font) stays a normal paragraph.",
  },
];

// The equation of the sample paragraph, as Word shows it (typeset at build time).
const SAMPLE_EQ = katex.renderToString("\\sigma^{2}\\leq \\frac{1}{n}", { throwOnError: false });

const appSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Word to LaTeX Converter | latexci",
  description: "In-browser .docx to LaTeX converter with Word equation (OMML) support and a quality report.",
  url: "https://latexci.com/tools/word-to-latex",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Web Browser",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
};

export default function WordToLatexPage() {
  return (
    // Scrolling page, not the fixed-height ToolLayout: the converter output
    // (editor, report, warnings) is taller than the viewport and was clipped.
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema({ name: "Word to LaTeX", path: "/tools/word-to-latex" })) }} />
      <Navbar />
      <main style={{ flex: 1 }}>
        <header className="tool-head">
          <h1>Word to LaTeX converter</h1>
          <p className="lede">
            Turn a Word .docx into clean LaTeX: headings, lists, booktabs tables, footnotes, figures and Word
            equations, with a report of what to check. It is free: the first file needs no account, the next ones a one-click Google sign-in.
            The .docx is converted in your browser and is never uploaded.
          </p>
        </header>

        <WordToLatex />

        <section aria-label="About the Word to LaTeX converter" className="paper w2l-paper">
          <h2><span className="secnum">1</span>What the converter does</h2>
          <p>
            Drop a .docx and the converter rebuilds it as a LaTeX document: Word heading styles become sections,
            bold and italic become <code>\textbf</code> and <code>\emph</code>, bulleted and numbered lists become
            <code> itemize</code> and <code>enumerate</code>, tables become booktabs tables, and hyperlinks keep their
            targets. Equations typed with Word&rsquo;s equation editor are converted to LaTeX math, and every image
            becomes a figure with a placeholder you can point at the real file.
          </p>
          <p>
            A quality report counts what was found (headings, tables, equations, images, footnotes, links) and
            flags what needs a human look, so you know where to check before compiling.
          </p>

          <figure style={{ margin: "1.75rem 0 0" }}>
            <div className="figure figure-grid">
              <div style={{ fontFamily: "var(--font-serif)", color: "var(--fg)" }}>
                <p style={{ margin: "0 0 0.25rem", fontFamily: "var(--font-sans)", fontSize: "0.8rem", color: "var(--fg-muted)" }}>Word</p>
                <p style={{ margin: "0 0 0.4rem", fontWeight: 700, fontSize: "1.1rem" }}>Results<sup>1</sup></p>
                <p style={{ margin: 0, fontSize: "1rem", textIndent: 0 }}>
                  The loss falls <b>below 0.1</b> after 40 epochs, with{" "}
                  <span dangerouslySetInnerHTML={{ __html: SAMPLE_EQ }} /> for every run.
                </p>
                <p style={{ margin: "0.9rem 0 0", paddingTop: "0.35rem", borderTop: "1px solid var(--border)", fontSize: "0.85rem", textIndent: 0 }}>
                  <sup>1</sup> Measured on the validation set.
                </p>
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: "0 0 0.25rem", fontFamily: "var(--font-sans)", fontSize: "0.8rem", color: "var(--fg-muted)" }}>LaTeX output</p>
                <pre style={{ margin: 0, fontFamily: "var(--font-tt)", fontSize: "0.84rem", lineHeight: 1.6, whiteSpace: "pre-wrap", overflowWrap: "anywhere", color: "var(--fg)" }}>{WORD_SAMPLE_LATEX}</pre>
              </div>
            </div>
            <figcaption className="caption">
              <b>Figure 2.</b> A Word paragraph with a heading, bold text, a footnote and an equation (left), and
              the document body the converter writes for it (right). The heading gets a short title without the
              footnote, as hyperref requires; the output is checked against the converter by a test.
            </figcaption>
          </figure>

          <h2><span className="secnum">2</span>Equations and MathType</h2>
          <p>
            Equations typed with Word&rsquo;s own equation editor (Insert, Equation) are stored in the .docx as
            Office Math (OMML). The converter reads them and writes LaTeX math in place: inline equations as{" "}
            <code>$&hellip;$</code>, display equations as <code>\[&hellip;\]</code> or <code>gather*</code>, with
            fractions, roots, scripts, sums and integrals, delimiters, accents and matrices. The conversion is best
            effort, so check long or unusual equations in the preview.
          </p>
          <p>
            MathType equations are a different thing: they are embedded OLE objects with a picture of the
            equation, not Office Math, and they are not converted. At most the picture comes through as an image
            placeholder. Convert them in Word first: with MathType installed, its &ldquo;Convert
            Equations&rdquo; command turns them into Office Math (choose Word&rsquo;s equation format as the
            target). Save, then drop the file here.
          </p>

          <h2><span className="secnum">3</span>This converter or pandoc?</h2>
          <p>
            <a href="https://pandoc.org" rel="noopener">Pandoc</a> converts Word too, from the command line:{" "}
            <code>pandoc file.docx -o file.tex</code> writes the body, and <code>-s</code> makes it a full
            document. It reads every Word structure it knows, extracts the images with{" "}
            <code>--extract-media</code>, handles citations, and runs offline in batch over many files. Use pandoc
            when you convert often, need the images saved for you, or work in scripts.
          </p>
          <p>
            This page needs nothing installed and keeps the file in your browser. Its output is meant to compile
            with pdfLaTeX on the first try: booktabs tables with the caption above, <code>p{"{}"}</code> columns
            when a cell holds a list, Unicode symbols such as &le; or &alpha; mapped to LaTeX, footnotes in
            headings given a short title, and a report of what to check. Use it for a single document when you
            want a clean starting point quickly.
          </p>

          <h2><span className="secnum">4</span>Where to look after converting</h2>
          <p>
            Complex tables with merged cells, custom paragraph styles and very long equations are the usual spots
            to tidy by hand. Characters pdfLaTeX cannot typeset (for example Chinese or Arabic script) are
            replaced with a question mark and listed in a note: fix them by hand, or compile with XeLaTeX or
            LuaLaTeX. Then open the result in the{" "}
            <Link href="/tools/preview">live LaTeX preview</Link> (the button above the converted source does it
            in one click), or start from one of the <Link href="/tools/templates">free templates</Link>{" "}
            and paste the converted body into it.
          </p>

          <h2>Appendix A&ensp;Questions</h2>
          <Faq items={FAQS} name="word-faq" />

          <RelatedTools tools={[
            { label: "Live LaTeX Preview", href: "/tools/preview" },
            { label: "LaTeX Diff",         href: "/tools/diff" },
            { label: "Table Generator",    href: "/tools/table" },
            { label: "BibTeX Tools",       href: "/tools/bibtex" },
            { label: "LaTeX Templates",    href: "/tools/templates" },
          ]} />
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
