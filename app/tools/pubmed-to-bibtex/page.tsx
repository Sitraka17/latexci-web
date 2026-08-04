import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";
import BibTexTool from "@/components/BibTexTool";
import { breadcrumbSchema } from "@/lib/breadcrumbs";

export const metadata: Metadata = {
  title: "PubMed to BibTeX Converter — PMID Lookup",
  description:
    "Convert a PubMed ID (PMID) into a clean BibTeX entry — metadata fetched from NCBI. Built for biomedical and life-science writing. Free, no signup.",
  keywords: [
    "pubmed to bibtex", "pmid to bibtex", "pubmed bibtex generator",
    "cite pubmed article latex", "ncbi bibtex", "pmid citation generator",
    "medical paper bibtex", "biomedical citation latex",
  ],
  alternates: { canonical: "/tools/pubmed-to-bibtex" },
  openGraph: {
    title: "PubMed to BibTeX Converter — latexci",
    description: "Paste a PMID, get a publication-ready BibTeX entry from NCBI metadata. Free, no signup.",
    url: "/tools/pubmed-to-bibtex", type: "website",
  },
  twitter: { card: "summary_large_image", title: "PubMed to BibTeX Converter — latexci" },
};

const FAQS = [
  {
    q: "What is a PMID and where do I find it?",
    a: "The PubMed ID is the number PubMed assigns to every indexed article — it's shown on the article's PubMed page, usually right under the abstract. Paste the number (37652822), the prefixed form (PMID:37652822), or the full PubMed URL.",
  },
  {
    q: "Where does the citation data come from?",
    a: "From NCBI, the U.S. National Library of Medicine service that runs PubMed. The entry carries the authors, title, journal, year, and identifiers as recorded in the PubMed index.",
  },
  {
    q: "PMID, PMCID, DOI — which should I use?",
    a: "This converter takes the PMID. If you only have the paper's DOI, the DOI converter fetches the same publication via CrossRef. A PMCID (PMC…) identifies the free full-text copy in PubMed Central — look up its article page to get the PMID.",
  },
  {
    q: "Is this suitable for systematic reviews with many citations?",
    a: "It converts one PMID at a time, which suits day-to-day writing. For bulk exports of hundreds of records, a reference manager's PubMed import may fit better — then paste the resulting .bib into the Clean & Format tab to tidy it.",
  },
];

const appSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "PubMed to BibTeX Converter — latexci",
  description: "Convert a PubMed ID (PMID) into a formatted BibTeX entry using NCBI metadata.",
  url: "https://latexci.com/tools/pubmed-to-bibtex",
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
const breadcrumb = breadcrumbSchema({ name: "PubMed to BibTeX", path: "/tools/pubmed-to-bibtex" });

const h2: CSSProperties = { color: "var(--fg)", fontSize: "1.4rem", fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 1rem" };
const h3: CSSProperties = { color: "var(--fg)", fontSize: "1.02rem", fontWeight: 600, margin: "1.8rem 0 0.5rem" };
const para: CSSProperties = { color: "var(--fg-muted)", fontSize: "0.95rem", lineHeight: 1.75, margin: "0 0 1rem" };

const RELATED = [
  { label: "DOI → BibTeX",   href: "/tools/doi-to-bibtex" },
  { label: "arXiv → BibTeX", href: "/tools/arxiv-to-bibtex" },
  { label: "ISBN → BibTeX",  href: "/tools/isbn-to-bibtex" },
  { label: "All BibTeX tools", href: "/tools/bibtex" },
];

export default function PubmedToBibtexPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <Navbar />
      <main style={{ flex: 1 }}>
        <BibTexTool
          initialTab="pmid"
          heading="PubMed to BibTeX Converter"
          tagline="Paste a PMID, get a publication-ready BibTeX entry from NCBI metadata."
        />

        <section aria-label="About the PubMed to BibTeX converter" style={{ background: "var(--surface)", borderTop: "1px solid var(--border)" }}>
          <div style={{ maxWidth: 820, margin: "0 auto", padding: "3rem 1.5rem" }}>
            <h2 style={h2}>Biomedical citations without the retyping</h2>
            <p style={para}>
              Clinical and life-science writing leans on PubMed, but LaTeX leans on BibTeX — and copying
              author lists with fifteen names by hand is where citation errors are born. Paste the PMID
              above and the converter pulls the article&rsquo;s metadata from NCBI and formats it as a
              BibTeX entry: authors, title, journal, year, and identifiers, ready for your{" "}
              <code>.bib</code> file.
            </p>
            <h3 style={h3}>Why registry lookups matter in medicine</h3>
            <p style={para}>
              Citation accuracy is not cosmetic in biomedical work — reviewers check references, and
              journals reject manuscripts over unverifiable ones. An entry built from the PubMed record
              is traceable by anyone with the PMID, which is exactly what a careful reviewer will do.
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
