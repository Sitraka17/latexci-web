"use client";
import { useState, useCallback } from "react";
import SignInPrompt from "@/components/SignInPrompt";
import { useDropzone } from "react-dropzone";
import dynamic from "next/dynamic";

const CodeMirror = dynamic(() => import("@uiw/react-codemirror"), { ssr: false });

const ACCEPTED = {
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "application/vnd.oasis.opendocument.text": [".odt"],
  "application/rtf": [".rtf"],
  "text/rtf": [".rtf"],
};

// ── Quality report types ──────────────────────────────────────────────────────
interface QualityReport {
  headings: number;
  paragraphs: number;
  tables: number;
  images: number;
  equations: number;          // OMML equations detected in raw XML
  footnotes: number;
  lists: number;
  links: number;
  unresolvedImages: number;
  score: "excellent" | "good" | "fair" | "needs-review";
}

// ── OMML → LaTeX (best-effort converter) ─────────────────────────────────────
function ommlNodeToLatex(el: Element): string {
  const tag = el.tagName.replace(/^m:/i, "").toLowerCase();
  const kids = () => Array.from(el.children).map(ommlNodeToLatex).join("");

  switch (tag) {
    case "omath":  return `$${kids()}$`;
    case "omathpara": return `\\[\n${Array.from(el.children).map(ommlNodeToLatex).join("")}\n\\]`;
    case "r": {
      // math run — get text
      const t = el.querySelector("m\\:t, t");
      const text = t?.textContent ?? "";
      const rpr = el.querySelector("m\\:rPr, rPr");
      const isItalic = rpr?.querySelector("m\\:sty, sty")?.getAttribute("m:val") === "i";
      return isItalic ? `\\mathit{${text}}` : text;
    }
    case "f": { // fraction
      const num = el.querySelector("m\\:num > *, num > *");
      const den = el.querySelector("m\\:den > *, den > *");
      return `\\frac{${num ? ommlNodeToLatex(num) : "?"}}{${den ? ommlNodeToLatex(den) : "?"}}`;
    }
    case "num": case "den": return kids();
    case "ssup": { // superscript
      const e = el.querySelector("m\\:e > *, e > *");
      const sup = el.querySelector("m\\:sup > *, sup > *");
      return `${e ? ommlNodeToLatex(e) : ""}^{${sup ? ommlNodeToLatex(sup) : ""}}`;
    }
    case "ssub": { // subscript
      const e = el.querySelector("m\\:e > *, e > *");
      const sub = el.querySelector("m\\:sub > *, sub > *");
      return `${e ? ommlNodeToLatex(e) : ""}_{${sub ? ommlNodeToLatex(sub) : ""}}`;
    }
    case "ssubsup": {
      const e = el.querySelector("m\\:e > *, e > *");
      const sub = el.querySelector("m\\:sub > *, sub > *");
      const sup = el.querySelector("m\\:sup > *, sup > *");
      return `${e ? ommlNodeToLatex(e) : ""}_{${sub ? ommlNodeToLatex(sub) : ""}}^{${sup ? ommlNodeToLatex(sup) : ""}}`;
    }
    case "rad": { // radical
      const deg = el.querySelector("m\\:deg, deg");
      const e   = el.querySelector("m\\:e > *, e > *");
      const inner = e ? ommlNodeToLatex(e) : "";
      const degTxt = deg?.textContent?.trim();
      return degTxt && degTxt !== "2" ? `\\sqrt[${degTxt}]{${inner}}` : `\\sqrt{${inner}}`;
    }
    case "nary": { // integral, sum, product
      const chr = el.querySelector("m\\:naryPr m\\:chr, naryPr chr")?.getAttribute("m:val") ?? "∫";
      const sub = el.querySelector("m\\:sub > *, sub > *");
      const sup = el.querySelector("m\\:sup > *, sup > *");
      const e   = el.querySelector("m\\:e > *, e > *");
      const sym = chr === "∑" ? "\\sum"
                : chr === "∏" ? "\\prod"
                : chr === "∫" ? "\\int"
                : chr === "∮" ? "\\oint"
                : `\\int`;
      return `${sym}_{${sub ? ommlNodeToLatex(sub) : ""}}^{${sup ? ommlNodeToLatex(sup) : ""}} ${e ? ommlNodeToLatex(e) : ""}`;
    }
    case "d": { // delimiter
      const begChr = el.querySelector("m\\:dPr m\\:begChr, dPr begChr")?.getAttribute("m:val") ?? "(";
      const endChr = el.querySelector("m\\:dPr m\\:endChr, dPr endChr")?.getAttribute("m:val") ?? ")";
      const openL = begChr === "{" ? "\\{" : begChr;
      const closeL = endChr === "}" ? "\\}" : endChr;
      return `\\left${openL}${kids()}\\right${closeL}`;
    }
    case "e": return kids();
    case "func": {
      const fname = el.querySelector("m\\:fName, fName");
      const e     = el.querySelector("m\\:e > *, e > *");
      return `${fname ? ommlNodeToLatex(fname) : ""}${e ? `{${ommlNodeToLatex(e)}}` : ""}`;
    }
    case "limupp": case "limloc": {
      const e = el.querySelector("m\\:e > *, e > *");
      const lim = el.querySelector("m\\:lim > *, lim > *");
      return `${e ? ommlNodeToLatex(e) : ""}\\limits_{${lim ? ommlNodeToLatex(lim) : ""}}`;
    }
    case "m": { // matrix
      const rows = Array.from(el.querySelectorAll("m\\:mr, mr"))
        .map(r => Array.from(r.querySelectorAll("m\\:e, e")).map(c => ommlNodeToLatex(c)).join(" & "))
        .join(" \\\\\\\\\n");
      return `\\begin{pmatrix}\n${rows}\n\\end{pmatrix}`;
    }
    case "acc": { // accent
      const chr = el.querySelector("m\\:accPr m\\:chr, accPr chr")?.getAttribute("m:val") ?? "^";
      const e = el.querySelector("m\\:e > *, e > *");
      const inner = e ? ommlNodeToLatex(e) : "";
      return chr === "^" ? `\\hat{${inner}}`
           : chr === "̃" ? `\\tilde{${inner}}`
           : chr === "̄" ? `\\bar{${inner}}`
           : chr === "⃗" ? `\\vec{${inner}}`
           : `\\hat{${inner}}`;
    }
    case "t": return el.textContent ?? "";
    default:  return kids();
  }
}

