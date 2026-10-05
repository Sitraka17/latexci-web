import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";
import WordToLatex from "@/components/WordToLatex";
import Faq from "@/components/Faq";
import { breadcrumbSchema } from "@/lib/breadcrumbs";

export const metadata: Metadata = {
  title: "Word to LaTeX Converter: .docx to .tex in Your Browser",
  description:
    "Convert a Word .docx file to LaTeX in your browser: headings, lists, booktabs tables, links, figures and Word equations become clean LaTeX, with a quality report. Your file is never uploaded.",
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
    q: "Are Word equations converted?",
    a: "Yes. Equations written with Word's equation editor (OMML) are translated into LaTeX math: fractions, roots, sub- and superscripts, sums and matrices. Check complex ones in the preview, as the conversion is best-effort.",
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

const para: CSSProperties = { color: "var(--fg-muted)", fontSize: "0.95rem", lineHeight: 1.75, margin: "0 0 1rem" };
const h2: CSSProperties = { color: "var(--fg)", fontSize: "1.4rem", fontWeight: 700, margin: "0 0 1rem" };
const h3: CSSProperties = { color: "var(--fg)", fontSize: "1.02rem", fontWeight: 600, margin: "1.8rem 0 0.5rem" };

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
        <WordToLatex />

        <section aria-label="About the Word to LaTeX converter" style={{ background: "var(--surface)", borderTop: "1px solid var(--border)" }}>
          <div style={{ maxWidth: 820, margin: "0 auto", padding: "3rem 1.5rem" }}>
            <h2 style={h2}>What the converter does</h2>
            <p style={para}>
              Drop a .docx and the converter rebuilds it as a LaTeX document: Word heading styles become sections,
              bold and italic become <code>\textbf</code> and <code>\textit</code>, bulleted and numbered lists become
              <code> itemize</code> and <code>enumerate</code>, tables become booktabs tables, and hyperlinks keep their
              targets. Equations typed with Word&rsquo;s equation editor are converted to LaTeX math, and every image
              becomes a figure with a placeholder you can point at the real file.
            </p>
            <p style={para}>
              A quality report counts what was found (headings, tables, equations, images, footnotes, links) and
              flags what needs a human look, so you know where to check before compiling.
            </p>
            <h3 style={h3}>Where to look after converting</h3>
            <p style={para}>
              Complex tables with merged cells, custom paragraph styles and very long equations are the usual spots
              to tidy by hand. Then open the result in the{" "}
              <Link href="/tools/preview" style={{ color: "var(--accent)" }}>live LaTeX preview</Link>, or start
              from one of the <Link href="/tools/templates" style={{ color: "var(--accent)" }}>free templates</Link>{" "}
              and paste the converted body into it.
            </p>
            <h2 style={{ ...h2, marginTop: "2.5rem" }}>Frequently asked questions</h2>
            <Faq items={FAQS} name="word-faq" />
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
