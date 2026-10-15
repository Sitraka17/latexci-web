import { describe, it, expect } from "vitest";
import { DOMParser, XMLSerializer } from "@xmldom/xmldom";
import JSZip from "jszip";
import mammoth from "mammoth";
import {
  htmlToLatex, docxToLatex, inlineOmmlEquations, escapeText, latexBody,
  WORD_SAMPLE_HTML, WORD_SAMPLE_LATEX, WORD_SAMPLE_OMML,
  type DomImpl,
} from "../word-latex";

const dom = { DOMParser, XMLSerializer } as unknown as DomImpl;
const parseHtml = (html: string) =>
  new DOMParser().parseFromString(`<body>${html}</body>`, "text/html") as unknown as Document;
const convert = (html: string, equations = []) => htmlToLatex(html, { parseHtml, equations });

// ── A real .docx built from parts, for the full pipeline ──────────────────
const W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"';
const run = (t: string, rpr = "") => `<w:r>${rpr}<w:t xml:space="preserve">${t}</w:t></w:r>`;
const para = (inner: string, style = "") => `<w:p>${style ? `<w:pPr><w:pStyle w:val="${style}"/></w:pPr>` : ""}${inner}</w:p>`;
const noteRef = (id: number) => `<w:r><w:rPr><w:rStyle w:val="FootnoteReference"/></w:rPr><w:footnoteReference w:id="${id}"/></w:r>`;
const mrun = (t: string) => `<m:r><m:t>${t}</m:t></m:r>`;
const cell = (inner: string) => `<w:tc><w:tcPr><w:tcW w:w="2000" w:type="dxa"/></w:tcPr>${inner}</w:tc>`;
const listPara = (t: string) => `<w:p><w:pPr><w:pStyle w:val="ListParagraph"/><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr>${run(t)}</w:p>`;

