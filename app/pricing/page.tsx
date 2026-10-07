import type { Metadata } from "next";
import type { CSSProperties } from "react";
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

const cell: CSSProperties = { padding: "0.6rem 0.75rem", borderBottom: "1px solid var(--border)", fontSize: "0.9rem", textAlign: "left" };

export default function PricingPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema({ name: "Pricing", path: "/pricing" })) }} />
      <Navbar />
      <main style={{ flex: 1, maxWidth: 760, width: "100%", margin: "0 auto", padding: "3rem 1.5rem 4rem", boxSizing: "border-box" }}>
        <h1 style={{ fontSize: "clamp(1.7rem, 4vw, 2.3rem)", fontWeight: 800, margin: "0 0 0.75rem" }}>latexci is free</h1>
        <p style={{ fontSize: "1rem", lineHeight: 1.7, color: "var(--fg-muted)", margin: "0 0 2rem" }}>
          Every tool on this site costs nothing. PDF export and Word to LaTeX ask for a free
          Google sign-in; everything else works without an account.
        </p>

        <div style={{ border: "1px solid var(--border)", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <caption style={{ captionSide: "bottom", textAlign: "left", fontSize: "0.78rem", color: "var(--fg-muted)", padding: "0.5rem 0.75rem" }}>
              Table 1. What you get, at no cost.
            </caption>
            <thead>
              <tr>
                <th style={{ ...cell, fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--fg-muted)" }}>Tool</th>
                <th style={{ ...cell, fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--fg-muted)" }}>Included</th>
              </tr>
            </thead>
            <tbody>
              {TOOLS.map((t) => (
                <tr key={t.href}>
                  <td style={cell}><Link href={t.href} style={{ color: "var(--fg)", fontWeight: 600 }}>{t.name}</Link></td>
                  <td style={{ ...cell, color: "var(--fg-muted)" }}>{t.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 style={{ fontSize: "1.2rem", fontWeight: 700, margin: "2.5rem 0 0.75rem" }}>Supporting the project</h2>
        <p style={{ fontSize: "0.95rem", lineHeight: 1.7, color: "var(--fg-muted)", margin: "0 0 1rem" }}>
          latexci is maintained on spare time. If it saved you an evening of fighting with LaTeX, a coffee helps keep it running.
        </p>
        <a
          href="https://buymeacoffee.com/sitraka"
          target="_blank"
          rel="noopener"
          style={{ display: "inline-block", padding: "0.6rem 1.1rem", background: "#ffdd00", color: "#000", fontWeight: 700, fontSize: "0.9rem", textDecoration: "none", border: "1px solid #e6c700" }}
        >
          Buy me a coffee
        </a>

        <h2 style={{ fontSize: "1.2rem", fontWeight: 700, margin: "2.5rem 0 1rem" }}>Frequently asked questions</h2>
        <Faq items={FAQS} name="pricing-faq" />
      </main>
      <SiteFooter />
    </div>
  );
}
