import type { Metadata } from "next";
import Link from "@/components/Link";
import BibFormatPage from "@/components/BibFormatPage";
import { nodeFormatter } from "@/lib/bib-format-node";
import { SAMPLE_ENTRIES } from "@/lib/bib-format-samples";

export const dynamic = "force-static";

const PATH = "/tools/doi-to-apa";
const DESCRIPTION =
  "Turn a DOI into an APA 7th edition reference in one step and paste it into Word with italics and hanging indent. Also takes arXiv IDs and ISBNs. Free.";

export const metadata: Metadata = {
  title: "DOI to APA Citation Generator: APA 7 Reference from a DOI",
  description: DESCRIPTION,
  keywords: [
    "doi to apa", "doi to apa citation", "apa citation from doi", "doi to apa 7",
    "convert doi to apa reference", "doi citation generator apa",
  ],
  alternates: { canonical: PATH },
  openGraph: {
    title: "DOI to APA Citation Generator | latexci",
    description: "Enter a DOI, copy an APA 7th edition reference into Word or Google Docs.",
    url: PATH, type: "website",
  },
  twitter: { card: "summary_large_image", title: "DOI to APA Citation Generator | latexci" },
};

const FAQS = [
  {
    q: "Where does the information come from?",
    a: "From CrossRef, the registry of most journal and book DOIs. The page asks CrossRef for the BibTeX entry of the DOI, then formats it with the official APA 7th edition style of the Citation Style Language project.",
  },
  {
    q: "Can I add several DOIs?",
    a: "Yes. Each DOI you add is appended to the list on the left, and the reference list on the right is sorted the APA way, by the surname of the first author, then by year.",
  },
  {
    q: "Why are some titles in lower case?",
    a: "APA writes the titles of articles and books in sentence case: only the first word, the first word after a colon and proper nouns take a capital. Registry titles often lose the capitals of proper nouns; fix them in the entry on the left by putting the word in braces, {Bayesian}.",
  },
  {
    q: "Does it work with arXiv preprints and books?",
    a: "Yes. The same field takes an arXiv ID (2106.09685), an ISBN or a PubMed ID. The style changes to MLA, Chicago, IEEE or Harvard from the selector.",
  },
  {
    q: "Is anything stored?",
    a: "The identifier is sent to the lookup service of this site, which asks CrossRef, arXiv, Open Library or PubMed and keeps nothing. The formatting runs in your browser.",
  },
];

export default async function DoiToApaPage() {
  const knuth = SAMPLE_ENTRIES.find((e) => e.bib.includes("knuth1984"))?.bib ?? "";
  const apa = await nodeFormatter().format(knuth, "apa");

  return (
    <BibFormatPage
      style="apa"
      path={PATH}
      name="DOI to APA"
      heading="DOI to APA Citation Generator"
      tagline="Enter a DOI and get its APA 7th edition reference, ready to paste into Word or Google Docs with italics and hanging indent. Add as many as you need. No account."
      description={DESCRIPTION}
      faqs={FAQS}
      sample=""
      lookupFirst
    >
      <h2><span className="secnum">1</span>From a DOI to an APA reference</h2>
      <p>
        A DOI (digital object identifier) names an article, a chapter or a book for good:{" "}
        <code>10.1093/comjnl/27.2.97</code> is Knuth&rsquo;s paper on literate programming. The
        generator asks CrossRef for the record of the DOI, writes it as a BibTeX entry in the left
        pane, and formats the entry in APA 7th edition on the right. The entry stays editable: a
        wrong capital or a missing issue number is fixed there, and the reference follows.
      </p>
      <figure>
        <div className="figure bib-stack">
          <div>
            <span className="bib-figlabel">BibTeX entry</span>
            <pre>{knuth}</pre>
          </div>
          <div>
            <span className="bib-figlabel">APA 7th edition</span>
            <p className="fmt-ref" dangerouslySetInnerHTML={{ __html: apa.entries[0]?.html ?? "" }} />
          </div>
        </div>
        <figcaption className="caption">
          <b>Figure 2.</b> An article with a DOI and its APA reference. The DOI is printed as a link,
          https://doi.org/&hellip;, as APA 7 asks. A lookup may return more fields than this entry.
        </figcaption>
      </figure>

      <h2><span className="secnum">2</span>What to check in a generated reference</h2>
      <ol className="checklist">
        <li>
          Capitals of proper nouns in the title: registries often store titles in title case or in
          capitals, and the APA conversion to sentence case cannot know which words are names.
        </li>
        <li>
          Author names: CrossRef sometimes gives a full first name, sometimes only initials. APA
          prints initials either way.
        </li>
        <li>
          The issue number and the page range of an article: when CrossRef lacks them, the notes
          under the list say so.
        </li>
      </ol>
      <p>
        Need the BibTeX entry itself, for a LaTeX paper? Use <Link href="/tools/doi-to-bibtex">DOI to BibTeX</Link>.
        Already have a .bib file? Paste it into <Link href="/tools/bibtex-to-apa">BibTeX to APA</Link>.
      </p>
    </BibFormatPage>
  );
}
