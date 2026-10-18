import type { Metadata } from "next";
import Link from "@/components/Link";
import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";
import { breadcrumbSchema } from "@/lib/breadcrumbs";
import { XFig, XRow, XCell, Verbatim, PageImage, type PngSize } from "@/components/ExtractFigure";
import orcid from "@/lib/seo-cv/orcid-results.json";

// Every record, field list, LaTeX source and rendered list on this page comes
// from lib/seo-cv/orcid-results.json, written by
// `node scripts/seo-cv/run-orcid.mjs` (ORCID public API, doi.org, YToTech).

export const metadata: Metadata = {
  title: "ORCID to LaTeX CV: Build Your Publication List",
  description:
    "Turn an ORCID record into a LaTeX publication list: what the public API returns, what it leaves out, grouping by year or type, and a biblatex route.",
  keywords: [
    "orcid to latex", "orcid latex cv", "orcid publication list latex", "orcid bibtex export",
    "orcid api works", "latex cv publications", "biblatex cv publications",
  ],
  alternates: { canonical: "/orcid-to-latex-cv" },
  openGraph: {
    title: "ORCID to a LaTeX Publication List | latexci",
    description: "A worked example on ORCID's test record: the API, its limits, plain LaTeX and biblatex.",
    url: "/orcid-to-latex-cv",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "ORCID to LaTeX CV: Build Your Publication List",
    description: "A worked example on ORCID's test record: the API, its limits, plain LaTeX and biblatex.",
  },
};

type Row = { putCode: number; type: string; year: string; title: string; journal: string; doi: string; source: string; sources: number };
type FullRow = { putCode: number; contributors: string[]; citationType: string; citationKey: string };
type Doc = { source: string; shown: string; text: string; png: string; size: PngSize; bib?: string };

const S = orcid.summary as unknown as {
  groups: number; summaries: number; summaryKeys: string[]; fullKeys: string[];
  rows: Row[]; fullRows: FullRow[]; duplicateKeys: string[]; firstSummary: Record<string, unknown>;
};
const PLAIN = orcid["orcid-plain"] as Doc;
const BIBL = orcid["orcid-biblatex"] as Doc;
const DOI = orcid.doi;
const ID = orcid.meta.orcid;

const ONLY_FULL = S.fullKeys.filter((k) => !S.summaryKeys.includes(k));
const WITH_CONTRIB = S.fullRows.filter((f) => f.contributors.length > 0).length;
const WITH_BIBTEX = S.fullRows.filter((f) => f.citationType === "bibtex").length;
const NO_JOURNAL = S.rows.filter((r) => !r.journal).length;
const MULTI_SOURCE = S.rows.filter((r) => r.sources > 1).length;
const WITH_DOI = S.rows.filter((r) => r.doi).length;
const TYPES = [...new Set(S.rows.map((r) => r.type))];

// One summary, cut down to the fields a CV needs (values untouched).
const fs = S.firstSummary as Record<string, unknown> & {
  title: unknown; type: unknown; "publication-date": { year: unknown }; "journal-title": unknown;
  "external-ids": { "external-id": { "external-id-type": string; "external-id-value": string }[] };
};
const SUBTITLE = ((fs.title as { subtitle?: { value?: string } }).subtitle?.value) ?? "";
const SUMMARY_EXCERPT = JSON.stringify({
  "put-code": fs["put-code"],
  title: fs.title,
  type: fs.type,
  "publication-date": { year: fs["publication-date"].year },
  "journal-title": fs["journal-title"],
  "external-ids": { "external-id": fs["external-ids"]["external-id"].map((x) => ({ "external-id-type": x["external-id-type"], "external-id-value": x["external-id-value"] })) },
}, null, 2);

const BIB_EXCERPT = (BIBL.bib ?? "").split("\n\n").slice(-2).join("\n\n").replace(/,\s*(?=[a-zA-Z]+\s*=)/g, ",\n  ").trim();
const API_CALLS = `GET https://pub.orcid.org/v3.0/${ID}/works
Accept: application/json

GET https://pub.orcid.org/v3.0/${ID}/works/${S.rows.slice(0, 3).map((r) => r.putCode).join(",")}
Accept: application/json`;
const doiYear = (b: string) => b.match(/year\s*=\s*\{?(\d{4})/)?.[1] ?? "";
const doiTitle = (b: string) => b.match(/title\s*=\s*\{([^}]*)\}/)?.[1] ?? "";

const codeStyle = { fontFamily: "var(--font-tt)", fontSize: "0.92em" } as const;

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "TechArticle",
  headline: "From an ORCID record to a LaTeX publication list",
  inLanguage: "en",
  datePublished: "2026-10-18",
  dateModified: "2026-10-18",
  author: { "@type": "Organization", name: "latexci", url: "https://latexci.com" },
  mainEntityOfPage: "https://latexci.com/orcid-to-latex-cv",
};

