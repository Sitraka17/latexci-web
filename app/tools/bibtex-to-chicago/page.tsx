import type { Metadata } from "next";
import Link from "@/components/Link";
import BibFormatPage from "@/components/BibFormatPage";
import BibFormatExamples from "@/components/BibFormatExamples";
import { nodeFormatter } from "@/lib/bib-format-node";
import { SAMPLE_BIB } from "@/lib/bib-format-samples";

export const dynamic = "force-static";

const PATH = "/tools/bibtex-to-chicago";
const DESCRIPTION =
  "Format a .bib file in Chicago 18th edition, author-date or notes and bibliography, and paste the list into Word with italics and hanging indent. Free.";

export const metadata: Metadata = {
  title: "BibTeX to Chicago Converter: Author-Date and Notes",
  description: DESCRIPTION,
  keywords: [
    "bibtex to chicago", "bibtex to chicago style", "bib to chicago", "chicago author-date bibtex",
    "chicago notes bibliography from bibtex", "latex bibliography to chicago",
  ],
  alternates: { canonical: PATH },
  openGraph: {
    title: "BibTeX to Chicago Converter | latexci",
    description: "Paste a .bib file, copy a Chicago 18th edition reference list or bibliography into Word.",
    url: PATH, type: "website",
  },
  twitter: { card: "summary_large_image", title: "BibTeX to Chicago Converter | latexci" },
};

const FAQS = [
  {
    q: "Author-date or notes and bibliography?",
    a: "Use the system your publisher or department names. Author-date, common in the sciences, cites (Knuth 1984, 97) in the text and ends with a reference list. Notes and bibliography, common in the humanities, cites in footnotes and ends with a bibliography. Both are in the style selector.",
  },
  {
    q: "Which edition of the Chicago Manual of Style?",
    a: "The 18th edition, through the two Chicago style files of the Citation Style Language project: chicago-author-date.csl and chicago-notes-bibliography.csl.",
  },
  {
    q: "Does it give me the footnotes?",
    a: "In notes and bibliography, the table under the list shows, for each entry, the first full note and the shortened note used for later citations of the same work. Copy them into your footnotes.",
  },
  {
    q: "Do I need title case in my .bib file?",
    a: "No. Chicago uses headline-style capitalization, and the style applies it. Words in braces are printed as typed.",
  },
  {
    q: "Is my .bib file uploaded anywhere?",
    a: "No. The formatting runs in your browser and nothing you paste is sent to a server.",
  },
];

export default async function BibtexToChicagoPage() {
  const f = nodeFormatter();
  const [authorDate, notes] = await Promise.all([f.format(SAMPLE_BIB, "chicago"), f.format(SAMPLE_BIB, "chicago-notes")]);
  const ad = (key: string) => authorDate.citations.find((c) => c.id === key)?.forms ?? [];
  const nb = (key: string) => notes.citations.find((c) => c.id === key)?.forms ?? [];
  const bibEntry = (key: string) => notes.entries.find((e) => e.id === key)?.html ?? "";

  return (
    <BibFormatPage
      style="chicago"
      path={PATH}
      name="BibTeX to Chicago"
      heading="BibTeX to Chicago Converter"
      tagline="Paste or upload a .bib file and get a Chicago 18th edition reference list, author-date or notes and bibliography, ready to paste into Word or Google Docs. No account."
      description={DESCRIPTION}
      faqs={FAQS}
    >
      <h2><span className="secnum">1</span>Two Chicago systems, one .bib file</h2>
      <p>
        The Chicago Manual of Style has two ways of citing. In the author-date system the text
        carries the surname, the year and the page, and the paper ends with a reference list in
        which the year follows the author. In the notes and bibliography system the text carries a
        footnote number, the note gives the reference, and the paper ends with a bibliography in
        which the year comes near the end. The converter opens in author-date; pick{" "}
        <i>Chicago 18th, notes and bibliography</i> in the selector for the other.
      </p>
      <p>
        Either way the list is sorted by the surname of the first author, titles are set in
        headline style, and article titles go in quotation marks. Table 1 shows the sample file in
        author-date.
      </p>
      <BibFormatExamples style="chicago" table={1} />

      <h2><span className="secnum">2</span>Citing in the text: author-date</h2>
      <p>
        An author-date citation puts the surname and the year in parentheses, with no comma
        between them, and the page after a comma. Table 2 shows the forms the tool gives.
      </p>
      <div className="bib-table">
        <table className="booktabs">
          <thead><tr><th scope="col">Reference</th><th scope="col">Form</th><th scope="col">Citation</th></tr></thead>
          <tbody>
            {[["knuth1984", "Knuth (one author)"], ["bedenel2019", "Bedenel et al. (three authors)"]].flatMap(([key, label]) =>
              ad(key).map((form, k) => (
                <tr key={`${key}-${k}`}>
                  {k === 0 && <td rowSpan={ad(key).length}>{label}</td>}
                  <td>{form.label}</td>
                  <td dangerouslySetInnerHTML={{ __html: form.html }} />
                </tr>
              )),
            )}
          </tbody>
        </table>
      </div>
      <p className="caption"><b>Table 2.</b> Author-date citations for two entries of the sample file.</p>

      <h2><span className="secnum">3</span>Footnotes: notes and bibliography</h2>
      <p>
        In notes and bibliography, the first note on a work gives the full reference, with the
        author&rsquo;s name in normal order; later notes on the same work are shortened to the
        surname and a short title. The bibliography repeats the reference with the surname first.
        Table 3 sets the three forms side by side for Knuth&rsquo;s article.
      </p>
      <div className="bib-table">
        <table className="booktabs">
          <thead><tr><th scope="col">Form</th><th scope="col">Chicago 18th, notes and bibliography</th></tr></thead>
          <tbody>
            {nb("knuth1984").map((form) => (
              <tr key={form.label}>
                <td style={{ whiteSpace: "nowrap" }}>{form.label}</td>
                <td dangerouslySetInnerHTML={{ __html: form.html }} />
              </tr>
            ))}
            <tr>
              <td>Bibliography</td>
              <td dangerouslySetInnerHTML={{ __html: bibEntry("knuth1984") }} />
            </tr>
          </tbody>
        </table>
      </div>
      <p className="caption"><b>Table 3.</b> The note forms and the bibliography entry of one article, with page 97 cited.</p>

      <h2><span className="secnum">4</span>Before you hand it in</h2>
      <ol className="checklist">
        <li>
          Read the notes under the list: the tool names entries without a year, a publisher, a
          journal or a book title.
        </li>
        <li>
          Proper nouns and acronyms that must keep their case belong in braces in the{" "}
          <code>.bib</code> file.
        </li>
        <li>
          Footnote numbers are your word processor&rsquo;s job: paste each note into a footnote.
        </li>
      </ol>
      <p>
        Missing an entry? Look it up by <Link href="/tools/doi-to-bibtex">DOI</Link>,{" "}
        <Link href="/tools/arxiv-to-bibtex">arXiv ID</Link> or <Link href="/tools/isbn-to-bibtex">ISBN</Link>,
        then paste it here.
      </p>
    </BibFormatPage>
  );
}
