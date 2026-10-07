import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";
import Faq from "@/components/Faq";
import { breadcrumbSchema } from "@/lib/breadcrumbs";

export const metadata: Metadata = {
  title: "Pricing: latexci Is Free",
  description:
    "Every latexci tool is free: live preview, PDF export, Word to LaTeX, BibTeX tools, diff, CV generator and 28 templates. No plan, no limits.",
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "latexci is free",
    description: "Every tool, PDF export included. No plan, no limits.",
    url: "/pricing",
    type: "website",
  },
  twitter: { card: "summary_large_image", title: "latexci is free" },
};

const TOOLS: { name: string; href: string; note: string }[] = [
  { name: "Live LaTeX preview", href: "/tools/preview", note: "PDF export with a free sign-in" },
  { name: "Word to LaTeX", href: "/tools/word-to-latex", note: "unlimited, with a free sign-in" },
  { name: "BibTeX cleaner", href: "/tools/bibtex", note: "plus DOI, arXiv, PubMed and ISBN lookups" },
  { name: "LaTeX diff", href: "/tools/diff", note: "with downloadable patch" },
  { name: "Table generator", href: "/tools/table", note: "booktabs output" },
  { name: "CV generator", href: "/tools/cv-builder", note: "with ORCID import" },
  { name: "Templates", href: "/tools/templates", note: "28 papers, theses, CVs and slides" },
  { name: "Symbol search", href: "/tools/symbols", note: "350+ symbols with live preview" },
];

const FAQS = [
  {
    q: "Is everything really free?",
    a: "Yes. Every tool, PDF export and Word conversion included, with no trial, no card and no usage limit beyond a basic anti-abuse rate limit.",
  },
  {
    q: "Do I need an account?",
    a: "Only for PDF export and Word to LaTeX, and it is a single click with Google. Preview, BibTeX tools, diff, tables, CV generator, symbols and templates work without signing in.",
  },
  {
    q: "How is latexci funded?",
    a: "It is a side project with low running costs: most tools run entirely in your browser. If it saves you time, you can buy the author a coffee.",
  },
  {
    q: "Was there a paid plan before?",
    a: "A Pro plan was announced but never sold. PDF export and unlimited Word conversion, the features it would have covered, are now free for everyone.",
  },
];

const schema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
};


export default function PricingPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema({ name: "Pricing", path: "/pricing" })) }} />
      <Navbar />
      <main className="paper" style={{ flex: 1, width: "100%", boxSizing: "border-box", paddingBottom: "3.5rem" }}>
        <header className="titleblock">
          <h1>latexci is free</h1>
          <p className="subtitle">Every tool, with no plan to choose and no limit to watch</p>
        </header>
        <p>
          Every tool on this site costs nothing. PDF export and Word to LaTeX ask for a free Google
          sign-in; everything else works without an account. Table 1 lists what is included.
        </p>

        <div style={{ overflowX: "auto", margin: "1.25rem 0 0" }}>
          <table className="booktabs">
            <thead>
              <tr><th>Tool</th><th>Included</th></tr>
            </thead>
            <tbody>
              {TOOLS.map((t) => (
                <tr key={t.href}>
                  <td style={{ whiteSpace: "nowrap" }}><Link href={t.href}>{t.name}</Link></td>
                  <td>{t.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="caption"><b>Table 1.</b> What you get, at no cost.</p>

        <h2><span className="secnum">1</span>Supporting the project</h2>
        <p>
          latexci is maintained on spare time. If it saved you an evening of fighting with LaTeX, a coffee
          helps keep it running.
        </p>
        <p style={{ marginTop: "1rem" }}>
          <a href="https://buymeacoffee.com/sitraka" target="_blank" rel="noopener" className="btn">Buy me a coffee</a>
        </p>

        <h2>Appendix A&ensp;Questions</h2>
        <Faq items={FAQS} name="pricing-faq" />
      </main>
      <SiteFooter />
    </div>
  );
}
