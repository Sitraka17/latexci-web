import type { Metadata } from "next";
import Link from "@/components/Link";
import BibFormatPage from "@/components/BibFormatPage";
import BibFormatExamples from "@/components/BibFormatExamples";
import { nodeFormatter } from "@/lib/bib-format-node";
import { SAMPLE_BIB } from "@/lib/bib-format-samples";

export const dynamic = "force-static";

const PATH = "/tools/bibtex-to-harvard";
const DESCRIPTION =
  "Convert a .bib file into a Harvard reference list (Cite Them Right) and paste it into Word with italics and hanging indent. Free, in your browser.";

export const metadata: Metadata = {
  title: "BibTeX to Harvard Converter: Cite Them Right Reference List",
  description: DESCRIPTION,
  keywords: [
    "bibtex to harvard", "bibtex to harvard converter", "bib to harvard referencing",
    "harvard reference list from bibtex", "cite them right bibtex", "convert bibtex to harvard style",
  ],
  alternates: { canonical: PATH },
  openGraph: {
    title: "BibTeX to Harvard Converter | latexci",
    description: "Paste a .bib file, copy a Harvard (Cite Them Right) reference list into Word or Google Docs.",
    url: PATH, type: "website",
  },
  twitter: { card: "summary_large_image", title: "BibTeX to Harvard Converter | latexci" },
};

const FAQS = [
  {
    q: "Which Harvard style is this?",
    a: "Harvard is a family of author-date styles, and each university may have its own variant. This page uses Cite Them Right, 12th edition, the version many UK and Irish universities follow, through the official harvard-cite-them-right.csl file of the Citation Style Language project.",
  },
  {
    q: "My university has its own Harvard guide. Can I still use this?",
    a: "Usually yes, as a first draft: the order of the elements is the same in most variants. Compare one entry of each type with your guide; the usual differences are punctuation around the year and the wording of the access date.",
  },
  {
    q: "How do I add the date I accessed a web page?",
    a: "Give it in the urldate field of the entry, for example urldate = {2026-11-20}. Cite Them Right prints it after the URL.",
  },
  {
    q: "When does the in-text citation use et al.?",
    a: "With four or more authors, the citation gives the first surname and et al. Up to three authors, every surname is written, joined by and.",
  },
  {
    q: "Is my .bib file uploaded anywhere?",
    a: "No. Everything runs in your browser. The page downloads the style file once; your references never leave your computer.",
  },
];

export default async function BibtexToHarvardPage() {
  const f = nodeFormatter();
  const sample = await f.format(SAMPLE_BIB, "harvard");
  const cite = (key: string) => sample.citations.find((c) => c.id === key)?.forms ?? [];

  return (
    <BibFormatPage
      style="harvard"
      path={PATH}
      name="BibTeX to Harvard"
      heading="BibTeX to Harvard Converter"
      tagline="Paste or upload a .bib file and get a Harvard reference list (Cite Them Right, 12th edition), ready to paste into Word or Google Docs with italics and hanging indent. No account."
      description={DESCRIPTION}
      faqs={FAQS}
    >
      <h2><span className="secnum">1</span>A Harvard reference list from BibTeX</h2>
      <p>
        Harvard is an author-date system: the text gives the surname and the year, and the reference
        list, sorted by surname, gives the full entry. In Cite Them Right, the year follows the
        authors in brackets, the title of an article or chapter goes in single quotation marks and the
        title of the journal or book in italics. A DOI is printed as a link after <i>Available at:</i>.
      </p>
      <p>
        The converter maps each BibTeX field to the matching element and lets citeproc-js, with the
        official Cite Them Right style and British English settings, write the entry. Table 1 shows
        one entry of each type from the sample file.
      </p>
      <BibFormatExamples style="harvard" table={1} />

      <h2><span className="secnum">2</span>In-text citations</h2>
      <p>
        A citation in brackets gives the surname and the year, separated by a comma; a narrative
        citation puts the year in brackets after the name. Table 2 shows the forms the tool gives for
        two entries of the sample file.
      </p>
      <div className="bib-table">
        <table className="booktabs">
          <thead><tr><th scope="col">Reference</th><th scope="col">Form</th><th scope="col">Citation</th></tr></thead>
          <tbody>
            {[["knuth1984", "Knuth (one author)"], ["bedenel2019", "Bedenel (three authors)"]].flatMap(([key, label]) =>
              cite(key).map((form, k) => (
                <tr key={`${key}-${k}`}>
                  {k === 0 && <td rowSpan={cite(key).length}>{label}</td>}
                  <td>{form.label}</td>
                  <td dangerouslySetInnerHTML={{ __html: form.html }} />
                </tr>
              )),
            )}
          </tbody>
        </table>
      </div>
      <p className="caption"><b>Table 2.</b> In-text citations for two entries; the page is the first page of each entry.</p>

      <h2><span className="secnum">3</span>Before you hand it in</h2>
      <ol className="checklist">
        <li>
          Check your department&rsquo;s own Harvard guide against Table 1. Variants differ mostly in
          punctuation and in how the access date is written.
        </li>
        <li>
          Web pages need the date you read them: add a <code>urldate</code> field to each{" "}
          <code>@online</code> entry.
        </li>
        <li>
          Read the notes under the list: the tool names each entry that lacks a field the style prints,
          such as the publisher of a book.
        </li>
      </ol>
      <p>
        Entries can be built from a <Link href="/tools/doi-to-bibtex">DOI</Link> or an{" "}
        <Link href="/tools/isbn-to-bibtex">ISBN</Link> first, then pasted here.
      </p>
    </BibFormatPage>
  );
}
