import type { Metadata } from "next";
import Link from "@/components/Link";
import BibFormatPage from "@/components/BibFormatPage";
import BibFormatExamples from "@/components/BibFormatExamples";
import { nodeFormatter } from "@/lib/bib-format-node";
import { SAMPLE_BIB } from "@/lib/bib-format-samples";

export const dynamic = "force-static";

const PATH = "/tools/bibtex-to-apa";
const DESCRIPTION =
  "Turn a .bib file into an APA 7th edition reference list, sorted and in sentence case, and paste it into Word with italics and hanging indent. Free.";

export const metadata: Metadata = {
  title: "BibTeX to APA Converter: Copy References into Word",
  description: DESCRIPTION,
  keywords: [
    "bibtex to apa", "bibtex to apa converter", "bib to apa", "convert bibtex to apa 7",
    "apa reference list from bibtex", "bibtex apa word", "latex bibliography to apa",
  ],
  alternates: { canonical: PATH },
  openGraph: {
    title: "BibTeX to APA Converter | latexci",
    description: "Paste a .bib file, copy an APA 7th edition reference list into Word or Google Docs.",
    url: PATH, type: "website",
  },
  twitter: { card: "summary_large_image", title: "BibTeX to APA Converter | latexci" },
};

const FAQS = [
  {
    q: "Is the output really APA 7th edition?",
    a: "It is produced by citeproc-js with apa.csl, the APA 7th edition style maintained by the Citation Style Language project and used by Zotero. The test suite of this page compares its output with the sample references published on apastyle.apa.org, character for character.",
  },
  {
    q: "Why are my titles lowercased?",
    a: "APA writes the titles of articles, books and chapters in sentence case. The converter lowercases the title as BibTeX does, keeping words in braces, acronyms such as DNA and words with inner capitals such as iPhone. Put proper nouns in braces, {United States}, or untick the sentence-case box if your file is already in sentence case.",
  },
  {
    q: "Will the italics survive in Word?",
    a: "Yes. Copy for Word / Docs puts the list on the clipboard as formatted text: italics, a 0.5 inch hanging indent and double spacing, which Word and Google Docs keep when you paste. Copy plain text gives the same references without formatting.",
  },
  {
    q: "Is my .bib file uploaded anywhere?",
    a: "No. Parsing and formatting run in your browser; the page only downloads the style files. Nothing you paste or upload is sent to a server.",
  },
  {
    q: "How do I mark a dissertation as unpublished?",
    a: "With the BibTeX type field: type = {Unpublished doctoral dissertation} prints [Unpublished doctoral dissertation] as in the APA sample. Without it, a @phdthesis prints [Doctoral dissertation] and a @mastersthesis [Master's thesis].",
  },
];

const GRADY = String.raw`@article{grady2019,
  author  = {Grady, J. S. and Her, M. and Moreno, G. and Perez, C. and Yelinek, J.},
  title   = {Emotions in Storybooks: A Comparison of Storybooks That Represent Ethnic and Racial Groups in the {United States}},
  journal = {Psychology of Popular Media Culture},
  year    = {2019}, volume = {8}, number = {3}, pages = {207--217},
  doi     = {10.1037/ppm0000185}
}`;