export default function OrcidToLatexCvPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema({ name: "ORCID to LaTeX CV", path: "/orcid-to-latex-cv" })) }} />
      <Navbar />

      <main className="paper" style={{ flex: 1, width: "100%", boxSizing: "border-box", paddingBottom: "3rem" }}>
        <header className="titleblock">
          <h1>From an ORCID record to a LaTeX publication list</h1>
          <p className="subtitle">A worked example on ORCID&rsquo;s test record</p>
          <p className="authors">latexci.com &middot; API read on {orcid.meta.ranOn}</p>
        </header>

        <section className="abstract" aria-label="Abstract">
          <p className="abstract-title">Abstract</p>
          <p>
            ORCID keeps the list of your works, and its public API returns it as JSON. That list is a good
            start for the publications section of an academic CV, but it is not a finished bibliography: the
            summaries carry no co-authors, the venue is often empty, and the same work can arrive from several
            sources. We read the record of Josiah Carberry ({ID}), the fictitious researcher used in ORCID&rsquo;s
            own documentation, and turned it into a LaTeX list two ways: plain LaTeX grouped by year, and
            biblatex fed with the BibTeX stored in ORCID.
          </p>
        </section>

        <h2><span className="secnum">1</span>What the public API returns</h2>
        <p>
          Two read calls are enough (Figure 1). The first returns every work as a <i>summary</i>, grouped when
          several sources describe the same work. The second, given up to 100 put-codes, returns the full
          works. Both answered our requests without any token.
        </p>
        <figure style={{ margin: "1.5rem 0 0" }}>
          <XFig><XRow><XCell label="HTTP"><Verbatim text={API_CALLS} /></XCell></XRow></XFig>
          <figcaption className="caption"><b>Figure 1.</b> The list of works, then the full works for three put-codes.</figcaption>
        </figure>
        <p>
          For this record the first call returned {S.groups} groups holding {S.summaries} summaries:{" "}
          {MULTI_SOURCE} work came from two sources. Table 1 lists the first summary of each group, the one
          a simple import keeps.
        </p>
        <div style={{ overflowX: "auto", margin: "1.25rem 0 0" }}>
          <table className="booktabs">
            <thead><tr><th>Year</th><th>Title</th><th className="hide-sm">journal-title</th><th className="hide-sm">Source</th></tr></thead>
            <tbody>
              {S.rows.map((r) => (
                <tr key={r.putCode}>
                  <td>{r.year}</td>
                  <td>{r.title}</td>
                  <td className="hide-sm">{r.journal || <span style={{ color: "var(--fg-muted)" }}>empty</span>}</td>
                  <td className="muted hide-sm">{r.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="caption"><b>Table 1.</b> The works of {ID}, as summaries. {WITH_DOI} of {S.rows.length} have a DOI; {NO_JOURNAL} have no journal title.</p>

        <figure style={{ margin: "1.75rem 0 0" }}>
          <XFig>
            <XRow><XCell label="One summary (fields a CV needs)"><Verbatim text={SUMMARY_EXCERPT} /></XCell></XRow>
            <XRow><XCell label="Fields only in the full work"><Verbatim text={ONLY_FULL.join(", ")} wrap /></XCell></XRow>
          </XFig>
          <figcaption className="caption"><b>Figure 2.</b> A work summary, cut to the useful fields, and the fields that only the full work has. Authors are in <code style={codeStyle}>contributors</code>.</figcaption>
        </figure>

        <h2><span className="secnum">2</span>Limits to know before you import</h2>
        <ol className="checklist">
          <li>
            <b>No co-authors in summaries.</b> The summary has no <code>contributors</code> field at all. The
            full works do, but on this record {WITH_CONTRIB} of {S.fullRows.length} listed any contributor.
            Expect to type author lists yourself.
          </li>
          <li>
            <b>Venue often missing.</b> {NO_JOURNAL} of {S.rows.length} summaries had an empty{" "}
            <code>journal-title</code>, although the journal appears in the full work&rsquo;s BibTeX. In the
            summary of Figure 2 the journal name sits in <code>title.subtitle</code> instead: &ldquo;{SUBTITLE}&rdquo;.
          </li>
          <li>
            <b>One work, several sources.</b> A group can hold the same work from a publisher, a database and
            the researcher. Keep one per group, or you list the paper twice.
          </li>
          <li>
            <b>Stored BibTeX is a snapshot.</b> {WITH_BIBTEX} of {S.fullRows.length} full works carried a{" "}
            <code>citation</code> in BibTeX. For DOI {DOI.doi}, ORCID&rsquo;s copy says {doiYear(DOI.orcidCopy)};
            the DOI resolver, asked for BibTeX the same day, said {doiYear(DOI.bibtex)}{" "}with the title
            &ldquo;{doiTitle(DOI.bibtex)}&rdquo; (Figure 3).
          </li>
          <li>
            <b>Citation keys clash.</b> The stored entries reuse keys:{" "}
            {S.duplicateKeys.map((k, i) => <span key={k}>{i > 0 && ", "}<code>{k}</code></span>)} appear twice.
            Re-key before you feed them to BibTeX or biber.
          </li>
        </ol>
        <figure style={{ margin: "1.5rem 0 0" }}>
          <XFig>
            <XRow><XCell label="Stored in ORCID"><Verbatim text={DOI.orcidCopy.replace(/,\s*(?=[a-zA-Z]+\s*=)/g, ",\n  ")} /></XCell></XRow>
            <XRow><XCell label={<>From <code>doi.org</code>, <code>Accept: application/x-bibtex</code></>}><Verbatim text={DOI.bibtex.replace(/,\s*(?=[a-zA-Z]+\s*=)/g, ",\n  ")} /></XCell></XRow>
          </XFig>
          <figcaption className="caption"><b>Figure 3.</b> The same DOI, two answers. The DOI metadata was edited after ORCID stored its copy.</figcaption>
        </figure>
        <p>
          When you need current metadata, resolve the DOIs again: the{" "}
          <Link href="/tools/doi-to-bibtex">DOI to BibTeX tool</Link> does it for a list of DOIs.
        </p>

        <h2><span className="secnum">3</span>Plain LaTeX, grouped by year</h2>
        <p>
          The simplest list needs no bibliography software. Sort the summaries newest first, open one{" "}
          <code style={codeStyle}>enumerate</code> per year and link each DOI (Figure 4). It uses only what the
          summaries hold, so the authors are missing until you add them.
        </p>
        <figure style={{ margin: "1.5rem 0 0" }}>
          <XFig>
            <XRow><XCell label="Source (body)"><Verbatim text={PLAIN.shown} wrap /></XCell></XRow>
            <PageImage src={PLAIN.png} size={PLAIN.size} alt="Publication list grouped by year, compiled from the ORCID summaries" />
          </XFig>
          <figcaption className="caption"><b>Figure 4.</b> The list generated from the summaries of Table 1, compiled. The preamble adds <code style={codeStyle}>enumitem</code>, <code style={codeStyle}>xurl</code> and <code style={codeStyle}>hyperref</code>.</figcaption>
        </figure>
        <p>
          To group by type instead, use the <code style={codeStyle}>type</code> field: ORCID calls journal
          papers <code style={codeStyle}>journal-article</code>, conference papers{" "}
          <code style={codeStyle}>conference-paper</code> and preprints <code style={codeStyle}>preprint</code>.
          On this record every work is {TYPES.map((t) => <code key={t} style={codeStyle}>{t}</code>)}, so a
          grouping by type gives a single group, which is why Figure 4 groups by year.
        </p>

        <h2><span className="secnum">4</span>The biblatex route</h2>
        <p>
          If you already manage references with biblatex, take the BibTeX that ORCID stores with each full
          work, give each entry a unique key (here <code style={codeStyle}>orcid</code> plus the put-code) and
          print the list with <code style={codeStyle}>sorting=ydnt</code>, newest first (Figure 5). Splitting
          by type is one <code style={codeStyle}>\printbibliography[type=...]</code> per section.
        </p>
        <figure style={{ margin: "1.5rem 0 0" }}>
          <XFig>
            <XRow><XCell label="Preamble and body"><Verbatim text={BIBL.shown} /></XCell></XRow>
            <XRow><XCell label={<><code>orcid.bib</code>, last two entries</>}><Verbatim text={BIB_EXCERPT} /></XCell></XRow>
            <PageImage src={BIBL.png} size={BIBL.size} alt="biblatex publication list built from the BibTeX stored in ORCID" />
          </XFig>
          <figcaption className="caption"><b>Figure 5.</b> biblatex with biber on the stored BibTeX, compiled. The 1987 entry spells the name differently from the five others.</figcaption>
        </figure>
        <p>
          Figure 5 also shows the cost of importing without review: five entries name the author
          &ldquo;Carberry, Josiah&rdquo;, the sixth &ldquo;Carberry, J.S.&rdquo;. To biblatex these are two
          different people, which breaks anything that matches names, such as setting your own name in bold.
          Normalise your name across entries before you print.
        </p>

        <h2><span className="secnum">5</span>With the latexci CV builder</h2>
        <p>
          The <Link href="/tools/cv-builder">CV builder</Link> does the first route for you. Type your ORCID iD
          and press the import button: only the iD is sent, through a latexci endpoint, to{" "}
          <code style={codeStyle}>pub.orcid.org</code>. For up to 100 works it keeps the first summary of each
          group and fills the title, journal, year, DOI and type (journal article, conference paper or
          preprint), newest first, and skips titles already in your list. Co-authors are left for you to add,
          for the reason in Section 2; the builder then sets your own name in bold in every author list.
        </p>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "1rem" }}>
          <Link href="/tools/cv-builder" className="btn btn-primary">Import from ORCID in the builder</Link>
          <Link href="/tools/templates/cv" className="btn">Academic CV template</Link>
        </div>
        <p style={{ marginTop: "1.25rem", textIndent: 0 }}>
          Applying outside academia too? Read <Link href="/latex-resume-ats">whether a LaTeX resume is
          ATS-friendly</Link>, or, in French, <Link href="/cv-latex" hrefLang="fr"><span lang="fr">Modèle de CV
          LaTeX gratuit</span></Link>.
        </p>
      </main>

      <SiteFooter />
    </div>
  );
}
