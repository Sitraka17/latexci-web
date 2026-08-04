import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";
import BibTexTool from "@/components/BibTexTool";
import { breadcrumbSchema } from "@/lib/breadcrumbs";

export const metadata: Metadata = {
  title: "BibTeX Tools — DOI, arXiv, PubMed, ISBN Lookup",
  description:
    "Free BibTeX tools: clean and format .bib files, look up DOIs via CrossRef, fetch arXiv and PubMed citations, convert ISBNs to @book entries. No signup, works in any browser.",
  keywords: [
    "bibtex cleaner", "bibtex formatter", "doi to bibtex", "arxiv to bibtex",
    "pubmed to bibtex", "pmid to bibtex", "isbn to bibtex", "book bibtex generator",
    "bibtex tidy", "bib file cleaner", "latex bibliography tool",
    "citation formatter", "bibtex online", "clean bibtex file",
    "ncbi bibtex", "pubmed citation latex", "open library bibtex",
  ],
  alternates: { canonical: "/tools/bibtex" },
  openGraph: {
    title: "BibTeX Tools — latexci",
    description: "Clean .bib files, look up DOIs, fetch arXiv and PubMed citations — free, no signup.",
    url: "/tools/bibtex", type: "website",
  },
  twitter: { card: "summary_large_image", title: "BibTeX Tools — latexci" },
};

const schema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "BibTeX Tools — latexci",
  description: "Clean and format BibTeX files, DOI to BibTeX, arXiv to BibTeX, PubMed/PMID to BibTeX.",
  url: "https://latexci.com/tools/bibtex",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Web Browser",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

const breadcrumb = breadcrumbSchema({ name: "BibTeX Tools", path: "/tools/bibtex" });

const CONVERTERS = [
  { label: "DOI → BibTeX",    href: "/tools/doi-to-bibtex" },
  { label: "arXiv → BibTeX",  href: "/tools/arxiv-to-bibtex" },
  { label: "PubMed → BibTeX", href: "/tools/pubmed-to-bibtex" },
  { label: "ISBN → BibTeX",   href: "/tools/isbn-to-bibtex" },
];

export default function BibTexPage() {
  return (
    // Scrolling page (not the fixed 100dvh ToolLayout): BibTexTool's content can
    // be taller than the viewport, and ToolLayout's overflow:hidden clipped it
    // with no way to scroll. Same shell as /tools/symbols.
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <Navbar />
      <main style={{ flex: 1 }}>
        <BibTexTool />

        {/* Dedicated single-converter pages (deep links) */}
        <nav
          aria-label="Dedicated converter pages"
          style={{ maxWidth: 1100, margin: "0 auto", padding: "0 1.5rem 3rem", textAlign: "center" }}
        >
          <p style={{ fontSize: "0.85rem", color: "var(--fg-muted)", marginBottom: "0.75rem" }}>
            Only need one converter? Each has its own page:
          </p>
          <div style={{ display: "flex", gap: "0.6rem", justifyContent: "center", flexWrap: "wrap" }}>
            {CONVERTERS.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                style={{
                  padding: "0.35rem 0.9rem", borderRadius: 7,
                  border: "1px solid var(--border)", background: "var(--surface2)",
                  fontSize: "0.82rem", color: "var(--fg-muted)", textDecoration: "none",
                }}
              >
                {label}
              </Link>
            ))}
          </div>
        </nav>
      </main>
      <SiteFooter />
    </div>
  );
}