export default async function BibtexToApaPage() {
  const f = nodeFormatter();
  const [braced, unbraced, sample] = await Promise.all([
    f.format(GRADY, "apa"),
    f.format(GRADY.replace("{United States}", "United States"), "apa"),
    f.format(SAMPLE_BIB, "apa"),
  ]);
  const cite = (key: string) => sample.citations.find((c) => c.id === key)?.forms ?? [];

  return (
    <BibFormatPage
      style="apa"
      path={PATH}
      name="BibTeX to APA"
      heading="BibTeX to APA Converter"
      tagline="Paste or upload a .bib file and get an APA 7th edition reference list you can paste into Word or Google Docs, italics and hanging indent included. No account."
      description={DESCRIPTION}
      faqs={FAQS}
    >
      <h2><span className="secnum">1</span>From a .bib file to an APA reference list</h2>
      <p>
        A paper written in LaTeX keeps its references in a <code>.bib</code> file, but a journal,
        a thesis office or a co-author working in Word asks for an APA reference list. This page
        reads the file, maps every entry to the Citation Style Language data model and hands it to
        citeproc-js with the official APA 7th edition style. The list comes out sorted by the
        surname of the first author, then by year, with <i>2019a</i> and <i>2019b</i> when one
        author has two works in the same year.
      </p>
      <p>
        Table 1 shows what each entry type of the sample file becomes. The DOI is printed as a
        link, <code>https://doi.org/&hellip;</code>, as APA asks; the journal name and volume are
        in italics, the issue number is not.
      </p>
      <BibFormatExamples style="apa" table={1} />

      <h2><span className="secnum">2</span>Sentence case and braces</h2>
      <p>
        APA sets the title of an article, a book or a chapter in sentence case: only the first
        word, the first word after a colon, and proper nouns take a capital. A <code>.bib</code>{" "}
        file usually stores titles in title case, so the converter lowercases them with the rule
        BibTeX itself applies: text in braces is left alone. Figure 2 shows why the braces matter.
      </p>
      <figure>
        <div className="figure bib-stack">
          <div>
            <span className="bib-figlabel">With <code>{"{United States}"}</code> in braces</span>
            <p className="fmt-ref" dangerouslySetInnerHTML={{ __html: braced.entries[0]?.html ?? "" }} />
          </div>
          <div>
            <span className="bib-figlabel">Without braces</span>
            <p className="fmt-ref" dangerouslySetInnerHTML={{ __html: unbraced.entries[0]?.html ?? "" }} />
          </div>
        </div>
        <figcaption className="caption">
          <b>Figure 2.</b> The same entry formatted twice. Without braces, the proper noun loses its
          capital, as it would in a BibTeX bibliography.
        </figcaption>
      </figure>
      <p>
        Acronyms (DNA, COVID-19) and words with a capital inside (iPhone, LaTeX) are kept without
        braces. If your titles are already in sentence case, untick the box above the list.
      </p>

      <h2><span className="secnum">3</span>In-text citations</h2>
      <p>
        Below the list, the tool gives the in-text form of each reference: parenthetical,
        with a page number, and narrative. Table 2 shows two entries of the sample file. A work
        by three or more authors is cited with the first surname and <i>et al.</i> from the first
        citation on.
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
      <p className="caption"><b>Table 2.</b> In-text citations produced for two entries of the sample file.</p>

      <h2><span className="secnum">4</span>What to check before you submit</h2>
      <p>
        A style can only print the data it is given. Under the list, the tool names every entry
        that lacks a field APA prints for its type: a year (APA then writes <i>n.d.</i>), the
        publisher of a book, the journal of an article, the book title and pages of a chapter.
        Three more points are worth a look.
      </p>
      <ol className="checklist">
        <li>
          Proper nouns in titles need braces, or they are lowercased (Section 2).
        </li>
        <li>
          A dissertation found in a database is cited with the database name, which BibTeX has no
          field for; add it by hand after pasting.
        </li>
        <li>
          Entries made by a reference manager often carry the journal name in an abbreviated
          form; APA wants the full name.
        </li>
      </ol>
      <p>
        Need the entries first? Build them from an identifier with the{" "}
        <Link href="/tools/doi-to-bibtex">DOI</Link>, <Link href="/tools/arxiv-to-bibtex">arXiv</Link>,{" "}
        <Link href="/tools/pubmed-to-bibtex">PubMed</Link> or <Link href="/tools/isbn-to-bibtex">ISBN</Link>{" "}
        converters, then paste them here.
      </p>
    </BibFormatPage>
  );
}
