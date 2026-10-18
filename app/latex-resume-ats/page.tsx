import type { Metadata } from "next";
import Link from "@/components/Link";
import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";
import { breadcrumbSchema } from "@/lib/breadcrumbs";
import { XFig, XRow, XCell, Verbatim, PageImage, type PngSize } from "@/components/ExtractFigure";
import ats from "@/lib/seo-cv/ats-results.json";

// Every LaTeX source, extracted text and number on this page comes from
// lib/seo-cv/ats-results.json, written by `node scripts/seo-cv/run-ats.mjs`
// (YToTech compile, poppler pdftotext, pypdf). Rerun it, never edit by hand.

export const metadata: Metadata = {
  title: "Is a LaTeX Resume ATS-Friendly? Text Extraction Tests",
  description:
    "We compiled 15 LaTeX resume test PDFs and read them with pdftotext and pypdf: what breaks accents, columns, icons and dates, plus a checklist that works.",
  keywords: [
    "latex resume ats", "ats friendly latex resume", "is latex resume ats friendly", "latex cv ats",
    "glyphtounicode", "pdfgentounicode", "two column resume ats", "fontawesome resume ats",
  ],
  alternates: { canonical: "/latex-resume-ats" },
  openGraph: {
    title: "Is a LaTeX Resume ATS-Friendly? | latexci",
    description: "15 test PDFs, two text extractors, real output: what survives extraction and what does not.",
    url: "/latex-resume-ats",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "Is a LaTeX Resume ATS-Friendly? Text Extraction Tests",
    description: "15 test PDFs, two text extractors, real output: what survives extraction and what does not.",
  },
};

type Res = {
  source: string; shown: string; text: string; layout: string; pypdf: string;
  fonts: { name: string; toUnicode: boolean }[]; png?: string; size?: PngSize; info?: string;
};
const R = ats.results as unknown as Record<string, Res>;
const META = ats.meta;

const TEST_IDS = [
  "lig-ot1", "lig-ot1-g2u", "lig-t1", "lig-t1-g2u",
  "cols-minipage", "cols-paracol", "cols-single", "cols-single-iws",
  "icons-fa", "icons-plain",
  "dates-tabular", "dates-tabular-iws", "dates-minipage", "dates-hfill", "dates-inline",
];
const ENGINE = META.engine.match(/pdfTeX, Version [\d.-]+-([\d.]+) \((TeX Live \d+)\)/);
const PDFTEX = ENGINE ? `pdfTeX ${ENGINE[1]}, ${ENGINE[2]}` : "pdfTeX";
const LATEX = META.engine.match(/LaTeX (\d{4}-\d{2}-\d{2})/)?.[1] ?? "";
const G2U_DEFAULT = META.engine.match(/pdfgentounicode=(\d)/)?.[1] ?? "";

const firstLine = (s: string) => s.split("\n")[0];
/** How the u-umlaut of "Muller" reached the text layer. */
function umlaut(s: string): string {
  if (s.includes("u\u0308")) return "u + U+0308";
  if (s.includes("\u00a8")) return "U+00A8 + space";
  if (s.includes("\u00fc")) return "U+00FC";
  return "missing";
}
const ligaturesOk = (s: string) => ["efficiency", "financial", "affine"].every((w) => s.includes(w));
const toUni = (r: Res) => `${r.fonts.filter((f) => f.toUnicode).length} of ${r.fonts.length}`;

/** Is each date on its job's title line, or alone on the line next to it? */
const JOBS: [string, string][] = [["Data Engineer", "2021\u20132024"], ["Data Analyst", "2019\u20132021"]];
function dateVerdict(text: string): string {
  const lines = text.split("\n").filter((l) => l.trim());
  const kept = JOBS.every(([title, date]) => {
    const i = lines.findIndex((l) => l.includes(title));
    const j = lines.findIndex((l) => l.includes(date));
    return i >= 0 && j >= 0 && (i === j || (Math.abs(i - j) === 1 && lines[j].trim() === date));
  });
  if (!kept) return "separated";
  return /\d[A-Z]/.test(text) ? "kept, glued to the title" : "kept";
}

