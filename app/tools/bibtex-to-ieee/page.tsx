import type { Metadata } from "next";
import Link from "@/components/Link";
import BibFormatPage from "@/components/BibFormatPage";
import BibFormatExamples from "@/components/BibFormatExamples";
import { nodeFormatter } from "@/lib/bib-format-node";
import { SAMPLE_BIB } from "@/lib/bib-format-samples";

export const dynamic = "force-static";

const PATH = "/tools/bibtex-to-ieee";
const DESCRIPTION =
  "Convert a .bib file into a numbered IEEE reference list and paste it into Word with italics and the [1] labels. Free, in your browser, no account.";

export const metadata: Metadata = {
  title: "BibTeX to IEEE Converter: Numbered References for Word",
  description: DESCRIPTION,
  keywords: [
    "bibtex to ieee", "bibtex to ieee converter", "bib to ieee", "ieee reference list from bibtex",
    "convert bibtex to ieee format", "ieee citation from bibtex",
  ],
  alternates: { canonical: PATH },
  openGraph: {
    title: "BibTeX to IEEE Converter | latexci",
    description: "Paste a .bib file, copy a numbered IEEE reference list into Word or Google Docs.",
    url: PATH, type: "website",
  },
  twitter: { card: "summary_large_image", title: "BibTeX to IEEE Converter | latexci" },
};

const FAQS = [
  {
    q: "Which version of the IEEE style does it follow?",
    a: "The IEEE Reference Guide of November 2023, through ieee.csl, the style file of the Citation Style Language project, unmodified.",
  },
  {
    q: "In what order are the references numbered?",
    a: "IEEE numbers sources in the order you first cite them. The tool cannot read your document, so it numbers the entries in the order of your .bib file. Put them in citation order before you paste, or renumber after.",
  },
  {
    q: "What happens with more than six authors?",
    a: "The style prints the first author followed by et al., as the IEEE guide asks for long author lists. Up to six authors, every name is printed, initials first.",
  },
  {
    q: "Should journal names be abbreviated?",
    a: "IEEE prefers the abbreviated journal name (IEEE Trans. Softw. Eng.). The style prints the journal field as it is in your file: write the abbreviation there, or in the journal field of the entry you paste.",
  },
  {
    q: "Is my .bib file uploaded anywhere?",
    a: "No. Everything runs in your browser. The page downloads the style file once; your references never leave your computer.",
  },
];

const MANY = String.raw`@article{alpha2020,
  author  = {Alpha, Ann and Beta, Bob and Gamma, Cy and Delta, Di
             and Epsilon, Ed and Zeta, Zoe and Eta, Eva},
  title   = {Seven Authors on One Paper},
  journal = {IEEE Trans. Softw. Eng.},
  year    = {2020},
  volume  = {46},
  number  = {3},
  pages   = {250--262}
}`;

export default async function BibtexToIeeePage() {
  const f = nodeFormatter();
  const [many, sample] = await Promise.all([f.format(MANY, "ieee"), f.format(SAMPLE_BIB, "ieee")]);
  const cite = (key: string) => sample.citations.find((c) => c.id === key)?.forms ?? [];

  return (
    <BibFormatPage
      style="ieee"
      path={PATH}
      name="BibTeX to IEEE"
      heading="BibTeX to IEEE Converter"
      tagline="Paste or upload a .bib file and get a numbered IEEE reference list, ready to paste into Word or Google Docs with italics and the [1] labels. No account."
      description={DESCRIPTION}
      faqs={FAQS}
    >
      <h2><span className="secnum">1</span>A numbered reference list from BibTeX</h2>
      <p>
        IEEE is the style of most engineering and computer science venues. Each source gets a number
        in square brackets, and the text cites the number instead of the author: <i>as shown in
        [3]</i>. In the list, names are written with the initials first, titles of articles and
        chapters go in quotation marks, and the name of the journal or book in italics, followed by
        the volume, number, pages and year.
      </p>
      <p>
        The converter maps each BibTeX field to the matching element and lets citeproc-js, with the
        official IEEE style, write the entry. Titles are printed with the capitals of your file.
        Table 1 shows one entry of each type from the sample file.
      </p>
      <BibFormatExamples style="ieee" table={1} />

      <h2><span className="secnum">2</span>Long author lists</h2>
      <p>
        When a paper has more than six authors, IEEE keeps only the first one and adds{" "}
        <i>et al.</i> Figure 2 shows an entry with seven authors and a journal name written in its
        IEEE abbreviation.
      </p>
      <figure>
        <div className="figure bib-stack">
          <div>
            <span className="bib-figlabel">BibTeX</span>
            <pre>{MANY}</pre>
          </div>
          <div>
            <span className="bib-figlabel">IEEE</span>
            <p className="fmt-ref" dangerouslySetInnerHTML={{ __html: `${many.entries[0]?.label ?? ""} ${many.entries[0]?.html ?? ""}` }} />
          </div>
        </div>
        <figcaption className="caption">
          <b>Figure 2.</b> Seven authors: the first one, then <i>et al.</i> The page range is
          printed with <i>pp.</i> and an en dash.
        </figcaption>
      </figure>

      <h2><span className="secnum">3</span>In-text citations</h2>
      <p>
        The text cites the number in square brackets. A page is added after a comma when you quote or
        point to a passage. Table 2 shows the forms the tool gives for two entries of the sample file.
      </p>
      <div className="bib-table">
        <table className="booktabs">
          <thead><tr><th scope="col">Reference</th><th scope="col">Form</th><th scope="col">Citation</th></tr></thead>
          <tbody>
            {[["knuth1984", "Knuth, an article"], ["dillard2020", "Dillard, a chapter"]].flatMap(([key, label]) =>
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
        <li>Put the entries of your .bib file in the order you cite them: that order gives the numbers.</li>
        <li>Write journal names in their IEEE abbreviation in the <code>journal</code> field if your venue asks for it.</li>
        <li>
          Read the notes under the list: the tool names each entry that lacks a field the style prints,
          such as the pages of an article.
        </li>
      </ol>
      <p>
        Writing the paper itself in LaTeX? Keep the .bib file and use <code>\bibliographystyle{"{IEEEtran}"}</code>;
        this page is for the times a Word copy is required. Entries can be built from a{" "}
        <Link href="/tools/doi-to-bibtex">DOI</Link> or an <Link href="/tools/arxiv-to-bibtex">arXiv ID</Link> first.
      </p>
    </BibFormatPage>
  );
}
