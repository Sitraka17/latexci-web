import type { Metadata } from "next";
import Link from "@/components/Link";
import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";
import TableGenerator from "@/components/TableGenerator";
import Faq from "@/components/Faq";
import { breadcrumbSchema } from "@/lib/breadcrumbs";
import "./table.css";

export const metadata: Metadata = {
  title: "LaTeX Table Generator: Free, Paste from Excel or CSV",
  description:
    "Free LaTeX table generator, paste from Excel or CSV, pick alignment, choose booktabs or simple borders, and copy ready-to-use tabular code. No signup.",
  keywords: [
    "latex table generator",
    "latex table generator online",
    "latex tabular generator",
    "booktabs latex table",
    "latex table maker",
    "create latex table from excel",
    "latex table from csv",
    "online latex table creator",
    "latex tabular environment",
    "latex table generator free",
    "paste excel to latex table",
    "academic table latex",
    "latex table online",
    "convert excel to latex table",
  ],
  alternates: { canonical: "/tools/table" },
  openGraph: {
    title: "LaTeX Table Generator: Free, Paste from Excel | latexci",
    description: "Visual LaTeX table builder. Paste from Excel/CSV or type data, pick alignment and borders, copy booktabs or tabular code instantly.",
    url: "/tools/table", type: "website",
  },
  twitter: { card: "summary_large_image", title: "LaTeX Table Generator | latexci" },
};

const schema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "LaTeX Table Generator | latexci",
  description: "Free online LaTeX table generator. Paste from Excel/CSV, pick alignment, copy booktabs or tabular code. No signup required.",
  url: "https://latexci.com/tools/table",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Web Browser",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How do I create a LaTeX table from Excel?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Select your data in Excel, copy it (Ctrl+C / Cmd+C), then paste it into the latexci table generator. The tool automatically detects tab-separated values and fills all rows and columns. Click 'Copy LaTeX' to get the tabular code.",
      },
    },
    {
      "@type": "Question",
      name: "What is the difference between booktabs and simple borders in LaTeX?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Booktabs uses \\toprule, \\midrule, and \\bottomrule, horizontal rules only, no vertical lines. This is the style recommended by most journals and the LaTeX typesetting community. Simple borders use \\hline and vertical | characters in the column spec. Booktabs is generally preferred for academic papers.",
      },
    },
    {
      "@type": "Question",
      name: "How do I paste a CSV file into a LaTeX table?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Open your CSV in a text editor or Excel, copy the rows, and paste them directly into the table generator grid. The tool handles both comma-separated and tab-separated formats.",
      },
    },
    {
      "@type": "Question",
      name: "Do I need \\usepackage{booktabs} in my preamble?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, when using the booktabs style, the generated LaTeX includes a comment reminding you to add \\usepackage{booktabs} to your preamble. Simple and no-border styles do not need this package.",
      },
    },
  ],
};

const FAQS = faqSchema.mainEntity.map((q) => ({ q: q.name, a: q.acceptedAnswer.text }));

const STYLES: { name: string; rules: string; spec: string; pkg: string }[] = [
  { name: "booktabs", rules: "\\toprule, \\midrule, \\bottomrule", spec: "l c r", pkg: "booktabs" },
  { name: "Simple borders", rules: "\\hline around every row", spec: "|l|c|r|", pkg: "none" },
  { name: "No borders", rules: "none, or \\hline with Row lines", spec: "l c r", pkg: "none" },
];