/**
 * Replace every OMML equation in document.xml with a plain-text placeholder
 * run, so mammoth (which drops OMML) keeps the equation's position. Returns
 * the rewritten XML and the LaTeX for each placeholder, in order.
 */
const W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
const M_NS = "http://schemas.openxmlformats.org/officeDocument/2006/math";
function eqToken(i: number) { return `LTXCIEQ${i}Z`; }

function inlineOmmlEquations(xml: string): { xml: string; equations: { latex: string; display: boolean }[] } {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  if (doc.getElementsByTagName("parsererror").length) return { xml, equations: [] };
  const equations: { latex: string; display: boolean }[] = [];
  const swap = (el: Element, display: boolean) => {
    // Convert the children, not the element: ommlNodeToLatex wraps oMath in $…$
    // and oMathPara in \[…\]; the delimiters are chosen when swapping back.
    const body = (m: Element) => Array.from(m.children).map(ommlNodeToLatex).join("");
    let latex = "";
    try {
      latex = (display
        ? Array.from(el.getElementsByTagNameNS(M_NS, "oMath")).map(body).join(" \\\\ ")
        : body(el)).trim();
    } catch { /* keep empty */ }
    const run = doc.createElementNS(W_NS, "w:r");
    const t = doc.createElementNS(W_NS, "w:t");
    t.textContent = latex ? eqToken(equations.length) : "";
    run.appendChild(t);
    el.parentNode?.replaceChild(run, el);
    if (latex) equations.push({ latex, display });
  };
  // Display equations first, so their inner oMath is not handled twice.
  Array.from(doc.getElementsByTagNameNS(M_NS, "oMathPara")).forEach(el => swap(el, true));
  Array.from(doc.getElementsByTagNameNS(M_NS, "oMath")).forEach(el => swap(el, false));
  return { xml: new XMLSerializer().serializeToString(doc), equations };
}

// ── HTML → LaTeX converter ────────────────────────────────────────────────────
let imgCounter = 0;
let tableCols = 1;

