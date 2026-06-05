import type { Metadata } from "next";
import ToolLayout from "@/components/ToolLayout";
import BibTexTool from "@/components/BibTexTool";

export const metadata: Metadata = {
  title: "BibTeX Tools — DOI, arXiv, PubMed, ISBN Lookup — latexci",
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

export default function BibTexPage() {
  return (
    <ToolLayout>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <BibTexTool />
    </ToolLayout>
  );
}
