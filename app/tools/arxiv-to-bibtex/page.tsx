import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";
import BibTexTool from "@/components/BibTexTool";
import { breadcrumbSchema } from "@/lib/breadcrumbs";

export const metadata: Metadata = {
  title: "arXiv to BibTeX Converter — Instant Citations",
  description:
    "Turn any arXiv ID (2301.07041, arxiv:2301.07041, or the abstract URL) into a ready-to-paste BibTeX entry, with metadata straight from the arXiv API. Free, no signup.",
  keywords: [
    "arxiv to bibtex", "arxiv bibtex generator", "cite arxiv paper latex",
    "arxiv citation bibtex", "bibtex from arxiv id", "arxiv preprint citation",
    "get bibtex arxiv", "arxiv export bibtex",
  ],
  alternates: { canonical: "/tools/arxiv-to-bibtex" },
  openGraph: {
    title: "arXiv to BibTeX Converter — latexci",
    description: "Paste an arXiv ID, get a clean BibTeX entry straight from the arXiv API. Free, no signup.",
    url: "/tools/arxiv-to-bibtex", type: "website",
  },
  twitter: { card: "summary_large_image", title: "arXiv to BibTeX Converter — latexci" },
};

const FAQS = [
  {
    q: "Which ID formats are accepted?",
    a: "The modern form (2301.07041), the prefixed form (arxiv:2301.07041), or the full abstract URL (https://arxiv.org/abs/2301.07041). Older-style IDs such as math/0309136 follow the same pattern.",
  },
  {
    q: "Where does the metadata come from?",
    a: "From the arXiv API — the same data shown on the paper's abstract page: authors, title, year, and identifier. Nothing is guessed or generated.",
  },
  {
    q: "Should I cite the preprint or the published version?",
    a: "If the paper has since appeared in a journal or conference, most venues prefer you cite the published version — check the arXiv abstract page for a journal reference or DOI, and use the DOI converter for it. Cite the arXiv version when it is the only one, or when you specifically discuss the preprint.",
  },
  {
    q: "Does it handle paper versions (v1, v2…)?",
    a: "An arXiv ID without a version refers to the latest revision, which is what most citations want. If you need to pin a specific version for reproducibility, note it in the entry after conversion.",
  },
];

const appSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "arXiv to BibTeX Converter — latexci",
  description: "Convert an arXiv ID into a formatted BibTeX entry using the arXiv API.",
  url: "https://latexci.com/tools/arxiv-to-bibtex",
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
const breadcrumb = breadcrumbSchema({ name: "arXiv to BibTeX", path: "/tools/arxiv-to-bibtex" });

const h2: CSSProperties = { color: "var(--fg)", fontSize: "1.4rem", fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 1rem" };
const h3: CSSProperties = { color: "var(--fg)", fontSize: "1.02rem", fontWeight: 600, margin: "1.8rem 0 0.5rem" };
const para: CSSProperties = { color: "var(--fg-muted)", fontSize: "0.95rem", lineHeight: 1.75, margin: "0 0 1rem" };

const RELATED = [
  { label: "DOI → BibTeX",    href: "/tools/doi-to-bibtex" },
  { label: "PubMed → BibTeX", href: "/tools/pubmed-to-bibtex" },
  { label: "ISBN → BibTeX",   href: "/tools/isbn-to-bibtex" },
  { label: "All BibTeX tools", href: "/tools/bibtex" },
];

export default function ArxivToBibtexPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <Navbar />
      <main style={{ flex: 1 }}>
        <BibTexTool
          initialTab="arxiv"
          heading="arXiv to BibTeX Converter"
          tagline="Paste an arXiv ID or abstract URL, get a clean BibTeX entry — straight from the arXiv API."
        />

        <section aria-label="About the arXiv to BibTeX converter" style={{ background: "var(--surface)", borderTop: "1px solid var(--border)" }}>
          <div style={{ maxWidth: 820, margin: "0 auto", padding: "3rem 1.5rem" }}>
            <h2 style={h2}>Cite preprints without the copy-paste dance</h2>
            <p style={para}>
              Machine learning, physics, math, and increasingly economics move on arXiv first — which
              means half the references in a modern paper are preprints. Paste the arXiv ID (from the
              abstract page or the PDF header) above, and the converter fetches the authors, title, and
              year from the arXiv API, formatted as a BibTeX entry ready for your <code>.bib</code> file.
            </p>
            <h3 style={h3}>Preprint hygiene</h3>
            <p style={para}>
              Two habits keep arXiv citations clean. First, when a preprint has been published, cite the
              journal or conference version — the abstract page lists the DOI when one exists (the{" "}
              <Link href="/tools/doi-to-bibtex" style={{ color: "var(--accent)" }}>DOI converter</Link>{" "}
              handles it from there). Second, keep the arXiv ID in the entry so readers can always find
              the open-access copy.
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
