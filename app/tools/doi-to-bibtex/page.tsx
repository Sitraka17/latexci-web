import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";
import BibTexTool from "@/components/BibTexTool";
import { breadcrumbSchema } from "@/lib/breadcrumbs";

export const metadata: Metadata = {
  title: "DOI to BibTeX Converter — Free, via CrossRef",
  description:
    "Paste a DOI (or a doi.org link) and get a clean BibTeX entry in seconds — metadata fetched live from CrossRef, the registry publishers deposit to. Free, no signup.",
  keywords: [
    "doi to bibtex", "doi to bibtex converter", "doi bibtex generator",
    "crossref bibtex", "get bibtex from doi", "cite doi latex",
    "doi citation generator", "bibtex from doi online",
  ],
  alternates: { canonical: "/tools/doi-to-bibtex" },
  openGraph: {
    title: "DOI to BibTeX Converter — latexci",
    description: "Paste a DOI, get a publisher-accurate BibTeX entry via CrossRef. Free, no signup.",
    url: "/tools/doi-to-bibtex", type: "website",
  },
  twitter: { card: "summary_large_image", title: "DOI to BibTeX Converter — latexci" },
};

const FAQS = [
  {
    q: "Where does the citation data come from?",
    a: "From CrossRef, the DOI registry where publishers deposit the official metadata for their articles. The entry reflects what the publisher registered — not a guess, and not AI-generated text.",
  },
  {
    q: "What formats can I paste?",
    a: "A bare DOI like 10.1038/s41586-021-03819-2, or a full link — https://doi.org/… and dx.doi.org links are recognized and the DOI is extracted automatically.",
  },
  {
    q: "Why not just ask an AI chatbot for the BibTeX?",
    a: "Language models routinely invent plausible-looking DOIs, page numbers, and even entire papers. This tool performs a real registry lookup, so the entry matches the actual publication record.",
  },
  {
    q: "What about arXiv preprints or books?",
    a: "Preprints are better served by the arXiv converter, and books by the ISBN converter — both free on latexci. If a preprint has been published, prefer citing the journal version via its DOI.",
  },
];

const appSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "DOI to BibTeX Converter — latexci",
  description: "Convert a DOI into a formatted BibTeX entry using CrossRef metadata.",
  url: "https://latexci.com/tools/doi-to-bibtex",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Web Browser",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((f) => ({
    "@type": "Question", name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};
const breadcrumb = breadcrumbSchema({ name: "DOI to BibTeX", path: "/tools/doi-to-bibtex" });

const h2: CSSProperties = { color: "var(--fg)", fontSize: "1.4rem", fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 1rem" };
const h3: CSSProperties = { color: "var(--fg)", fontSize: "1.02rem", fontWeight: 600, margin: "1.8rem 0 0.5rem" };
const para: CSSProperties = { color: "var(--fg-muted)", fontSize: "0.95rem", lineHeight: 1.75, margin: "0 0 1rem" };

const RELATED = [
  { label: "arXiv → BibTeX",  href: "/tools/arxiv-to-bibtex" },
  { label: "PubMed → BibTeX", href: "/tools/pubmed-to-bibtex" },
  { label: "ISBN → BibTeX",   href: "/tools/isbn-to-bibtex" },
  { label: "All BibTeX tools", href: "/tools/bibtex" },
];

export default function DoiToBibtexPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <Navbar />
      <main style={{ flex: 1 }}>
        <BibTexTool
          initialTab="doi"
          heading="DOI to BibTeX Converter"
          tagline="Paste a DOI, get a publisher-accurate BibTeX entry — via CrossRef, free, no signup."
        />

        <section aria-label="About the DOI to BibTeX converter" style={{ background: "var(--surface)", borderTop: "1px solid var(--border)" }}>
          <div style={{ maxWidth: 820, margin: "0 auto", padding: "3rem 1.5rem" }}>
            <h2 style={h2}>From DOI to citation in one paste</h2>
            <p style={para}>
              A DOI (Digital Object Identifier) is the permanent ID attached to most journal articles,
              conference papers, datasets, and book chapters. Paste it above and the converter queries
              CrossRef — the registry where publishers deposit their official metadata — and returns a
              formatted BibTeX entry with the authors, title, venue, year, volume, pages, and the DOI
              field itself. Copy it straight into your <code>.bib</code> file.
            </p>
            <h3 style={h3}>Accurate by construction</h3>
            <p style={para}>
              Because the entry is built from the publisher&rsquo;s registered record, you avoid the two
              classic citation failure modes: hand-typing errors, and AI-hallucinated references that
              look plausible but cite papers that don&rsquo;t exist. Do still give the result a quick
              glance — capitalization you must preserve (like acronyms) belongs in braces, e.g.{" "}
              <code>{"{{DNA}}"}</code>, and some older records carry sparse metadata.
            </p>

            <h2 style={{ ...h2, marginTop: "2.5rem" }}>Frequently asked questions</h2>
            {FAQS.map((f) => (
              <div key={f.q} style={{ marginBottom: "1.3rem" }}>
                <h3 style={{ ...h3, margin: "0 0 0.35rem" }}>{f.q}</h3>
                <p style={{ ...para, margin: 0 }}>{f.a}</p>
              </div>
            ))}

            <nav aria-label="Related tools" style={{ marginTop: "2.5rem", display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
              {RELATED.map(({ label, href }) => (
                <Link key={href} href={href} style={{
                  padding: "0.35rem 0.9rem", borderRadius: 7, border: "1px solid var(--border)",
                  background: "var(--surface2)", fontSize: "0.82rem", color: "var(--fg-muted)", textDecoration: "none",
                }}>
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
