import type { Metadata } from "next";
import Link from "@/components/Link";
import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";
import RelatedTools from "@/components/RelatedTools";
import BibTexTool from "@/components/BibTexTool";
import Faq from "@/components/Faq";
import { breadcrumbSchema } from "@/lib/breadcrumbs";

export const metadata: Metadata = {
  title: "arXiv to BibTeX: Paste an ID or URL, Copy the Entry",
  description:
    "Paste 2301.07041 or an arxiv.org link and copy a BibTeX entry with the full author list, year, eprint and archivePrefix, built from the arXiv API. Free.",
  keywords: [
    "arxiv to bibtex", "arxiv bibtex generator", "cite arxiv paper latex",
    "arxiv citation bibtex", "bibtex from arxiv id", "arxiv preprint citation",
    "get bibtex arxiv", "arxiv export bibtex",
  ],
  alternates: { canonical: "/tools/arxiv-to-bibtex" },
  openGraph: {
    title: "arXiv to BibTeX Converter | latexci",
    description: "Paste an arXiv ID, get a clean BibTeX entry straight from the arXiv API. Free, no signup.",
    url: "/tools/arxiv-to-bibtex", type: "website",
  },
  twitter: { card: "summary_large_image", title: "arXiv to BibTeX Converter | latexci" },
};

const FAQS = [
  {
    q: "Which ID formats are accepted?",
    a: "The modern form (2301.07041), the prefixed form (arxiv:2301.07041), or the full abstract URL (https://arxiv.org/abs/2301.07041). Older-style IDs such as math/0309136 follow the same pattern.",
  },
  {
    q: "Where does the metadata come from?",
    a: "From the arXiv API: the same data shown on the paper's abstract page: authors, title, year, and identifier. Nothing is guessed or generated.",
  },
  {
    q: "Should I cite the preprint or the published version?",
    a: "If the paper has since appeared in a journal or conference, most venues prefer you cite the published version. Check the arXiv abstract page for a journal reference or DOI, and use the DOI converter for it. Cite the arXiv version when it is the only one, or when you specifically discuss the preprint.",
  },
  {
    q: "Does it handle paper versions (v1, v2…)?",
    a: "An arXiv ID without a version refers to the latest revision, which is what most citations want. If you need to pin a specific version for reproducibility, note it in the entry after conversion.",
  },
];

const appSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "arXiv to BibTeX Converter | latexci",
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

const EXAMPLE_QUERY = "2301.07041";
// Real output of the converter for EXAMPLE_QUERY, pasted verbatim.
const EXAMPLE_ENTRY = String.raw`@article{Viand2023_2301_07041,
  author       = {Alexander Viand and Christian Knabenhans and Anwar Hithnawi},
  title        = {Verifiable Fully Homomorphic Encryption},
  year         = {2023},
  month        = jan,
  journal      = {arXiv preprint},
  howpublished = {\url{https://arxiv.org/abs/2301.07041}},
  eprint       = {2301.07041},
  archivePrefix= {arXiv},
  note         = {arXiv:2301.07041},
  abstract     = {Fully Homomorphic Encryption (FHE) is seeing [...]}
}`;

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
          tagline="Paste an arXiv ID or abstract URL, get a clean BibTeX entry straight from the arXiv API."
        />

        <section className="paper bib-paper" aria-label="About the arXiv to BibTeX converter">
          <h2><span className="secnum">1</span>Cite preprints without the copy-paste dance</h2>
          <p>
              Machine learning, physics, math, and increasingly economics move on arXiv first, which
              means half the references in a modern paper are preprints. Paste the arXiv ID (from the
              abstract page or the PDF header) above, and the converter fetches the authors, title, and
              year from the arXiv API, formatted as a BibTeX entry ready for your <code>.bib</code> file.
            </p>

          <figure>
            <div className="figure bib-fig">
              <span className="bib-figlabel">Query: <code>{EXAMPLE_QUERY}</code></span>
              <pre>{EXAMPLE_ENTRY}</pre>
            </div>
            <figcaption className="caption">
              <b>Figure 2.</b> The entry returned for arXiv:2301.07041 (retrieved 11 October 2026). The abstract is shortened here; the tool returns it in full, and the cleaner can strip it.
            </figcaption>
          </figure>

          <h3><span className="secnum">1.1</span>Preprint hygiene</h3>
          <p>
              Two habits keep arXiv citations clean. First, when a preprint has been published, cite the
              journal or conference version: the abstract page lists the DOI when one exists (the{" "}
              <Link href="/tools/doi-to-bibtex">DOI converter</Link>{" "}
              handles it from there). Second, keep the arXiv ID in the entry so readers can always find
              the open-access copy.
            </p>

          <h2><span className="secnum">2</span>Accepted input</h2>
          <p>
            The field accepts the identifier in any of the forms of Table 1. A version suffix is dropped, so the entry points to the latest revision.
          </p>
          <div className="bib-table">
            <table className="booktabs">
              <thead>
                <tr><th>Form</th><th>Example</th></tr>
              </thead>
              <tbody>
                <tr><td>Current form</td><td><code>2301.07041</code></td></tr>
                <tr><td>With the arxiv: prefix</td><td><code>arxiv:2301.07041</code></td></tr>
                <tr><td>Abstract URL</td><td><code>https://arxiv.org/abs/2301.07041</code></td></tr>
                <tr><td>With a version</td><td><code>2301.07041v2</code></td></tr>
                <tr><td>Form used before 2007</td><td><code>math/0309136</code></td></tr>
              </tbody>
            </table>
          </div>
          <p className="caption"><b>Table 1.</b> Accepted forms of an arXiv identifier.</p>

          <h2><span className="secnum">3</span>Related tools</h2>
          <p>
            The same page also cleans a whole <code>.bib</code> file and looks up the other kinds of
            identifier. None of these tools needs an account.
          </p>
          <nav aria-label="Related tools">
            <ul className="bib-seealso">
              {RELATED.map(({ label, href }) => (
                <li key={href}><Link href={href}>{label}</Link></li>
              ))}
            </ul>
          </nav>

          <h2>Appendix A&ensp;Questions</h2>
          <Faq items={FAQS} name="arxiv-bibtex-faq" />

          <RelatedTools tools={[
            { label: "Live LaTeX Preview", href: "/tools/preview" },
            { label: "LaTeX Templates",    href: "/tools/templates" },
          ]} />
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
