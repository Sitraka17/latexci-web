import type { Metadata } from "next";
import Link from "@/components/Link";
import BibFormatPage from "@/components/BibFormatPage";
import BibFormatExamples from "@/components/BibFormatExamples";
import { nodeFormatter } from "@/lib/bib-format-node";
import { SAMPLE_BIB } from "@/lib/bib-format-samples";

export const dynamic = "force-static";

const PATH = "/tools/bibtex-to-mla";
const DESCRIPTION =
  "Convert a .bib file into an MLA 9th edition Works Cited list, sorted and in title case, and paste it into Word with italics and hanging indent. Free.";

export const metadata: Metadata = {
  title: "BibTeX to MLA Converter: Works Cited from a .bib File",
  description: DESCRIPTION,
  keywords: [
    "bibtex to mla", "bibtex to mla converter", "bib to mla", "mla works cited from bibtex",
    "convert bibtex to mla 9", "latex bibliography to mla",
  ],
  alternates: { canonical: PATH },
  openGraph: {
    title: "BibTeX to MLA Converter | latexci",
    description: "Paste a .bib file, copy an MLA 9th edition Works Cited list into Word or Google Docs.",
    url: PATH, type: "website",
  },
  twitter: { card: "summary_large_image", title: "BibTeX to MLA Converter | latexci" },
};

const FAQS = [
  {
    q: "Which edition of MLA does it follow?",
    a: "The ninth edition of the MLA Handbook, through modern-language-association.csl, the style file of the Citation Style Language project. The tests of this page compare its output with sample entries from the MLA Style Center.",
  },
  {
    q: "Do I need to write my titles in title case?",
    a: "No. MLA capitalizes the principal words of a title, and the style does it for you. Words you put in braces in the .bib file are printed exactly as typed, which protects names such as {eBay}.",
  },
  {
    q: "Why does the publisher read Cambridge UP?",
    a: "MLA shortens the names of university presses: University Press becomes UP, and in other names University becomes U and Press becomes P. The converter applies this to the publisher and to the institution of a thesis.",
  },
  {
    q: "Why is https:// missing from my URLs?",
    a: "The ninth edition of the MLA Handbook lets you leave out http:// and https://, and the samples of the MLA Style Center do. DOIs keep their https://doi.org/ prefix.",
  },
  {
    q: "Is my .bib file uploaded anywhere?",
    a: "No. Everything runs in your browser. The page downloads the style files once; your references never leave your computer.",
  },
];

const BOULD = String.raw`@incollection{bould2021,
  author    = {Bould, Mark},
  title     = {Speculative Fiction},
  booktitle = {The {Cambridge} Companion to Twenty-First Century {American} Fiction},
  editor    = {Miller, Joshua},
  publisher = {Cambridge University Press},
  year      = {2021},
  pages     = {63--78}
}`;

export default async function BibtexToMlaPage() {
  const f = nodeFormatter();
  const [bould, sample] = await Promise.all([f.format(BOULD, "mla"), f.format(SAMPLE_BIB, "mla")]);
  const cite = (key: string) => sample.citations.find((c) => c.id === key)?.forms ?? [];

  return (
    <BibFormatPage
      style="mla"
      path={PATH}
      name="BibTeX to MLA"
      heading="BibTeX to MLA Converter"
      tagline="Paste or upload a .bib file and get an MLA 9th edition Works Cited list, ready to paste into Word or Google Docs with italics and hanging indent. No account."
      description={DESCRIPTION}
      faqs={FAQS}
    >
      <h2><span className="secnum">1</span>A Works Cited list from BibTeX</h2>
      <p>
        MLA builds every entry from the same core elements, in a fixed order: author, title of the
        source, title of the container, other contributors, version, number, publisher, date and
        location. BibTeX stores most of them under other names: the container of an article is its{" "}
        <code>journal</code>, of a chapter its <code>booktitle</code>, and the location is the page
        range, the DOI or the URL. The converter maps each field to its element and lets
        citeproc-js, with the official MLA style, put them in order.
      </p>
      <p>
        The list is sorted by the surname of the first author, then by title. Titles of articles and
        chapters go in quotation marks, titles of books and journals in italics, and both are set in
        title case whatever the case in your file. Table 1 shows the sample file.
      </p>
      <BibFormatExamples style="mla" table={1} />

      <h2><span className="secnum">2</span>Containers and contributors</h2>
      <p>
        A chapter is held by a book, a conference paper by its proceedings: MLA calls the larger work
        the container and names its editors with <i>edited by</i>, after its title. Figure 2 shows a
        chapter entry and its output, which matches the sample of the MLA Style Center up to the
        database the chapter was read in.
      </p>
      <figure>
        <div className="figure bib-stack">
          <div>
            <span className="bib-figlabel">BibTeX</span>
            <pre>{BOULD}</pre>
          </div>
          <div>
            <span className="bib-figlabel">MLA 9th edition</span>
            <p className="fmt-ref" dangerouslySetInnerHTML={{ __html: bould.entries[0]?.html ?? "" }} />
          </div>
        </div>
        <figcaption className="caption">
          <b>Figure 2.</b> A chapter in an edited collection. The publisher is shortened to
          Cambridge UP and the page range to 63&ndash;78, as MLA writes them.
        </figcaption>
      </figure>
      <p>
        When you read a work in a database (JSTOR, ProQuest, Cambridge Core), MLA adds the database
        as a second container. BibTeX has no field for it: add it by hand after pasting, before the
        DOI or URL.
      </p>

      <h2><span className="secnum">3</span>In-text citations</h2>
      <p>
        MLA cites in the text with the author&rsquo;s surname and the page, with no comma between
        them. A work by three or more authors takes the first surname and <i>et al.</i> Table 2
        shows the forms the tool gives for two entries of the sample file.
      </p>
      <div className="bib-table">
        <table className="booktabs">
          <thead><tr><th scope="col">Reference</th><th scope="col">Form</th><th scope="col">Citation</th></tr></thead>
          <tbody>
            {[["knuth1984", "Knuth (one author)"], ["bedenel2019", "Bedenel et al. (three authors)"]].flatMap(([key, label]) =>
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

      <h2><span className="secnum">4</span>Before you hand it in</h2>
      <ol className="checklist">
        <li>
          Read the notes under the list: the tool names each entry that lacks a field MLA prints,
          such as the publisher of a book or the pages of a chapter.
        </li>
        <li>
          A web page with no publication date is better cited with the date you read it. Give it
          in the <code>urldate</code> field.
        </li>
        <li>
          Names in braces, <code>{"{World Health Organization}"}</code>, are printed as one
          corporate author, never inverted.
        </li>
      </ol>
      <p>
        Entries can be built from a <Link href="/tools/doi-to-bibtex">DOI</Link> or an{" "}
        <Link href="/tools/isbn-to-bibtex">ISBN</Link> first, then pasted here.
      </p>
    </BibFormatPage>
  );
}
