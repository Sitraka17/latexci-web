import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";
import BibTexTool from "@/components/BibTexTool";
import Faq from "@/components/Faq";
import { breadcrumbSchema } from "@/lib/breadcrumbs";

export const metadata: Metadata = {
  title: "ISBN to BibTeX Converter: Paste an ISBN, Copy @book",
  description:
    "Type an ISBN-10 or ISBN-13, hyphens included, and copy a clean @book entry: authors, title, publisher, year, edition. Free, no account, in your browser.",
  keywords: [
    "isbn to bibtex", "isbn bibtex generator", "book bibtex entry",
    "cite book latex", "bibtex book citation", "isbn citation generator",
    "textbook bibtex", "open library bibtex",
  ],
  alternates: { canonical: "/tools/isbn-to-bibtex" },
  openGraph: {
    title: "ISBN to BibTeX Converter | latexci",
    description: "Paste an ISBN, get a formatted @book BibTeX entry from Open Library data. Free, no signup.",
    url: "/tools/isbn-to-bibtex", type: "website",
  },
  twitter: { card: "summary_large_image", title: "ISBN to BibTeX Converter | latexci" },
};

const FAQS = [
  {
    q: "ISBN-10 or ISBN-13: which one works?",
    a: "Both. Use the ISBN printed on the book's copyright page or back cover: modern books carry an ISBN-13 starting with 978 or 979; older ones an ISBN-10.",
  },
  {
    q: "Where does the book data come from?",
    a: "From Open Library, the Internet Archive's open catalog of published books. The entry includes the title, authors, publisher, and year as recorded there.",
  },
  {
    q: "The year doesn't match my copy: why?",
    a: "An ISBN identifies a specific edition. If you're citing a different edition than the one the ISBN belongs to, look up the ISBN of your actual copy: page numbers and even chapter structure can differ between editions.",
  },
  {
    q: "What about book chapters or edited volumes?",
    a: "The converter produces a @book entry. For a chapter in an edited volume, start from the @book entry and adapt it to @incollection or @inbook, adding the chapter title, editors, and page range, or use the DOI converter if the chapter has its own DOI.",
  },
];

const appSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "ISBN to BibTeX Converter | latexci",
  description: "Convert an ISBN into a formatted BibTeX @book entry using Open Library data.",
  url: "https://latexci.com/tools/isbn-to-bibtex",
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
const breadcrumb = breadcrumbSchema({ name: "ISBN to BibTeX", path: "/tools/isbn-to-bibtex" });

const EXAMPLE_QUERY = "9780201633610";
// Real output of the converter for EXAMPLE_QUERY, pasted verbatim.
const EXAMPLE_ENTRY = String.raw`@book{Gamma1995_isbn9780201633610,
  author    = {Erich Gamma and Richard Helm and Ralph Johnson and John Vlissides},
  title     = {Design Patterns: Elements of Reusable Object-Oriented Software (Addison-Wesley Professional Computing Series)},
  publisher = {Addison-Wesley Professional},
  year      = {1995},
  pages     = {395},
  isbn      = {9780201633610},
  note      = {Open Library: https://openlibrary.org/works/OL6030812W}
}`;

const RELATED = [
  { label: "DOI → BibTeX",    href: "/tools/doi-to-bibtex" },
  { label: "arXiv → BibTeX",  href: "/tools/arxiv-to-bibtex" },
  { label: "PubMed → BibTeX", href: "/tools/pubmed-to-bibtex" },
  { label: "All BibTeX tools", href: "/tools/bibtex" },
];

export default function IsbnToBibtexPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <Navbar />
      <main style={{ flex: 1 }}>
        <BibTexTool
          initialTab="isbn"
          heading="ISBN to BibTeX Converter"
          tagline="Paste an ISBN-10 or ISBN-13, get a formatted @book entry from Open Library data."
        />

        <section className="paper bib-paper" aria-label="About the ISBN to BibTeX converter">
          <h2><span className="secnum">1</span>Books deserve better than hand-typed citations</h2>
          <p>
              Articles have DOIs; books have ISBNs. Paste the one from the copyright page above and the
              converter looks it up in Open Library and returns a BibTeX <code>@book</code> entry (title,
              authors, publisher, and year), ready to paste into your <code>.bib</code>{" "}file. Handy for
              textbooks in course notes, monographs in a thesis&rsquo; literature review, or methods
              handbooks in a paper.
            </p>

          <figure>
            <div className="figure bib-fig">
              <span className="bib-figlabel">Query: <code>{EXAMPLE_QUERY}</code></span>
              <pre>{EXAMPLE_ENTRY}</pre>
            </div>
            <figcaption className="caption">
              <b>Figure 2.</b> The entry returned for ISBN 9780201633610 (retrieved 11 October 2026). Catalogue titles sometimes carry a series name, as here: trim it before citing.
            </figcaption>
          </figure>

          <h3><span className="secnum">1.1</span>Mind the edition</h3>
          <p>
              An ISBN identifies one specific edition of a book. If your citation includes page numbers,
              make sure the ISBN you convert matches the copy on your desk: editions can differ in
              pagination and content. When in doubt, the copyright page of your copy has the right ISBN.
            </p>

          <h2><span className="secnum">2</span>Accepted input</h2>
          <p>
            The field accepts an ISBN in any of the forms of Table 1. The check digit is verified before the lookup, which catches most typing errors.
          </p>
          <div className="bib-table">
            <table className="booktabs">
              <thead>
                <tr><th>Form</th><th>Example</th></tr>
              </thead>
              <tbody>
                <tr><td>ISBN-13</td><td><code>9780201633610</code></td></tr>
                <tr><td>ISBN-13 with hyphens</td><td><code>978-0-201-63361-0</code></td></tr>
                <tr><td>ISBN-10</td><td><code>0201633612</code></td></tr>
                <tr><td>With a label</td><td><code>ISBN 978-0-201-63361-0</code></td></tr>
              </tbody>
            </table>
          </div>
          <p className="caption"><b>Table 1.</b> Ways to write the same book number.</p>

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
          <Faq items={FAQS} name="isbn-bibtex-faq" />
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
