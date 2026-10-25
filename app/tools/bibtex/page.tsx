import type { Metadata } from "next";
import Link from "@/components/Link";
import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";
import RelatedTools from "@/components/RelatedTools";
import BibTexTool from "@/components/BibTexTool";
import { breadcrumbSchema } from "@/lib/breadcrumbs";
import { cleanBibTeX } from "@/lib/bibtex";

export const metadata: Metadata = {
  title: "BibTeX Tools: DOI, arXiv, PubMed, ISBN Lookup",
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
    title: "BibTeX Tools | latexci",
    description: "Clean .bib files, look up DOIs, fetch arXiv and PubMed citations. Free, no signup.",
    url: "/tools/bibtex", type: "website",
  },
  twitter: { card: "summary_large_image", title: "BibTeX Tools | latexci" },
};

const schema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "BibTeX Tools | latexci",
  description: "Clean and format BibTeX files, DOI to BibTeX, arXiv to BibTeX, PubMed/PMID to BibTeX.",
  url: "https://latexci.com/tools/bibtex",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Web Browser",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

const breadcrumb = breadcrumbSchema({ name: "BibTeX Tools", path: "/tools/bibtex" });

const CONVERTERS = [
  { label: "DOI → BibTeX",    href: "/tools/doi-to-bibtex",    id: "DOI",       source: "CrossRef",      example: "10.1093/comjnl/27.2.97" },
  { label: "arXiv → BibTeX",  href: "/tools/arxiv-to-bibtex",  id: "arXiv ID",  source: "arXiv API",     example: "1706.03762" },
  { label: "PubMed → BibTeX", href: "/tools/pubmed-to-bibtex", id: "PubMed ID", source: "NCBI PubMed",   example: "34265844" },
  { label: "ISBN → BibTeX",   href: "/tools/isbn-to-bibtex",   id: "ISBN",      source: "Open Library",  example: "9780262033848" },
];

// Figure 2: a deliberately untidy file. The right-hand side is not written by
// hand: it is what cleanBibTeX returns for this input with the default options,
// computed at build time, so the figure cannot drift from the tool.
const MESSY_BIB = `@book{lamport1994, title={{LaTeX}: A Document Preparation System},
author={Leslie Lamport}, publisher={Addison-Wesley},
  year=1994, edition={2},
file={:home/me/books/lamport.pdf:pdf}}

@article{knuth1984,
    author = {Donald E. Knuth},
    title = {Literate Programming},
    journal = {The Computer Journal},
    volume = 27, number = 2, pages = {97--111},
    year = {1984},
    doi = {10.1093/comjnl/27.2.97},
    abstract = {The author and his associates ...}
}

@article{Knuth84copy,
  title={Literate programming}, author={Knuth, Donald E.},
  journal={Comput. J.}, year={1984},
  doi={10.1093/COMJNL/27.2.97}
}`;

const CLEANED = cleanBibTeX(MESSY_BIB, {
  sort: "key",
  removeDuplicates: true,
  normalizeAuthors: true,
  stripFields: ["abstract", "file", "mendeley-tags"],
  uppercaseTypes: true,
});

const OPTIONS: { name: string; def: string; effect: string }[] = [
  {
    name: "Sort entries",
    def: "By key",
    effect: "Orders the entries by citation key, by year (newest first) or by entry type. Don't sort keeps the order of the file.",
  },
  {
    name: "Fields to strip",
    def: "abstract, file, mendeley-tags",
    effect: "Deletes the listed fields from every entry. Reference managers add them; a bibliography style never prints them.",
  },
  {
    name: "Remove duplicates",
    def: "On",
    effect: "Two entries with the same DOI are one reference. Without a DOI, the titles are compared, ignoring case and punctuation. The first entry is kept and each removal is reported.",
  },
  {
    name: "Normalize authors",
    def: "On",
    effect: "Rewrites author and editor names as Last, First. Names that already contain a comma, and names protected by braces, are left alone.",
  },
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

        <section className="paper bib-paper" aria-label="About the BibTeX tools">
          <h2><span className="secnum">1</span>What the cleaner does</h2>
          <p>
            A <code>.bib</code> file that has passed through a reference manager, two co-authors and a
            few copy-pastes from publisher sites stops being readable: three indentation styles, the
            same paper under two keys, abstracts that run for half a page. The cleaner parses the file
            and writes it back in one consistent form. Figure 2 shows the effect on a small example.
          </p>

          <figure>
            <div className="figure bib-stack">
              <div>
                <span className="bib-figlabel">Before: 3 entries, one of them a duplicate</span>
                <pre>{MESSY_BIB}</pre>
              </div>
              <div>
                <span className="bib-figlabel">
                  After: {CLEANED.stats.total - CLEANED.stats.removed} entries, {CLEANED.stats.fieldsStripped} fields stripped
                </span>
                <pre>{CLEANED.output}</pre>
              </div>
            </div>
            <figcaption className="caption">
              <b>Figure 2.</b> An untidy file (top) and the output of the cleaner with its default
              options (bottom). The second Knuth entry carries the same DOI as the first, so it is removed.
            </figcaption>
          </figure>

          <h3><span className="secnum">1.1</span>Options</h3>
          <p>
            Whatever the options, entry types are written in capitals, fields are put in a fixed order
            with the equals signs aligned, and every value is wrapped in braces. Table 1 lists the four
            settings above the editor.
          </p>
          <div className="bib-table">
            <table className="booktabs">
              <thead>
                <tr><th>Option</th><th>Default</th><th>Effect</th></tr>
              </thead>
              <tbody>
                {OPTIONS.map((o) => (
                  <tr key={o.name}>
                    <td style={{ whiteSpace: "nowrap" }}>{o.name}</td>
                    <td>{o.def}</td>
                    <td>{o.effect}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="caption"><b>Table 1.</b> Options of the cleaner.</p>

          <h2><span className="secnum">2</span>Lookups by identifier</h2>
          <p>
            The four other tabs build a single entry from an identifier, by asking the registry that
            holds the record. Nothing is guessed or generated. Only need one converter? Each has its
            own page, listed in Table 2.
          </p>
          <nav aria-label="Dedicated converter pages" className="bib-table">
            <table className="booktabs">
              <thead>
                <tr><th>Identifier</th><th>Source</th><th className="hide-sm">Example</th><th>Page</th></tr>
              </thead>
              <tbody>
                {CONVERTERS.map(({ label, href, id, source, example }) => (
                  <tr key={href}>
                    <td>{id}</td>
                    <td>{source}</td>
                    <td className="hide-sm"><code>{example}</code></td>
                    <td><Link href={href}>{label}</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </nav>
          <p className="caption"><b>Table 2.</b> The four lookups, their data source and their dedicated page.</p>

          <h2><span className="secnum">3</span>Where your file goes</h2>
          <p>
            Nowhere. The cleaner runs entirely in your browser: the <code>.bib</code> file you paste or
            upload is never sent to a server. A lookup sends the identifier you typed, and nothing else,
            to fetch the record.
          </p>
          <p>
            None of the BibTeX tools needs an account, and there is no limit on the size of the file
            beyond what your browser can hold.
          </p>

          <RelatedTools tools={[
            { label: "Live LaTeX Preview", href: "/tools/preview" },
            { label: "LaTeX Diff",         href: "/tools/diff" },
            { label: "LaTeX Templates",    href: "/tools/templates" },
            { label: "Symbol Search",      href: "/tools/symbols" },
          ]} />
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
