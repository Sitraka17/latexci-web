import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";
import BibTexTool from "@/components/BibTexTool";
import Faq from "@/components/Faq";
import { breadcrumbSchema } from "@/lib/breadcrumbs";

export const metadata: Metadata = {
  title: "DOI to BibTeX Converter: Free, via CrossRef",
  description:
    "Paste a DOI (or a doi.org link) and get a clean BibTeX entry in seconds: metadata fetched live from CrossRef, the registry publishers deposit to. Free, no signup.",
  keywords: [
    "doi to bibtex", "doi to bibtex converter", "doi bibtex generator",
    "crossref bibtex", "get bibtex from doi", "cite doi latex",
    "doi citation generator", "bibtex from doi online",
  ],
  alternates: { canonical: "/tools/doi-to-bibtex" },
  openGraph: {
    title: "DOI to BibTeX Converter | latexci",
    description: "Paste a DOI, get a publisher-accurate BibTeX entry via CrossRef. Free, no signup.",
    url: "/tools/doi-to-bibtex", type: "website",
  },
  twitter: { card: "summary_large_image", title: "DOI to BibTeX Converter | latexci" },
};

const FAQS = [
  {
    q: "Where does the citation data come from?",
    a: "From CrossRef, the DOI registry where publishers deposit the official metadata for their articles. The entry reflects what the publisher registered, not a guess, and not AI-generated text.",
  },
  {
    q: "What formats can I paste?",
    a: "A bare DOI like 10.1038/s41586-021-03819-2, or a full link: https://doi.org/… and dx.doi.org links are recognized and the DOI is extracted automatically.",
  },
  {
    q: "Why not just ask an AI chatbot for the BibTeX?",
    a: "Language models routinely invent plausible-looking DOIs, page numbers, and even entire papers. This tool performs a real registry lookup, so the entry matches the actual publication record.",
  },
  {
    q: "What about arXiv preprints or books?",
    a: "Preprints are better served by the arXiv converter, and books by the ISBN converter, both free on latexci. If a preprint has been published, prefer citing the journal version via its DOI.",
  },
];

const appSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "DOI to BibTeX Converter | latexci",
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

const EXAMPLE_QUERY = "10.1093/comjnl/27.2.97";
// Real output of the converter for EXAMPLE_QUERY, pasted verbatim.
const EXAMPLE_ENTRY = String.raw`@article{Knuth_1984,
  title        = {Literate Programming},
  volume       = {27},
  issn         = {1460-2067},
  url          = {http://dx.doi.org/10.1093/comjnl/27.2.97},
  doi          = {10.1093/comjnl/27.2.97},
  number       = {2},
  journal      = {The Computer Journal},
  publisher    = {Oxford University Press (OUP)},
  author       = {Knuth, D. E.},
  year         = {1984},
  month        = Feb,
  pages        = {97–111}
}`;

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
          tagline="Paste a DOI, get a publisher-accurate BibTeX entry via CrossRef. Free, no signup."
        />

        <section className="paper bib-paper" aria-label="About the DOI to BibTeX converter">
          <h2><span className="secnum">1</span>From DOI to citation in one paste</h2>
          <p>
              A DOI (Digital Object Identifier) is the permanent ID attached to most journal articles,
              conference papers, datasets, and book chapters. Paste it above and the converter queries
              CrossRef, the registry where publishers deposit their official metadata, and returns a
              formatted BibTeX entry with the authors, title, venue, year, volume, pages, and the DOI
              field itself. Copy it straight into your <code>.bib</code> file.
            </p>

          <figure>
            <div className="figure bib-fig">
              <span className="bib-figlabel">Query: <code>{EXAMPLE_QUERY}</code></span>
              <pre>{EXAMPLE_ENTRY}</pre>
            </div>
            <figcaption className="caption">
              <b>Figure 2.</b> The entry returned for the DOI of Knuth&rsquo;s <em>Literate Programming</em>, exactly as CrossRef serves it (retrieved 11 October 2026).
            </figcaption>
          </figure>

          <h3><span className="secnum">1.1</span>Accurate by construction</h3>
          <p>
              Because the entry is built from the publisher&rsquo;s registered record, you avoid the two
              classic citation failure modes: hand-typing errors, and AI-hallucinated references that
              look plausible but cite papers that don&rsquo;t exist. Do still give the result a quick
              glance: capitalization you must preserve (like acronyms) belongs in braces, e.g.{" "}
              <code>{"{{DNA}}"}</code>, and some older records carry sparse metadata.
            </p>

          <h2><span className="secnum">2</span>Accepted input</h2>
          <p>
            The field accepts a DOI in any of the forms of Table 1; wrappers are removed before the lookup.
          </p>
          <div className="bib-table">
            <table className="booktabs">
              <thead>
                <tr><th>Form</th><th>Example</th></tr>
              </thead>
              <tbody>
                <tr><td>Bare DOI</td><td><code>10.1093/comjnl/27.2.97</code></td></tr>
                <tr><td>With the doi: prefix</td><td><code>doi:10.1093/comjnl/27.2.97</code></td></tr>
                <tr><td>Resolver link</td><td><code>https://doi.org/10.1093/comjnl/27.2.97</code></td></tr>
                <tr><td>Older resolver link</td><td><code>http://dx.doi.org/10.1093/comjnl/27.2.97</code></td></tr>
              </tbody>
            </table>
          </div>
          <p className="caption"><b>Table 1.</b> Ways to write the same DOI.</p>

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
          <Faq items={FAQS} name="doi-bibtex-faq" />
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