export default function TablePage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema({ name: "Table Generator", path: "/tools/table" })) }} />
      <Navbar />
      <main style={{ flex: 1, width: "100%" }}>
        <header className="tool-head">
          <h1>LaTeX Table Generator: Free, Paste from Excel or CSV</h1>
          <p className="lede">
            Fill the grid or paste a block from a spreadsheet, choose the alignment and the rules, and copy a{" "}
            <code>tabular</code> that compiles as shown in the preview.
          </p>
        </header>

        <div className="tg-wrap">
          <figure>
            <div className="tool-frame">
              <TableGenerator />
            </div>
            <figcaption className="tool-caption">
              <b>Figure 1.</b> The table generator: (a) the data grid, (b) the table as it will be typeset,
              (c) the LaTeX to paste into your document.
            </figcaption>
          </figure>
        </div>

        <article className="paper tg-prose">
          <h2><span className="secnum">1</span>How to use it</h2>
          <ol>
            <li>
              Type your data in the grid of Figure 1(a), or copy a range of cells in Excel, LibreOffice or Google
              Sheets and paste it into any cell: the grid takes the size of what you pasted.
            </li>
            <li>
              Set the alignment of each column with the <code>l</code>, <code>c</code> and <code>r</code> buttons
              above it. Text usually reads best left aligned, numbers right aligned.
            </li>
            <li>
              Choose a rule style and whether the first row is a bold header. The preview in Figure 1(b) follows
              every change.
            </li>
            <li>
              Press Copy LaTeX and paste the result into the body of your document, then replace the placeholder
              caption and the <code>tab:your-label</code> label. The caption sits above the table, as is
              the convention for tables, and the float uses <code>[htbp]</code> so LaTeX can place it.
            </li>
          </ol>

          <h2><span className="secnum">2</span>Choosing a rule style</h2>
          <p>
            Table 1 compares the three styles. Most journals and the LaTeX typesetting community recommend{" "}
            <code>booktabs</code>: three horizontal rules of two weights and no vertical lines, which is also how
            the tables on this page are set.
          </p>
          <div style={{ overflowX: "auto", margin: "1.1rem 0 0" }}>
            <table className="booktabs">
              <thead>
                <tr><th>Style</th><th>Rules in the output</th><th>Column spec</th><th>Package</th></tr>
              </thead>
              <tbody>
                {STYLES.map((s) => (
                  <tr key={s.name}>
                    <td style={{ whiteSpace: "nowrap" }}>{s.name}</td>
                    <td><code>{s.rules}</code></td>
                    <td style={{ whiteSpace: "nowrap" }}><code>{s.spec}</code></td>
                    <td>{s.pkg === "none" ? "none" : <code>{s.pkg}</code>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="caption"><b>Table 1.</b> The three rule styles, for columns aligned left, center and right.</p>
          <p style={{ marginTop: "1rem" }}>
            The booktabs commands are not part of the LaTeX kernel. The generated code starts with a comment
            that reminds you of it; the package itself goes in the preamble, before{" "}
            <code>\begin{"{document}"}</code>:
          </p>
          <pre className="codebox">{`\\usepackage{booktabs}`}</pre>

          <h2><span className="secnum">3</span>Pasting from Excel or CSV</h2>
          <p>
            A range copied from a spreadsheet arrives as tab-separated text, one line per row, and is split on
            the tabs, so a cell such as <code>Smith, J.</code> stays in one piece. Text without tabs is read as
            CSV: cells are split on commas, and a field in double quotes may contain commas. Empty lines are
            skipped and every cell is trimmed.
          </p>
          <p>
            Only a paste that contains a tab or a line break replaces the table. A single value pasted into a
            cell goes into that cell, as in any text field.
          </p>

          <h2><span className="secnum">4</span>Special characters</h2>
          <p>
            Cell contents are treated as plain text. The ten characters that LaTeX reserves
            (<code style={{ whiteSpace: "nowrap" }}>\ &amp; % $ # _ {"{ }"} ~ ^</code>) are escaped in the output, so <code>R&amp;D</code> becomes{" "}
            <code>R\&amp;D</code> and <code>50%</code> becomes <code>50\%</code>, and the table compiles on the
            first try. The other side of this rule: LaTeX typed in a cell, such as <code>$x^2$</code>, is
            printed literally. Add math or macros after pasting the code into your document, where the{" "}
            <Link href="/tools/preview">live LaTeX preview</Link> shows the result.
          </p>

          <h2>Appendix A&ensp;Questions</h2>
          <Faq items={FAQS} name="table-faq" />
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