const LIG_ROWS = [
  { id: "lig-ot1", enc: "OT1", g2u: "no" },
  { id: "lig-ot1-g2u", enc: "OT1", g2u: "yes" },
  { id: "lig-t1", enc: "T1", g2u: "no" },
  { id: "lig-t1-g2u", enc: "T1", g2u: "yes" },
];
const DATE_ROWS = [
  { id: "dates-tabular", name: <>Date column, <code>tabular</code></> },
  { id: "dates-tabular-iws", name: <>Same, with <code>\pdfinterwordspaceon</code></> },
  { id: "dates-minipage", name: <>Date column, two <code>minipage</code></> },
  { id: "dates-hfill", name: <>Title line, date pushed right with <code>\hfill</code></> },
  { id: "dates-inline", name: <>Title line, date after a comma</> },
];

const sameAll = (a: Res, b: Res) => a.text === b.text && a.layout === b.layout && a.pypdf === b.pypdf;
const PARACOL_SAME = sameAll(R["cols-minipage"], R["cols-paracol"]);
const SINGLE_MODES_SAME = R["cols-single"].text === R["cols-single"].layout;
const BUILDER_HEAD = R["builder-industry"].text.split("\n").slice(0, 23).join("\n");
const BUILDER_PYPDF_LINE = R["builder-industry"].pypdf.split("\n").find((l) => l.includes("Oct. 2023")) ?? "";
const BUILDER_ACAD_PYPDF_LINE = R["builder-academic"].pypdf.split("\n").find((l) => l.includes("Oct. 2019")) ?? "";
const CHECK_CMD = "pdftotext cv.pdf -          # reading order\npdftotext -layout cv.pdf -  # physical layout";

const codeStyle = { fontFamily: "var(--font-tt)", fontSize: "0.92em" } as const;

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "TechArticle",
  headline: "Is a LaTeX resume ATS-friendly? What a text extractor sees",
  inLanguage: "en",
  datePublished: "2026-10-18",
  dateModified: "2026-10-18",
  author: { "@type": "Organization", name: "latexci", url: "https://latexci.com" },
  mainEntityOfPage: "https://latexci.com/latex-resume-ats",
};