function htmlToLatex(html: string): { latex: string; stats: Partial<QualityReport> } {
  imgCounter = 0;
  const s: Partial<QualityReport> = {
    headings: 0, paragraphs: 0, tables: 0, images: 0,
    lists: 0, links: 0, footnotes: 0, unresolvedImages: 0,
  };

  // One pass, so the braces of \textbackslash{} are never escaped again.
  const TEX_ESC: Record<string, string> = {
    "\\": "\\textbackslash{}", "{": "\\{", "}": "\\}", $: "\\$", "&": "\\&", "%": "\\%",
    "#": "\\#", _: "\\_", "^": "\\textasciicircum{}", "~": "\\textasciitilde{}",
  };
  const escTex = (text: string) => text.replace(/[\\{}$&%#_^~]/g, (c) => TEX_ESC[c]);
  // Inside \href{...}: hyperref reads the URL verbatim except for these.
  const escUrl = (url: string) => url.replace(/[\\%#{}]/g, (c) => (c === "\\" ? "/" : `\\${c}`));

  // Word footnotes: mammoth emits <sup><a href="#footnote-N">[N]</a></sup> in
  // the text and the notes as <li id="footnote-N"> at the end. Turn them into
  // real \footnote{...} and drop the trailing list.
  const notes = new Map<string, Element>();

  function walk(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) return escTex(node.textContent ?? "");
    if (node.nodeType !== Node.ELEMENT_NODE) return "";
    const el = node as Element;
    const tag = el.tagName.toLowerCase();
    const kids = () => Array.from(el.childNodes).map(walk).join("");

    switch (tag) {
      case "h1": s.headings = (s.headings ?? 0) + 1; return `\n\n\\section{${kids()}}\n`;
      case "h2": s.headings = (s.headings ?? 0) + 1; return `\n\n\\subsection{${kids()}}\n`;
      case "h3": s.headings = (s.headings ?? 0) + 1; return `\n\n\\subsubsection{${kids()}}\n`;
      case "h4": case "h5": case "h6": s.headings = (s.headings ?? 0) + 1; return `\n\n\\paragraph{${kids()}}\n`;
      case "p": {
        s.paragraphs = (s.paragraphs ?? 0) + 1;
        const text = kids().trim();
        return text ? `\n${text}\n` : "";
      }
      case "strong": case "b": return `\\textbf{${kids()}}`;
      case "em": case "i":    return `\\textit{${kids()}}`;
      case "u":               return `\\underline{${kids()}}`;
      case "s":               return `\\sout{${kids()}}`;
      case "sup": {
        const ref = el.querySelector('a[href^="#footnote-"], a[href^="#endnote-"]');
        const note = ref && notes.get(ref.getAttribute("href")!.slice(1));
        if (note) {
          s.footnotes = (s.footnotes ?? 0) + 1;
          return `\\footnote{${Array.from(note.childNodes).map(walk).join("").trim()}}`;
        }
        return `\\textsuperscript{${kids()}}`;
      }
      case "sub":             return `\\textsubscript{${kids()}}`;
      case "code":            return `\\texttt{${kids()}}`;
      case "pre":             return `\n\\begin{verbatim}\n${el.textContent ?? ""}\n\\end{verbatim}\n`;
      case "br":              return "\\\\\n";
      case "hr":              return "\n\\noindent\\rule{\\linewidth}{0.4pt}\n";
      case "ul": case "ol": {
        const items = kids();
        if (!items.includes("\\item")) return items; // an empty list does not compile
        s.lists = (s.lists ?? 0) + 1;
        const env = tag === "ul" ? "itemize" : "enumerate";
        return `\n\\begin{${env}}\n${items}\\end{${env}}\n`;
      }
      case "li":              return `  \\item ${kids().trim()}\n`;
      case "blockquote":      return `\n\\begin{quote}\n${kids().trim()}\n\\end{quote}\n`;
      case "a": {
        s.links = (s.links ?? 0) + 1;
        const href = el.getAttribute("href") ?? "";
        if (!href || href.startsWith("#")) return kids(); // internal anchors and backlinks
        return `\\href{${escUrl(href)}}{${kids()}}`;
      }
      case "img": {
        s.images = (s.images ?? 0) + 1;
        imgCounter++;
        const alt = el.getAttribute("alt") ?? "";
        const caption = alt || `Figure ${imgCounter}`;
        s.unresolvedImages = (s.unresolvedImages ?? 0) + 1;
        return (
          `\n\\begin{figure}[htbp]\n` +
          `  \\centering\n` +
          `  \\includegraphics[width=0.8\\textwidth]{figure-${imgCounter}}\n` +
          `  \\caption{${escTex(caption)}}\n` +
          `  \\label{fig:${imgCounter}}\n` +
          `\\end{figure}\n`
        );
      }
      case "table": {
        s.tables = (s.tables ?? 0) + 1;
        // Widest row, counting merged cells (colspan), sets the column count.
        const cols = Math.max(1, ...Array.from(el.querySelectorAll("tr")).map(r =>
          Array.from(r.querySelectorAll(":scope > td, :scope > th"))
            .reduce((n, c) => n + Math.max(1, Number(c.getAttribute("colspan")) || 1), 0)));
        tableCols = cols;
        const spec = Array(cols).fill("l").join(""); // booktabs: no vertical rules
        // Use booktabs style
        return (
          `\n\\begin{table}[htbp]\n  \\centering\n` +
          `  \\begin{tabular}{${spec}}\n    \\toprule\n` +
          `${kids()}` +
          `    \\bottomrule\n  \\end{tabular}\n` +
          `  \\caption{Table ${s.tables}}\n` +
          `\\end{table}\n`
        );
      }
      case "thead": return kids();
      case "tbody": return kids();
      case "tfoot": return kids();
      case "tr": {
        let width = 0;
        const cells = Array.from(el.querySelectorAll(":scope > td, :scope > th")).map(c => {
          const span = Math.max(1, Number(c.getAttribute("colspan")) || 1);
          width += span;
          const text = Array.from(c.childNodes).map(walk).join("").trim();
          return span > 1 ? `\\multicolumn{${span}}{l}{${text}}` : text;
        });
        while (width++ < tableCols) cells.push(""); // short rows still need every column
        // First row after toprule gets midrule
        const isHead = el.closest("thead") !== null || (el as HTMLTableRowElement).rowIndex === 0;
        return `    ${cells.join(" & ")} \\\\\n` + (isHead ? "    \\midrule\n" : "");
      }
      case "td": case "th": return kids();
      case "span": return kids();
      case "div": return kids();
      default: return kids();
    }
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  doc.querySelectorAll('li[id^="footnote-"], li[id^="endnote-"]').forEach(li => {
    li.querySelectorAll('a[href^="#footnote-ref-"], a[href^="#endnote-ref-"]').forEach(a => a.remove());
    notes.set(li.id, li.querySelector("p") ?? li);
    const list = li.parentElement;
    li.remove();
    if (list && !list.querySelector("li")) list.remove();
  });
  const body = Array.from(doc.body.childNodes).map(walk).join("");

  const packages = [
    "\\usepackage[utf8]{inputenc}",
    "\\usepackage[T1]{fontenc}",
    "\\usepackage{amsmath,amssymb}",
    "\\usepackage{hyperref}",
    "\\usepackage{graphicx}",
    "\\usepackage{booktabs}",
    // normalem: keep \emph as italics (plain ulem would underline it).
    ...(body.includes("\\sout")  ? ["\\usepackage[normalem]{ulem}"] : []),
    ...(s.images! > 0 ? ["\\usepackage{float}"] : []),
  ];

  const latex = [
    "\\documentclass[12pt,a4paper]{article}",
    ...packages,
    "",
    "\\begin{document}",
    "",
    body.trim(),
    "",
    "\\end{document}",
  ].join("\n");

  return { latex, stats: s };
}

// ── Score calculator ──────────────────────────────────────────────────────────
function calcScore(report: QualityReport): QualityReport["score"] {
  const issues = (report.equations > 0 ? 1 : 0) + (report.unresolvedImages > 0 ? 1 : 0);
  if (issues === 0) return "excellent";
  if (issues === 1) return "good";
  if (issues === 2) return "fair";
  return "needs-review";
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function WordToLatex() {
  const [status,   setStatus]   = useState<"idle" | "converting" | "done" | "error">("idle");
  const [result,   setResult]   = useState("");
  const [error,    setError]    = useState("");
  const [copied,   setCopied]   = useState(false);
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [report,   setReport]   = useState<QualityReport | null>(null);
  const [needSignIn, setNeedSignIn] = useState(false);
  const convert = useCallback(async (file: File) => {
    setFileName(file.name);
    setFileSize(file.size);
    setError(""); setResult(""); setWarnings([]); setReport(null);

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "docx";

    // Free, but needs an account (.odt/.rtf only show a pandoc command).
    if (ext === "docx") {
      const gate = await fetch("/api/word-conversion", { method: "POST" }).catch(() => null);
      if (gate?.status === 401) {
        setNeedSignIn(true);
        setStatus("idle");
        return;
      }
    }

    setStatus("converting");

    if (ext !== "docx") {
      const cmd = `pandoc "${file.name}" --from ${ext} --to latex --output output.tex --wrap=none`;
      setResult(
        `% ─────────────────────────────────────────────\n` +
        `% ${ext.toUpperCase()} → LaTeX\n%\n` +
        `% Run in terminal:\n%   ${cmd}\n%\n` +
        `% Or re-save as .docx in Word / LibreOffice.\n` +
        `% ─────────────────────────────────────────────\n`
      );
      setWarnings([`${ext.toUpperCase()} → re-save as .docx for automatic browser conversion.`]);
      setStatus("done");
      return;
    }

    try {
      const arrayBuffer = await file.arrayBuffer();

      // ── 1. Put OMML equations in place as placeholders (mammoth drops them)
      let equations: { latex: string; display: boolean }[] = [];
      let docBuffer: ArrayBuffer = arrayBuffer;
      try {
        const JSZip = (await import("jszip")).default;
        const zip = await JSZip.loadAsync(arrayBuffer);
        const docXml = await zip.file("word/document.xml")?.async("text");
        if (docXml) {
          const res = inlineOmmlEquations(docXml);
          if (res.equations.length) {
            equations = res.equations;
            zip.file("word/document.xml", res.xml);
            docBuffer = await zip.generateAsync({ type: "arraybuffer" });
          }
        }
      } catch { /* JSZip or XML parsing failed — continue without equations */ }
      const equationCount = equations.length;

      // ── 2. Convert via mammoth ──────────────────────────────────────────
      const mammoth = await import("mammoth");
      let imageIdx = 0;
      const imageMap: Record<string, string> = {};

      const { value: html, messages } = await mammoth.convertToHtml(
        { arrayBuffer: docBuffer },
        {
          convertImage: mammoth.images.imgElement(async (image) => {
            imageIdx++;
            const ext2 = image.contentType?.split("/")[1] ?? "png";
            imageMap[imageIdx] = `figure-${imageIdx}.${ext2}`;
            return { src: `__img_${imageIdx}` };
          }),
        }
      );

      const warns = messages
        .filter(m => m.type === "warning" || m.type === "error")
        .map(m => m.message)
        .slice(0, 8);

      // ── 3. Convert HTML → LaTeX ─────────────────────────────────────────
      const { latex, stats } = htmlToLatex(html);

      // ── 4. Build quality report ─────────────────────────────────────────
      const fullReport: QualityReport = {
        headings:  stats.headings ?? 0,
        paragraphs: stats.paragraphs ?? 0,
        tables:    stats.tables ?? 0,
        images:    stats.images ?? 0,
        equations: equationCount,
        footnotes: stats.footnotes ?? 0,
        lists:     stats.lists ?? 0,
        links:     stats.links ?? 0,
        unresolvedImages: stats.unresolvedImages ?? 0,
        score: "excellent",
      };
      fullReport.score = calcScore(fullReport);

      // ── 5. Swap placeholders back for the converted equations ──────────
      const finalLatex = latex.replace(/LTXCIEQ(\d+)Z/g, (_, i) => {
        const eq = equations[Number(i)];
        if (!eq) return "";
        if (!eq.display) return `$${eq.latex}$`;
        // A multi-line oMathPara cannot live in \[ \]: use gather* (amsmath).
        return eq.latex.includes(" \\\\ ")
          ? `\n\\begin{gather*}\n  ${eq.latex}\n\\end{gather*}\n`
          : `\n\\[\n  ${eq.latex}\n\\]\n`;
      });

      setResult(finalLatex);
      setWarnings(warns);
      setReport(fullReport);
      setStatus("done");
    } catch (err) {
      setError(String(err));
      setStatus("error");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: ACCEPTED, maxFiles: 1, maxSize: 20 * 1024 * 1024,
    onDrop: (accepted, rejected) => {
      if (rejected[0]) { setError(rejected[0].errors[0]?.message ?? "File rejected"); setStatus("error"); return; }
      if (accepted[0]) convert(accepted[0]);
    },
  });

  const copyLatex = () => {
    navigator.clipboard.writeText(result).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };

  const downloadLatex = () => {
    const blob = new Blob([result], { type: "text/plain" });
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(blob),
      download: fileName.replace(/\.(docx|odt|rtf)$/i, ".tex") || "output.tex",
    });
    a.click();
  };

  const reset = () => { setStatus("idle"); setResult(""); setError(""); setWarnings([]); setReport(null); setFileName(""); setFileSize(0); };
  const fmtSize = (b: number) => b < 1024 ? `${b} B` : b < 1024**2 ? `${(b/1024).toFixed(1)} KB` : `${(b/1024**2).toFixed(1)} MB`;

  const scoreLabel = { excellent: "excellent", good: "good", fair: "fair", "needs-review": "needs review" };
  const done = status === "done" && !!result;
  const lineCount = result.split("\n").length;

  const reportRows = report ? [
    { k: "Sections", v: report.headings, note: <>from Word heading styles, <code>\section</code> to <code>\paragraph</code></> },
    { k: "Paragraphs", v: report.paragraphs, note: <>plain text, special characters escaped</> },
    { k: "Tables", v: report.tables, note: <><code>tabular</code> with booktabs rules; check merged cells</> },
    { k: "Lists", v: report.lists, note: <><code>itemize</code> and <code>enumerate</code></> },
    { k: "Links", v: report.links, note: <><code>\href</code>, targets kept</> },
    { k: "Footnotes", v: report.footnotes, note: <><code>\footnote</code>, placed where the mark was</> },
    { k: "Images", v: report.images, todo: report.images > 0,
      note: <>to do: save each image next to the .tex as <code>figure-1</code>, <code>figure-2</code>, and so on</> },
    { k: "Equations (OMML)", v: report.equations, todo: report.equations > 0,
      note: <>to check: converted in place, best effort; verify the complex ones before compiling</> },
  ] : [];

  return (
    <div className="w2l">

      <div className={`w2l-top${done ? " is-compact" : ""}`}>
        {/* Drop zone */}
        <figure className="w2l-fig">
          <div {...getRootProps()} className={`tool-frame w2l-drop${isDragActive ? " is-active" : ""}${done ? " is-compact" : ""}`}>
            <input {...getInputProps()} />
            <svg width="34" height="42" viewBox="0 0 34 42" aria-hidden="true" className="w2l-icon">
              <path d="M2 1h20l10 10v30H2z" fill="none" stroke="currentColor" strokeWidth="1.4" />
              <path d="M22 1v10h10M8 20h18M8 26h18M8 32h12" fill="none" stroke="currentColor" strokeWidth="1.2" />
            </svg>
            {isDragActive ? (
              <p className="w2l-drop-main">Release to convert.</p>
            ) : done ? (
              <p className="w2l-drop-sub">Drop another .docx here, or click to choose one.</p>
            ) : (
              <div>
                <p className="w2l-drop-main">Drop a .docx file here, or click to choose one.</p>
                <p className="w2l-drop-sub">20 MB at most. A free Google sign-in is asked if you are not signed in yet.</p>
              </div>
            )}
          </div>
          {!done && (
            <figcaption className="tool-caption">
              <b>Figure 1.</b> Drop zone. The file is read by your browser and is never uploaded;
              .odt and .rtf files return the pandoc command to run.
            </figcaption>
          )}
        </figure>

        {status === "idle" && (
          <div className="w2l-fig">
            <h2 className="w2l-sr">What gets converted</h2>
            <div className="w2l-scroll">
              <table className="booktabs w2l-table">
                <thead>
                  <tr><th>Word feature</th><th>LaTeX output</th><th>Status</th></tr>
                </thead>
                <tbody>
                  <tr><td>Heading 1 to 3 styles</td><td><code>\section</code>, <code>\subsection</code>, <code>\subsubsection</code></td><td>supported</td></tr>
                  <tr><td>Bold, italic, underline</td><td><code>\textbf</code>, <code>\textit</code>, <code>\underline</code></td><td>supported</td></tr>
                  <tr><td>Bulleted and numbered lists</td><td><code>itemize</code>, <code>enumerate</code></td><td>supported</td></tr>
                  <tr><td>Tables</td><td><code>tabular</code> with booktabs rules</td><td>supported</td></tr>
                  <tr><td>Images</td><td><code>figure</code> with an <code>\includegraphics</code> placeholder</td><td>supported</td></tr>
                  <tr><td>Hyperlinks</td><td><code>\href</code></td><td>supported</td></tr>
                  <tr><td>Footnotes</td><td><code>\footnote</code></td><td>supported</td></tr>
                  <tr><td>Equations (equation editor, OMML)</td><td>inline <code>$…$</code> and display <code>\[…\]</code> math</td><td>supported, best effort</td></tr>
                  <tr><td>Columns, text boxes, complex layouts</td><td>none</td><td><i>not supported</i></td></tr>
                </tbody>
              </table>
            </div>
            <p className="tool-caption"><b>Table 1.</b> What gets converted, and into what.</p>
          </div>
        )}
      </div>

      {status === "idle" && (
        <p className="note">
          <b>Remark.</b> Privacy: your file is read entirely in your browser. Nothing is uploaded to any server;
          the sign-in only records that the converter was used.
        </p>
      )}

      {status === "converting" && (
        <p className="note" role="status"><b>Converting.</b> {fileName}…</p>
      )}

      {status === "error" && (
        <p className="note w2l-error" role="alert"><b>Conversion failed.</b> {error}</p>
      )}

      {done && (
        <p className="note" role="status">
          <b>Result.</b> {fileName} ({fmtSize(fileSize)}) converted to {lineCount} lines of LaTeX.
          {report && <> Overall assessment: {scoreLabel[report.score]}.</>}
        </p>
      )}

      {/* Quality report */}
      {report && (
        <div className="w2l-fig w2l-block">
          <div className="w2l-scroll">
            <table className="booktabs w2l-table">
              <thead>
                <tr><th>Item</th><th className="w2l-num">Count</th><th>Note</th></tr>
              </thead>
              <tbody>
                {reportRows.map((row) => (
                  <tr key={row.k}>
                    <td>{row.k}</td>
                    <td className="w2l-num">{row.v}</td>
                    <td className={row.todo ? "w2l-todo" : undefined}>{row.v > 0 ? row.note : <span className="w2l-muted">none found</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="tool-caption"><b>Table 1.</b> Conversion report: what was found in {fileName} and what needs a human look.</p>
        </div>
      )}

      {status === "done" && warnings.map((w, i) => (
        <p key={i} className="note"><b>Note.</b> {w}</p>
      ))}

      {/* Result */}
      {done && (
        <figure className="w2l-fig w2l-block">
          <div className="tool-frame">
            <div className="w2l-bar">
              <span className="w2l-file">{fileName.replace(/\.(docx|odt|rtf)$/i, ".tex") || "output.tex"}</span>
              <span className="w2l-actions">
                <button type="button" className="btn btn-sm" onClick={reset}>New file</button>
                <button type="button" className="btn btn-sm" onClick={copyLatex}>{copied ? "Copied" : "Copy LaTeX"}</button>
                <button type="button" className="btn btn-sm btn-primary" onClick={downloadLatex}>Download .tex</button>
              </span>
            </div>
            <div className="w2l-editor">
              <CodeMirror value={result} onChange={setResult} theme="none"
                height="60vh" style={{ fontSize: "12.5px" }}
                basicSetup={{ lineNumbers: true, highlightActiveLine: true }} />
            </div>
          </div>
          <figcaption className="tool-caption">
            <b>Figure 1.</b> The converted LaTeX source, {lineCount} lines. Edit it here before copying or downloading.
          </figcaption>
        </figure>
      )}

      {needSignIn && <SignInPrompt feature="Word to LaTeX" onClose={() => setNeedSignIn(false)} />}
    </div>
  );
}