async function buildDocx(body: string): Promise<ArrayBuffer> {
  const zip = new JSZip();
  zip.file("[Content_Types].xml",
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>' +
    '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
    '<Override PartName="/word/footnotes.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footnotes+xml"/>' +
    '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>' +
    '<Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/></Types>');
  zip.file("_rels/.rels",
    '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
  zip.file("word/_rels/document.xml.rels",
    '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footnotes" Target="footnotes.xml"/>' +
    '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
    '<Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/></Relationships>');
  zip.file("word/styles.xml",
    `<?xml version="1.0" encoding="UTF-8"?><w:styles ${W}>` +
    '<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/></w:style>' +
    '<w:style w:type="paragraph" w:styleId="ListParagraph"><w:name w:val="List Paragraph"/></w:style></w:styles>');
  zip.file("word/numbering.xml",
    `<?xml version="1.0" encoding="UTF-8"?><w:numbering ${W}>` +
    '<w:abstractNum w:abstractNumId="0"><w:lvl w:ilvl="0"><w:numFmt w:val="bullet"/><w:lvlText w:val="-"/></w:lvl></w:abstractNum>' +
    '<w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num></w:numbering>');
  zip.file("word/footnotes.xml",
    `<?xml version="1.0" encoding="UTF-8"?><w:footnotes ${W}>` +
    '<w:footnote w:type="separator" w:id="-1"><w:p><w:r><w:separator/></w:r></w:p></w:footnote>' +
    '<w:footnote w:type="continuationSeparator" w:id="0"><w:p><w:r><w:continuationSeparator/></w:r></w:p></w:footnote>' +
    `<w:footnote w:id="1">${para(run("A note in the title."))}</w:footnote></w:footnotes>`);
  zip.file("word/document.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ${W}><w:body>${body}</w:body></w:document>`);
  return zip.generateAsync({ type: "arraybuffer" });
}

const toHtml = (data: ArrayBuffer) => mammoth.convertToHtml({ buffer: Buffer.from(data) });
const loadZip = (data: ArrayBuffer) => JSZip.loadAsync(data);

// Body with every case of the audit: footnote in a heading, Unicode symbols,
// a list in a table cell, leading and trailing <br>, and an OMML equation.
const AUDIT_BODY =
  para(run("Intro") + noteRef(1), "Heading1") +
  para(run("Errors ≤ 5 % and ≥ 2 °C, x − y, α = 0.05, µm, 3 × 4, a → b, ≈ 1, ≠ 0.")) +
  para("<w:r><w:br/></w:r>" + run("After a leading break.") + "<w:r><w:br/></w:r>") +
  para(run("Energy ") +
    `<m:oMath><m:sSup><m:e>${mrun("E")}</m:e><m:sup>${mrun("2")}</m:sup></m:sSup>${mrun("≤")}<m:f><m:num>${mrun("α")}</m:num><m:den>${mrun("n")}</m:den></m:f></m:oMath>` +
    run(" holds.")) +
  `<m:oMathPara><m:oMath><m:nary><m:naryPr><m:chr m:val="∑"/></m:naryPr><m:sub>${mrun("i=1")}</m:sub><m:sup>${mrun("n")}</m:sup><m:e>${mrun("x")}</m:e></m:nary></m:oMath></m:oMathPara>` +
  "<w:tbl><w:tblPr/>" +
  `<w:tr>${cell(para(run("Item")))}${cell(para(run("Notes")))}</w:tr>` +
  `<w:tr>${cell(para(run("Risks")))}${cell(listPara("first") + listPara("second"))}</w:tr>` +
  "</w:tbl>" +
  para(run("End."));

describe("escapeText", () => {
  it("maps symbols pdfLaTeX stops on", () => {
    expect(escapeText("≤ ≥ − α ° µ × → ≈ ≠")).toBe(
      "\\ensuremath{\\leq} \\ensuremath{\\geq} \\ensuremath{-} \\ensuremath{\\alpha} \\textdegree{} " +
      "\\ensuremath{\\mu} \\texttimes{} \\ensuremath{\\rightarrow} \\ensuremath{\\approx} \\ensuremath{\\neq}",
    );
  });
  it("escapes the special characters once", () => {
    expect(escapeText("a\\b {x} 5% #1 a_b ~ ^ $ &")).toBe(
      "a\\textbackslash{}b \\{x\\} 5\\% \\#1 a\\_b \\textasciitilde{} \\textasciicircum{} \\$ \\&",
    );
  });
  it("replaces characters with no equivalent and reports them", () => {
    const bad = new Set<string>();
    expect(escapeText("漢 é", bad)).toBe("? é");
    expect([...bad]).toEqual(["漢"]);
  });
});

describe("htmlToLatex", () => {
  it("gives a heading with a footnote a short title without it", () => {
    const html = '<h1>Intro<sup><a href="#footnote-1" id="footnote-ref-1">[1]</a></sup></h1>' +
      '<ol><li id="footnote-1"><p>Note. <a href="#footnote-ref-1">↑</a></p></li></ol>';
    const body = latexBody(convert(html).latex);
    expect(body).toBe("\\section[Intro]{Intro\\footnote{Note.}}");
  });

  it("keeps every paragraph of a footnote", () => {
    const html = '<p>A<sup><a href="#footnote-1">[1]</a></sup></p>' +
      '<ol><li id="footnote-1"><p>One.</p><p>Two. <a href="#footnote-ref-1">↑</a></p></li></ol>';
    expect(latexBody(convert(html).latex)).toContain("One.");
    expect(latexBody(convert(html).latex)).toContain("Two.");
  });

  it("strips leading and trailing <br> in a paragraph", () => {
    const body = latexBody(convert("<p><br />Text<br />more<br /><br /></p><p><strong><br />Bold</strong></p>").latex);
    expect(body).toBe("Text\\\\\nmore\n\n\\textbf{Bold}");
    expect(body.split("\n\n").every((p) => !p.trim().startsWith("\\\\"))).toBe(true);
  });

  it("uses p{} columns when a cell holds a list", () => {
    const html = "<table><tr><td><p>Item</p></td><td><p>Notes</p></td></tr>" +
      "<tr><td><p>Risks</p></td><td><ul><li>first</li><li>second</li></ul></td></tr></table>";
    const body = latexBody(convert(html).latex);
    expect(body).toContain("\\begin{tabular}{p{0.47\\linewidth}p{0.47\\linewidth}}");
    expect(body).toContain("\\begin{itemize}");
  });

  it("uses p{} columns and \\newline for several paragraphs or a break in a cell", () => {
    const body = latexBody(convert("<table><tr><td><p>a</p><p>b</p></td><td>c<br />d</td></tr></table>").latex);
    expect(body).toContain("{p{0.47\\linewidth}p{0.47\\linewidth}}");
    expect(body).toContain("a\\par b");
    expect(body).toContain("c\\newline d");
  });

  it("keeps l columns for plain cells", () => {
    const body = latexBody(convert("<table><tr><td>a</td><td>b</td></tr></table>").latex);
    expect(body).toContain("\\begin{tabular}{ll}");
  });

  it("puts the table caption and label above the tabular", () => {
    const body = latexBody(convert("<table><tr><td>a</td></tr><tr><td>b</td></tr></table>").latex);
    expect(body).toBe(
      "\\begin{table}[htbp]\n  \\centering\n  \\caption{Table 1}\n  \\label{tab:1}\n" +
      "  \\begin{tabular}{l}\n    \\toprule\n    a \\\\\n    \\midrule\n    b \\\\\n    \\bottomrule\n  \\end{tabular}\n\\end{table}",
    );
  });

  it("keeps the figure caption below with the label after it, without float", () => {
    const { latex } = convert('<p><img src="x" alt="Plot" /></p>');
    expect(latex).toMatch(/\\includegraphics[^\n]*\n {2}\\caption\{Plot\}\n {2}\\label\{fig:1\}/);
    expect(latex).not.toContain("{float}");
  });

  it("loads hyperref last and maps <em> to \\emph", () => {
    const { latex } = convert("<p><em>a</em> <i>b</i> <s>c</s></p>");
    const pre = latex.split("\\begin{document}")[0].trim().split("\n");
    expect(pre[pre.length - 1]).toBe("\\usepackage{hyperref}");
    expect(latex).toContain("\\emph{a} \\emph{b} \\sout{c}");
  });
});

describe("OMML", () => {
  it("converts inline and display equations", () => {
    const xml = `<w:document ${W}><w:body>${AUDIT_BODY}</w:body></w:document>`;
    const { equations } = inlineOmmlEquations(xml, dom);
    expect(equations).toEqual([
      { latex: "\\sum_{i=1}^{n} x", display: true },
      { latex: "E^{2}\\leq \\frac{\\alpha}{n}", display: false },
    ]);
  });

  it("joins the rows of a matrix with a single \\\\", () => {
    const m = '<m:m><m:mr><m:e><m:r><m:t>a</m:t></m:r></m:e><m:e><m:r><m:t>b</m:t></m:r></m:e></m:mr>' +
      "<m:mr><m:e><m:r><m:t>c</m:t></m:r></m:e><m:e><m:r><m:t>d</m:t></m:r></m:e></m:mr></m:m>";
    const { equations } = inlineOmmlEquations(`<w:document ${W}><w:body><w:p><m:oMath>${m}</m:oMath></w:p></w:body></w:document>`, dom);
    expect(equations[0].latex).toBe("\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}");
  });
});

describe("docxToLatex (mammoth, full pipeline)", () => {
  it("converts the audit document", async () => {
    const res = await docxToLatex(await buildDocx(AUDIT_BODY), { loadZip, toHtml, dom, parseHtml });
    const body = latexBody(res.latex);
    expect(body).toContain("\\section[Intro]{Intro\\footnote{A note in the title.}}");
    expect(body).toContain("Errors \\ensuremath{\\leq} 5 \\% and \\ensuremath{\\geq} 2 \\textdegree{}C");
    expect(body).toContain("\nAfter a leading break.\n");
    expect(body).toContain("Energy $E^{2}\\leq \\frac{\\alpha}{n}$ holds.");
    expect(body).toContain("\\[\n  \\sum_{i=1}^{n} x\n\\]");
    expect(body).toContain("p{0.47\\linewidth}");
    expect(res.equations).toBe(2);
    expect(res.unsupported).toEqual([]);
  });

  it("matches the sample shown on the page", async () => {
    const xml = `<w:document ${W}><w:body><w:p>${WORD_SAMPLE_OMML}</w:p></w:body></w:document>`;
    const { equations } = inlineOmmlEquations(xml, dom);
    expect(latexBody(htmlToLatex(WORD_SAMPLE_HTML, { parseHtml, equations }).latex)).toBe(WORD_SAMPLE_LATEX);
  });

  // WORD_LATEX_DUMP=out.tex writes the converted audit document, to compile it by hand.
  it.runIf(!!process.env.WORD_LATEX_DUMP)("dumps the audit document", async () => {
    const fs = await import("fs");
    const docx = await buildDocx(AUDIT_BODY);
    fs.writeFileSync(process.env.WORD_LATEX_DUMP!.replace(/\.tex$/, ".docx"), Buffer.from(docx));
    const res = await docxToLatex(docx, { loadZip, toHtml, dom, parseHtml });
    fs.writeFileSync(process.env.WORD_LATEX_DUMP!, res.latex);
    const edge = convert(
      '<h2><strong>Bold</strong> title<sup><a href="#footnote-1">[1]</a></sup><br /></h2>' +
      "<table><tr><td colspan=\"2\"><p>Merged</p></td><td>x</td></tr>" +
      "<tr><td><p>a</p><p>b</p></td><td>c<br />d</td><td><img src=\"i\" />LTXCIEQ0Z</td></tr>" +
      "<tr><td><table><tr><td>in</td></tr><tr><td>ner</td></tr></table></td></tr></table>" +
      "<ul><li><br />item 漢</li></ul><p>LTXCIEQ1Z</p>" + WORD_SAMPLE_HTML.replace("footnote-1", "footnote-2").replace("footnote-1", "footnote-2").replace("footnote-1", "footnote-2") +
      '<ol><li id="footnote-1"><p>Note one. <a href="#footnote-ref-1">↑</a></p></li></ol>',
      [{ latex: "x^{2}", display: true }, { latex: "\\begin{aligned} a&=b \\\\ c&=d \\end{aligned}", display: true },
        { latex: "\\sigma^{2}", display: false }] as never,
    );
    fs.writeFileSync(process.env.WORD_LATEX_DUMP!.replace(/\.tex$/, "-edge.tex"), edge.latex);
  });
});