export default function LatexResumeAtsPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema({ name: "LaTeX resume and ATS", path: "/latex-resume-ats" })) }} />
      <Navbar />

      <main className="paper" style={{ flex: 1, width: "100%", boxSizing: "border-box", paddingBottom: "3rem" }}>
        <header className="titleblock">
          <h1>Is a LaTeX resume ATS&#8209;friendly?</h1>
          <p className="subtitle">What a text extractor reads from {TEST_IDS.length} test PDFs</p>
          <p className="authors">latexci.com &middot; experiments run on {META.ranOn}</p>
        </header>

        <section className="abstract" aria-label="Abstract">
          <p className="abstract-title">Abstract</p>
          <p>
            An applicant tracking system can only parse the text it gets out of your PDF. We did not test any
            commercial ATS. We compiled {TEST_IDS.length} small resume documents with pdfLaTeX, each pair
            differing in one detail, and read them with two open-source extractors. A LaTeX resume extracts
            cleanly when it uses the T1 font encoding, a single column, plain-text labels and dates written on
            the title line. Accents in the default encoding, icon fonts and dates set in their own column
            produced broken or misplaced text in at least one extractor.
          </p>
        </section>

        <h2><span className="secnum">1</span>Method</h2>
        <p>
          Every document was compiled by the YToTech service, the one latexci uses for PDF export, then read
          by the tools in Table 1. pdftotext ran in two modes: its default reading order and{" "}
          <code style={codeStyle}>-layout</code>, which keeps the physical position of the text. Different
          parsers make different choices, so a resume is only safe when all three outputs make sense.
        </p>
        <div style={{ overflowX: "auto", margin: "1.25rem 0 0" }}>
          <table className="booktabs">
            <thead><tr><th>Step</th><th>Tool and version</th></tr></thead>
            <tbody>
              <tr><td>Compile</td><td>{PDFTEX}, LaTeX {LATEX}</td></tr>
              <tr><td>Extractor 1</td><td>poppler {META.extractor.replace("pdftotext version", "pdftotext")}, default and <code>-layout</code> modes</td></tr>
              <tr><td>Extractor 2</td><td>{META.extractor2}, <code>extract_text()</code></td></tr>
            </tbody>
          </table>
        </div>
        <p className="caption"><b>Table 1.</b> The test bench. The scripts are in the latexci repository under <code style={codeStyle}>scripts/seo-cv/</code>.</p>
        <p className="note">
          <b>Remark.</b> These are two extractors among many. The point is not to predict one product but to
          see which LaTeX constructs give unstable text, the raw material every parser starts from.
        </p>

        <h2><span className="secnum">2</span>Accents, ligatures and glyphtounicode</h2>
        <p>
          The usual advice is to add <code style={codeStyle}>{"\\input{glyphtounicode}\\pdfgentounicode=1"}</code>{" "}
          so that ligatures such as <i>fi</i> extract as two letters. We crossed that line with the font
          encoding, on the text of Figure 1.
        </p>
        <figure style={{ margin: "1.5rem 0 0" }}>
          <XFig>
            <PageImage src={R["lig-ot1"].png!} size={R["lig-ot1"].size!} alt="Rendered test line with accented names, fi and ffi ligatures, an en dash, a bullet and an arrow" />
            <XRow><XCell label="Source (body)"><Verbatim text={R["lig-ot1"].shown} /></XCell></XRow>
          </XFig>
          <figcaption className="caption"><b>Figure 1.</b> The accent and ligature test, rendered. The four variants of Table 2 look identical on paper.</figcaption>
        </figure>

        <div style={{ overflowX: "auto", margin: "1.5rem 0 0" }}>
          <table className="booktabs">
            <thead>
              <tr><th>Encoding</th><th>glyphto&shy;unicode line</th><th className="hide-sm">ToUnicode</th><th>ü in pdftotext</th><th>ü in pypdf</th><th className="hide-sm">fi, ffi</th></tr>
            </thead>
            <tbody>
              {LIG_ROWS.map(({ id, enc, g2u }) => (
                <tr key={id}>
                  <td>{enc}</td>
                  <td>{g2u}</td>
                  <td className="hide-sm">{toUni(R[id])} fonts</td>
                  <td>{umlaut(R[id].text)}</td>
                  <td>{umlaut(R[id].pypdf)}</td>
                  <td className="hide-sm">{ligaturesOk(R[id].text) && ligaturesOk(R[id].pypdf) ? "letters" : "broken"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="caption"><b>Table 2.</b> Font encoding (OT1 is LaTeX&rsquo;s default; T1 here with lmodern) against the glyphtounicode line. ToUnicode: fonts carrying a Unicode map. U+0308 is a combining diaeresis, U+00A8 a spacing one, U+00FC the letter ü. &ldquo;Letters&rdquo;: both extractors returned <i>efficiency</i>, <i>financial</i> and <i>affine</i> as plain words.</p>

        <p>
          Two results stand out. First, the encoding matters and the glyphtounicode line did not. With the
          default OT1 encoding, LaTeX builds ü from a u and a separate accent, and that is what comes out:
          pypdf returned the first line as
        </p>
        <XFig><XRow><XCell><Verbatim text={firstLine(R["lig-ot1"].pypdf)} /></XCell></XRow></XFig>
        <p style={{ textIndent: 0, marginTop: "0.8rem" }}>
          and pdftotext returned a u followed by a combining diaeresis, which a search for the precomposed ü
          does not match unless the software normalises Unicode. With{" "}
          <code style={codeStyle}>{"\\usepackage[T1]{fontenc}"}</code> each accented letter is one glyph
          and both tools returned it as one character. Second, the ligatures were fine everywhere: on this
          installation the format already sets <code style={codeStyle}>\pdfgentounicode</code> to{" "}
          {G2U_DEFAULT} (we printed its value), and every font of every test PDF carried a ToUnicode map
          with or without the line. Keep the line anyway: it costs nothing and makes the setting explicit
          for anyone who compiles your source on an installation that does not set it.
        </p>

        <h2><span className="secnum">3</span>Two columns against one</h2>
        <p>
          Figure 2 is the classic resume sidebar: skills and languages on the left, experience on the right.
          We built it twice, with two <code style={codeStyle}>minipage</code> boxes and with the{" "}
          <code style={codeStyle}>paracol</code> package.
          {PARACOL_SAME ? " Both PDFs gave exactly the same text in all three readings, so only one is shown." : ""}
        </p>
        <figure style={{ margin: "1.5rem 0 0" }}>
          <XFig>
            <PageImage src={R["cols-minipage"].png!} size={R["cols-minipage"].size!} alt="Two-column resume excerpt: skills and languages in a left sidebar, experience on the right" />
            <XRow cols={2}>
              <XCell label="Source, minipage"><Verbatim text={R["cols-minipage"].shown} /></XCell>
              <XCell label="Source, paracol"><Verbatim text={R["cols-paracol"].shown} /></XCell>
            </XRow>
            <XRow cols={2}>
              <XCell label="pdftotext"><Verbatim text={R["cols-minipage"].text} /></XCell>
              <XCell label="pypdf"><Verbatim text={R["cols-minipage"].pypdf} /></XCell>
            </XRow>
            <XRow><XCell label={<>pdftotext <code>-layout</code></>}><Verbatim text={R["cols-minipage"].layout} /></XCell></XRow>
          </XFig>
          <figcaption className="caption"><b>Figure 2.</b> A two-column resume and what three readings return. In layout mode the columns are merged line by line.</figcaption>
        </figure>
        <p>
          The reading-order extractors kept each column as a block, so the sidebar came first and the
          experience second. Layout mode did what its name says: the line &ldquo;Skills&rdquo; and the line
          &ldquo;Experience&rdquo; became one line, and &ldquo;Python, SQL&rdquo; now sits in front of a job
          title. A parser that reads line by line sees a skill list fused with your work history. The single
          flow in Figure 3 holds the same words
          {SINGLE_MODES_SAME ? " and gave identical text in both pdftotext modes" : ""}.
        </p>
        <figure style={{ margin: "1.5rem 0 0" }}>
          <XFig>
            <XRow><XCell label="Source, one column"><Verbatim text={R["cols-single"].shown} /></XCell></XRow>
            <XRow cols={2}>
              <XCell label={SINGLE_MODES_SAME ? <>pdftotext, both modes</> : "pdftotext"}><Verbatim text={R["cols-single"].text} wrap /></XCell>
              <XCell label="pypdf"><Verbatim text={R["cols-single"].pypdf} wrap /></XCell>
            </XRow>
            <XRow><XCell label={<>pypdf, with <code>\pdfinterwordspaceon</code> in the preamble</>}><Verbatim text={R["cols-single-iws"].pypdf} /></XCell></XRow>
          </XFig>
          <figcaption className="caption"><b>Figure 3.</b> The same content in one column. pypdf glued the bold label to the next word until real spaces were written into the PDF.</figcaption>
        </figure>
        <p>
          pdfTeX does not write space characters: it moves the next word to the right, and the extractor has
          to guess that the gap is a space. pypdf did not guess across the <code style={codeStyle}>\quad</code>{" "}
          after a bold label. The pdfTeX primitive <code style={codeStyle}>\pdfinterwordspaceon</code> writes
          real spaces, and with it the words separated (Figure 3, last cell).
        </p>

        <h2><span className="secnum">4</span>Icons against labels</h2>
        <p>
          Icon fonts such as <code style={codeStyle}>fontawesome5</code> draw an envelope or a phone with a
          glyph that has no letter behind it. Figure 4 shows what the extractors made of four icons, next to
          the same line with words.
        </p>
        <figure style={{ margin: "1.5rem 0 0" }}>
          <XFig>
            <PageImage src={R["icons-fa"].png!} size={R["icons-fa"].size!} alt="Contact line with envelope, phone, LinkedIn and GitHub icons" />
            <XRow cols={2}>
              <XCell label="Source, icons"><Verbatim text={R["icons-fa"].shown} /></XCell>
              <XCell label="Source, labels"><Verbatim text={R["icons-plain"].shown} /></XCell>
            </XRow>
            <XRow cols={2}>
              <XCell label="pdftotext, icons"><Verbatim text={R["icons-fa"].text} /></XCell>
              <XCell label="pdftotext, labels"><Verbatim text={R["icons-plain"].text} /></XCell>
            </XRow>
            <XRow cols={2}>
              <XCell label="pypdf, icons"><Verbatim text={R["icons-fa"].pypdf} wrap /></XCell>
              <XCell label="pypdf, labels"><Verbatim text={R["icons-plain"].pypdf} wrap /></XCell>
            </XRow>
          </XFig>
          <figcaption className="caption"><b>Figure 4.</b> Icons extract as stray symbols, an invisible control character (shown in red) or glyph names. Labels extract as written.</figcaption>
        </figure>
        <p>
          The labels survived, but notice the order in the pdftotext cell: the wide{" "}
          <code style={codeStyle}>\quad</code>{" "}gaps made it read the wrapped line as columns, so
          &ldquo;GitHub&rdquo; came second. A visible separator avoids that; the latexci builder puts a
          vertical bar between contact items, and its contact lines came out in order (Figure 6).
        </p>

        <h2><span className="secnum">5</span>Where to put the dates</h2>
        <p>
          Many templates give dates their own column. We set two jobs five ways and checked, in each reading,
          whether each date stayed on its job title&rsquo;s line or alone on the line next to it (Table 3).
        </p>
        <div style={{ overflowX: "auto", margin: "1.25rem 0 0" }}>
          <table className="booktabs">
            <thead><tr><th>Layout</th><th>pdftotext</th><th><code>-layout</code></th><th>pypdf</th></tr></thead>
            <tbody>
              {DATE_ROWS.map(({ id, name }) => (
                <tr key={id}>
                  <td>{name}</td>
                  <td>{dateVerdict(R[id].text)}</td>
                  <td>{dateVerdict(R[id].layout)}</td>
                  <td>{dateVerdict(R[id].pypdf)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="caption"><b>Table 3.</b> Does each date stay with its job? Computed from the extracted text of each PDF.</p>
        <figure style={{ margin: "1.75rem 0 0" }}>
          <XFig>
            <PageImage src={R["dates-hfill"].png!} size={R["dates-hfill"].size!} alt="Two jobs with dates pushed to the right margin" />
            <XRow><XCell label={<>Source, <code>\hfill</code></>}><Verbatim text={R["dates-hfill"].shown} /></XCell></XRow>
            <XRow><XCell label={<>Source, <code>minipage</code> column</>}><Verbatim text={R["dates-minipage"].shown} /></XCell></XRow>
            <XRow cols={2}>
              <XCell label={<>pdftotext, <code>\hfill</code></>}><Verbatim text={R["dates-hfill"].text} /></XCell>
              <XCell label={<>pdftotext, <code>minipage</code> column</>}><Verbatim text={R["dates-minipage"].text} /></XCell>
            </XRow>
          </XFig>
          <figcaption className="caption"><b>Figure 5.</b> Two ways to lose a date. Right-aligned dates moved below the bullet lines; a separate date column came out before both jobs.</figcaption>
        </figure>
        <p>
          Two layouts kept every date in place in all three readings: the date written on the title line
          after a comma, and a <code style={codeStyle}>tabular</code> date column once{" "}
          <code style={codeStyle}>\pdfinterwordspaceon</code> stopped pypdf from gluing the date to the job
          title. Dates in a separate <code style={codeStyle}>minipage</code> were lost in every reading. A date
          flushed right with <code style={codeStyle}>\hfill</code> depends on what follows it, as the next
          section shows.
        </p>

        <h2><span className="secnum">6</span>The latexci builder&rsquo;s output</h2>
        <p>
          The <Link href="/tools/cv-builder">CV builder</Link> uses T1, lmodern, the glyphtounicode line,
          hyperref metadata, one column and plain-text contact labels. Its dates are pushed right with{" "}
          <code style={codeStyle}>\hfill</code> but set smaller and followed by the employer line. We compiled
          its English example in the industry layout; Figure 6 is the start of the pdftotext output.
        </p>
        <figure style={{ margin: "1.5rem 0 0" }}>
          <XFig><XRow><XCell label="pdftotext, first lines"><Verbatim text={BUILDER_HEAD} wrap /></XCell></XRow></XFig>
          <figcaption className="caption"><b>Figure 6.</b> The builder&rsquo;s industry example as pdftotext reads it. The date follows its job title.</figcaption>
        </figure>
        <p>
          pypdf is less kind to it. It split a word at a kerned capital in the industry layout and, in the
          academic layout, glued the date to the title (Figure 7).
        </p>
        <figure style={{ margin: "1.5rem 0 0" }}>
          <XFig>
            <XRow><XCell label="pypdf, industry layout"><Verbatim text={BUILDER_PYPDF_LINE} wrap /></XCell></XRow>
            <XRow><XCell label="pypdf, academic layout"><Verbatim text={BUILDER_ACAD_PYPDF_LINE} wrap /></XCell></XRow>
          </XFig>
          <figcaption className="caption"><b>Figure 7.</b> The same job line in pypdf. pdftotext read both layouts correctly.</figcaption>
        </figure>
        <p>
          We report it as found: no extractor is perfect, which is why the checklist ends with reading your
          own PDF.
        </p>

        <h2><span className="secnum">7</span>Checklist</h2>
        <p>Each item points to the experiment behind it.</p>
        <ol className="checklist">
          <li><b>Use the T1 encoding.</b> <code>{"\\usepackage[T1]{fontenc}"}</code> with <code>lmodern</code> made accented letters single characters (Table 2).</li>
          <li><b>Keep the glyphtounicode line.</b> It changed nothing on TeX Live 2026, but it costs nothing and covers other installations (Section 2).</li>
          <li><b>One column.</b> Sidebars were merged with the main column in layout mode (Figure 2).</li>
          <li><b>Dates on the title line.</b> Inline dates stayed in place in every reading; a date column in its own box did not (Table 3).</li>
          <li><b>Words, not icons.</b> Write &ldquo;Email:&rdquo; or nothing; separate contact items with a bar, not wide spaces (Figure 4).</li>
          <li><b>Fill the PDF metadata.</b> hyperref writes a title and an author into the file (Figure 8).</li>
          <li><b>Read your own PDF.</b> Run <code>pdftotext</code> in both modes and read the result from top to bottom (Figure 9).</li>
        </ol>
        <figure style={{ margin: "1.5rem 0 0" }}>
          <XFig>
            <XRow><XCell label="Preamble"><Verbatim text={R["preamble"].shown} /></XCell></XRow>
            <XRow><XCell label={<><code>pdfinfo</code> on the result</>}><Verbatim text={R["preamble"].info ?? ""} /></XCell></XRow>
          </XFig>
          <figcaption className="caption"><b>Figure 8.</b> The checklist preamble, compiled on its own, and the metadata it produced.</figcaption>
        </figure>
        <figure style={{ margin: "1.5rem 0 0" }}>
          <XFig><XRow><XCell label="Shell"><Verbatim text={CHECK_CMD} /></XCell></XRow></XFig>
          <figcaption className="caption"><b>Figure 9.</b> Checking a PDF yourself with poppler&rsquo;s pdftotext.</figcaption>
        </figure>

        <h2><span className="secnum">8</span>Build one that passes</h2>
        <p>
          The <Link href="/tools/cv-builder">LaTeX resume and CV builder</Link> applies items 1 to 6 for you,
          in English or French, with an academic or a one-page industry layout. Researchers can fill the
          publication list from ORCID: see <Link href="/orcid-to-latex-cv">ORCID to a LaTeX publication
          list</Link>. French speakers will find the French conventions in{" "}
          <Link href="/cv-latex" hrefLang="fr"><span lang="fr">Modèle de CV LaTeX gratuit</span></Link>.
        </p>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "1rem" }}>
          <Link href="/tools/cv-builder" className="btn btn-primary">Open the CV builder</Link>
          <Link href="/tools/templates/cv-photo" className="btn">Industry resume template</Link>
          <Link href="/tools/templates/cv" className="btn">Academic CV template</Link>
        </div>

        <h2 style={{ marginTop: "3rem" }}>Appendix A&ensp;Limits of this test</h2>
        <p>
          Two extractors, one TeX distribution and short documents. A commercial parser may normalise
          Unicode, merge lines or use optical character recognition; we cannot see inside one. What the test
          does show is which LaTeX constructs produce text that depends on the reader, and those are the ones
          worth avoiding. Every source on this page compiled on the date above; the PDFs, the extracted text
          and the scripts can be regenerated with <code style={codeStyle}>node scripts/seo-cv/run-ats.mjs</code>.
        </p>
      </main>

      <SiteFooter />
    </div>
  );
}
