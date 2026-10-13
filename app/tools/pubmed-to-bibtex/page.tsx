import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";
import BibTexTool from "@/components/BibTexTool";
import Faq from "@/components/Faq";
import { breadcrumbSchema } from "@/lib/breadcrumbs";

export const metadata: Metadata = {
  title: "PubMed to BibTeX: Turn a PMID into a Clean @article",
  description:
    "Paste a PMID and copy an @article entry: author names split correctly (particles, Jr, group authors), journal, volume, pages. Free, no account.",
  keywords: [
    "pubmed to bibtex", "pmid to bibtex", "pubmed bibtex generator",
    "cite pubmed article latex", "ncbi bibtex", "pmid citation generator",
    "medical paper bibtex", "biomedical citation latex",
  ],
  alternates: { canonical: "/tools/pubmed-to-bibtex" },
  openGraph: {
    title: "PubMed to BibTeX Converter | latexci",
    description: "Paste a PMID, get a publication-ready BibTeX entry from NCBI metadata. Free, no signup.",
    url: "/tools/pubmed-to-bibtex", type: "website",
  },
  twitter: { card: "summary_large_image", title: "PubMed to BibTeX Converter | latexci" },
};

const FAQS = [
  {
    q: "What is a PMID and where do I find it?",
    a: "The PubMed ID is the number PubMed assigns to every indexed article; it's shown on the article's PubMed page, usually right under the abstract. Paste the number (37652822), the prefixed form (PMID:37652822), or the full PubMed URL.",
  },
  {
    q: "Where does the citation data come from?",
    a: "From NCBI, the U.S. National Library of Medicine service that runs PubMed. The entry carries the authors, title, journal, year, and identifiers as recorded in the PubMed index.",
  },
  {
    q: "PMID, PMCID, DOI: which should I use?",
    a: "This converter takes the PMID. If you only have the paper's DOI, the DOI converter fetches the same publication via CrossRef. A PMCID (PMC…) identifies the free full-text copy in PubMed Central, look up its article page to get the PMID.",
  },
  {
    q: "Is this suitable for systematic reviews with many citations?",
    a: "It converts one PMID at a time, which suits day-to-day writing. For bulk exports of hundreds of records, a reference manager's PubMed import may fit better; then paste the resulting .bib into the Clean and format tab to tidy it.",
  },
];

const appSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "PubMed to BibTeX Converter | latexci",
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

const EXAMPLE_QUERY = "28498958";
// Real output of the converter for EXAMPLE_QUERY, pasted verbatim.
const EXAMPLE_ENTRY = String.raw`@article{Solis-Mezarino2017_pmid28498958,
  author   = {Solis-Mezarino, V. and Herzog, F.},
  title    = {compleXView: a server for the interpretation of protein abundance and connectivity information to identify protein complexes},
  journal  = {Nucleic acids research},
  year     = {2017},
  month    = jul,
  volume   = {45},
  number   = {W1},
  pages    = {W276-W284},
  doi      = {10.1093/nar/gkx411},
  note     = {PMID: 28498958},
  url      = {https://pubmed.ncbi.nlm.nih.gov/28498958/}
}`;

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

        <section className="paper bib-paper" aria-label="About the PubMed to BibTeX converter">
          <h2><span className="secnum">1</span>Biomedical citations without the retyping</h2>
          <p>
              Clinical and life-science writing leans on PubMed, but LaTeX leans on BibTeX, and copying
              author lists with fifteen names by hand is where citation errors are born. Paste the PMID
              above and the converter pulls the article&rsquo;s metadata from NCBI and formats it as a
              BibTeX entry: authors, title, journal, year, and identifiers, ready for your{" "}
              <code>.bib</code> file.
            </p>

          <figure>
            <div className="figure bib-fig">
              <span className="bib-figlabel">Query: <code>{EXAMPLE_QUERY}</code></span>
              <pre>{EXAMPLE_ENTRY}</pre>
            </div>
            <figcaption className="caption">
              <b>Figure 2.</b> The entry returned for PMID 28498958 (retrieved 11 October 2026). The DOI recorded by PubMed is carried over.
            </figcaption>
          </figure>

          <h3><span className="secnum">1.1</span>Why registry lookups matter in medicine</h3>
          <p>
              Citation accuracy is not cosmetic in biomedical work: reviewers check references, and
              journals reject manuscripts over unverifiable ones. An entry built from the PubMed record
              is traceable by anyone with the PMID, which is exactly what a careful reviewer will do.
            </p>

          <h2><span className="secnum">2</span>Accepted input</h2>
          <p>
            The field accepts a PMID in any of the forms of Table 1.
          </p>
          <div className="bib-table">
            <table className="booktabs">
              <thead>
                <tr><th>Form</th><th>Example</th></tr>
              </thead>
              <tbody>
                <tr><td>Number</td><td><code>28498958</code></td></tr>
                <tr><td>With the PMID prefix</td><td><code>PMID:28498958</code></td></tr>
                <tr><td>PubMed URL</td><td><code>https://pubmed.ncbi.nlm.nih.gov/28498958/</code></td></tr>
              </tbody>
            </table>
          </div>
          <p className="caption"><b>Table 1.</b> Accepted forms of a PubMed identifier.</p>

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
          <Faq items={FAQS} name="pubmed-bibtex-faq" />
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
