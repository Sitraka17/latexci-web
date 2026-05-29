"use client";
import { useState, useCallback } from "react";
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

/** Extract all OMML equations from a docx XML string → LaTeX strings */
function extractOmmlEquations(xml: string): string[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "application/xml");
  const results: string[] = [];

  // Find both inline oMath and block oMathPara
  doc.querySelectorAll("m\\:oMath, oMath").forEach(el => {
    try {
      const latex = ommlNodeToLatex(el).trim();
      if (latex) results.push(latex);
    } catch { /* skip */ }
  });

  return results;
}

// ── HTML → LaTeX converter ────────────────────────────────────────────────────
let imgCounter = 0;

function htmlToLatex(html: string): { latex: string; stats: Partial<QualityReport> } {
  imgCounter = 0;
  const s: Partial<QualityReport> = {
    headings: 0, paragraphs: 0, tables: 0, images: 0,
    lists: 0, links: 0, footnotes: 0, unresolvedImages: 0,
  };

  const escTex = (text: string) =>
    text
      .replace(/\\/g, "\\textbackslash{}")
      .replace(/\{/g, "\\{").replace(/\}/g, "\\}")
      .replace(/\$/g, "\\$").replace(/&/g, "\\&")
      .replace(/%/g, "\\%").replace(/#/g, "\\#")
      .replace(/\^/g, "\\textasciicircum{}")
      .replace(/_/g, "\\_").replace(/~/g, "\\textasciitilde{}");

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
      case "p":
        s.paragraphs = (s.paragraphs ?? 0) + 1;
        return kids().trim() ? `\n${kids().trim()}\n` : "";
      case "strong": case "b": return `\\textbf{${kids()}}`;
      case "em": case "i":    return `\\textit{${kids()}}`;
      case "u":               return `\\underline{${kids()}}`;
      case "s":               return `\\sout{${kids()}}`;
      case "sup":             return `\\textsuperscript{${kids()}}`;
      case "sub":             return `\\textsubscript{${kids()}}`;
      case "code":            return `\\texttt{${kids()}}`;
      case "pre":             return `\n\\begin{verbatim}\n${el.textContent ?? ""}\n\\end{verbatim}\n`;
      case "br":              return "\\\\\n";
      case "hr":              return "\n\\noindent\\rule{\\linewidth}{0.4pt}\n";
      case "ul": s.lists = (s.lists ?? 0) + 1; return `\n\\begin{itemize}\n${kids()}\\end{itemize}\n`;
      case "ol": s.lists = (s.lists ?? 0) + 1; return `\n\\begin{enumerate}\n${kids()}\\end{enumerate}\n`;
      case "li":              return `  \\item ${kids().trim()}\n`;
      case "blockquote":      return `\n\\begin{quote}\n${kids().trim()}\n\\end{quote}\n`;
      case "a": {
        s.links = (s.links ?? 0) + 1;
        const href = el.getAttribute("href") ?? "";
        return href ? `\\href{${href}}{${kids()}}` : kids();
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
        // Count max columns from first row
        const firstRow = el.querySelector("tr");
        const cols = firstRow ? firstRow.querySelectorAll("td, th").length : 1;
        const spec = Array(cols).fill("l").join(" | ");
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
        const cells = Array.from(el.querySelectorAll(":scope > td, :scope > th"))
          .map(c => Array.from(c.childNodes).map(walk).join("").trim());
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
  const body = Array.from(doc.body.childNodes).map(walk).join("");

  const packages = [
    "\\usepackage[utf8]{inputenc}",
    "\\usepackage[T1]{fontenc}",
    "\\usepackage{amsmath,amssymb}",
    "\\usepackage{hyperref}",
    "\\usepackage{graphicx}",
    "\\usepackage{booktabs}",
    ...(body.includes("\\sout")  ? ["\\usepackage{ulem}"] : []),
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
  const issues = (report.equations > 0 ? 2 : 0) + (report.unresolvedImages > 0 ? 1 : 0);
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
  const [cmExtensions, setCmExtensions] = useState<unknown[]>([]);

  const loadCm = useCallback(() => {
    if (cmExtensions.length > 0) return;
    Promise.all([
      import("@codemirror/lang-markdown").then(m => m.markdown()),
      import("@uiw/codemirror-theme-vscode").then(m => m.vscodeDark),
    ]).then(exts => setCmExtensions(exts));
  }, [cmExtensions.length]);

  const convert = useCallback(async (file: File) => {
    setFileName(file.name);
    setFileSize(file.size);
    setStatus("converting");
    setError(""); setResult(""); setWarnings([]); setReport(null);
    loadCm();

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "docx";

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

      // ── 1. Extract OMML equations from raw docx XML ─────────────────────
      let equationCount = 0;
      let convertedEquations: string[] = [];
      try {
        const JSZip = (await import("jszip")).default;
        const zip = await JSZip.loadAsync(arrayBuffer);
        const docXml = await zip.file("word/document.xml")?.async("text");
        if (docXml) {
          convertedEquations = extractOmmlEquations(docXml);
          equationCount = convertedEquations.length;
        }
      } catch { /* JSZip or XML parsing failed — continue without equations */ }

      // ── 2. Convert via mammoth ──────────────────────────────────────────
      const mammoth = await import("mammoth");
      let imageIdx = 0;
      const imageMap: Record<string, string> = {};

      const { value: html, messages } = await mammoth.convertToHtml(
        { arrayBuffer },
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

      // ── 5. Append equation stubs if detected ───────────────────────────
      let finalLatex = latex;
      if (equationCount > 0 && convertedEquations.length > 0) {
        const eqBlock = [
          "",
          "% ─── EQUATIONS DETECTED ────────────────────────────────────────────",
          "% The following equations were found in your document.",
          "% They have been converted from OMML — please review and adjust:",
          ...convertedEquations.map((eq, i) => `% Eq ${i + 1}: ${eq}`),
          "% ────────────────────────────────────────────────────────────────────",
        ].join("\n");
        finalLatex = finalLatex.replace("\\end{document}", eqBlock + "\n\n\\end{document}");
      }

      setResult(finalLatex);
      setWarnings(warns);
      setReport(fullReport);
      setStatus("done");
    } catch (err) {
      setError(String(err));
      setStatus("error");
    }
  }, [loadCm]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: ACCEPTED, maxFiles: 1, maxSize: 20 * 1024 * 1024,
    onDrop: (accepted, rejected) => {
      if (rejected[0]) { setError(rejected[0].errors[0]?.message ?? "File rejected"); setStatus("error"); return; }
      if (accepted[0]) convert(accepted[0]);
    },
  });

  const copyLatex = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

  const scoreColor = { excellent: "#10b981", good: "#3b82f6", fair: "#f59e0b", "needs-review": "#ef4444" };
  const scoreLabel = { excellent: "Excellent", good: "Good", fair: "Fair", "needs-review": "Needs review" };

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "3rem 1.5rem" }}>

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
        <h1 style={{
          fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.03em",
          background: "linear-gradient(135deg, var(--accent), var(--accent2))",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: "0.5rem",
        }}>
          Word → LaTeX Converter
        </h1>
        <p style={{ color: "var(--fg-muted)", fontSize: "1rem", lineHeight: 1.65, maxWidth: 600, margin: "0 auto" }}>
          Upload a <code style={{ background: "var(--surface2)", padding: "0.1em 0.4em", borderRadius: 4 }}>.docx</code> and
          get clean LaTeX — with <strong>equation detection</strong>, image stubs, booktabs tables, and a quality report.
          Everything runs in your browser. Zero upload.
        </p>
      </div>

      {/* Drop zone */}
      <div {...getRootProps()} style={{
        border: `2px dashed ${isDragActive ? "var(--accent)" : "var(--border)"}`,
        borderRadius: 12, padding: "3rem 2rem", textAlign: "center", cursor: "pointer",
        background: isDragActive ? "color-mix(in srgb, var(--accent) 5%, transparent)" : "var(--surface)",
        transition: "all 0.2s", marginBottom: "1.5rem",
      }}>
        <input {...getInputProps()} />
        <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>📄</div>
        {isDragActive ? (
          <p style={{ color: "var(--accent)", fontWeight: 600, margin: 0 }}>Drop it!</p>
        ) : (
          <>
            <p style={{ color: "var(--fg)", fontWeight: 600, margin: "0 0 0.25rem" }}>Drag & drop a .docx file here</p>
            <p style={{ color: "var(--fg-muted)", fontSize: "0.88rem", margin: "0 0 0.5rem" }}>or click to browse · max 20 MB</p>
            <p style={{ color: "var(--fg-muted)", fontSize: "0.78rem", margin: 0, opacity: 0.7 }}>Supports headings · bold/italic · tables · images · footnotes · equations</p>
          </>
        )}
      </div>

      {status === "converting" && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "1rem 1.25rem", background: "color-mix(in srgb, var(--accent) 8%, transparent)", border: "1px solid var(--accent)", borderRadius: 8, marginBottom: "1.25rem" }}>
          <div style={{ width: 16, height: 16, border: "2px solid var(--accent)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", flexShrink: 0 }} />
          <span style={{ color: "var(--accent)" }}>Converting <strong>{fileName}</strong>…</span>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {status === "error" && (
        <div style={{ padding: "1rem 1.25rem", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.4)", borderRadius: 8, marginBottom: "1.25rem", color: "#f87171" }}>
          <strong>Conversion failed.</strong> {error}
        </div>
      )}

      {warnings.length > 0 && status === "done" && (
        <div style={{ padding: "0.75rem 1rem", background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.3)", borderRadius: 8, marginBottom: "1rem", fontSize: "0.82rem", color: "#ca8a04" }}>
          <strong>⚠ Conversion notes:</strong>
          <ul style={{ margin: "0.35rem 0 0", paddingLeft: "1.25rem" }}>
            {warnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      )}

      {/* Quality report */}
      {report && (
        <div style={{ marginBottom: "1.25rem", padding: "1rem 1.25rem", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
            <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--fg-muted)", letterSpacing: "0.05em" }}>CONVERSION REPORT</span>
            <span style={{
              fontSize: "0.75rem", fontWeight: 700, padding: "0.15rem 0.6rem", borderRadius: 12,
              background: `${scoreColor[report.score]}18`,
              color: scoreColor[report.score], border: `1px solid ${scoreColor[report.score]}40`,
            }}>
              {scoreLabel[report.score]}
            </span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.65rem" }}>
            {[
              { k: "Sections", v: report.headings, ok: true },
              { k: "Paragraphs", v: report.paragraphs, ok: true },
              { k: "Tables", v: report.tables, ok: true },
              { k: "Lists", v: report.lists, ok: true },
              { k: "Links", v: report.links, ok: true },
              { k: "Images", v: report.images, ok: report.images === 0, warn: report.images > 0,
                note: report.images > 0 ? "→ replace \\includegraphics{figure-N} placeholders with your files" : undefined },
              { k: "Equations (OMML)", v: report.equations, ok: report.equations === 0, warn: report.equations > 0,
                note: report.equations > 0 ? "→ check equation stubs at bottom of file" : undefined },
            ].map(item => (
              <div key={item.k} title={item.note} style={{
                padding: "0.3rem 0.7rem", borderRadius: 6, fontSize: "0.78rem",
                background: item.warn ? "rgba(245,158,11,0.08)" : "var(--surface2)",
                border: `1px solid ${item.warn ? "rgba(245,158,11,0.3)" : "var(--border)"}`,
                color: item.warn ? "#ca8a04" : "var(--fg-muted)",
                cursor: item.note ? "help" : "default",
              }}>
                {item.warn ? "⚠ " : item.v > 0 ? "✓ " : ""}{item.k}: <strong>{item.v}</strong>
              </div>
            ))}
          </div>
          {report.equations > 0 && (
            <p style={{ margin: "0.6rem 0 0", fontSize: "0.8rem", color: "#ca8a04" }}>
              ⚠ <strong>{report.equations} equation{report.equations > 1 ? "s" : ""}</strong> detected and converted (OMML→LaTeX, best-effort). Review the stubs at the bottom of the file.
            </p>
          )}
          {report.images > 0 && (
            <p style={{ margin: "0.4rem 0 0", fontSize: "0.8rem", color: "var(--fg-muted)" }}>
              📎 Images have been replaced with <code style={{ background: "var(--surface2)", padding: "0 0.3em", borderRadius: 3 }}>\\includegraphics</code> placeholders.
              Save your images separately and rename them <code style={{ background: "var(--surface2)", padding: "0 0.3em", borderRadius: 3 }}>figure-1.png</code>, <code style={{ background: "var(--surface2)", padding: "0 0.3em", borderRadius: 3 }}>figure-2.png</code>, etc.
            </p>
          )}
        </div>
      )}

      {/* Result */}
      {status === "done" && result && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", marginBottom: "0.6rem", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ color: "var(--green)", fontWeight: 600, fontSize: "0.9rem" }}>✓ {fileName} converted</span>
              <span style={{ fontSize: "0.75rem", color: "var(--fg-muted)", display: "block" }}>
                {fmtSize(fileSize)} → {result.split("\n").length} lines · edit before downloading
              </span>
            </div>
            <button onClick={reset} style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 6, color: "var(--fg-muted)", fontSize: "0.8rem", padding: "0.3rem 0.75rem", cursor: "pointer" }}>↑ New file</button>
            <button onClick={copyLatex} style={{ background: copied ? "rgba(16,185,129,0.12)" : "var(--surface2)", border: `1px solid ${copied ? "var(--green)" : "var(--border)"}`, borderRadius: 6, color: copied ? "var(--green)" : "var(--fg-muted)", fontSize: "0.8rem", padding: "0.3rem 0.8rem", cursor: "pointer" }}>
              {copied ? "✓ Copied!" : "Copy LaTeX"}
            </button>
            <button onClick={downloadLatex} style={{ background: "var(--accent)", border: "none", borderRadius: 6, color: "#fff", fontSize: "0.8rem", padding: "0.3rem 0.8rem", cursor: "pointer", fontWeight: 600 }}>↓ Download .tex</button>
          </div>
          <div style={{ border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
            {cmExtensions.length > 0 ? (
              <CodeMirror value={result} onChange={setResult}
                extensions={cmExtensions as import("@uiw/react-codemirror").ReactCodeMirrorProps["extensions"]}
                height="60vh" style={{ fontSize: "12.5px" }}
                basicSetup={{ lineNumbers: true, highlightActiveLine: true }} />
            ) : (
              <textarea value={result} onChange={e => setResult(e.target.value)} style={{
                width: "100%", height: "60vh", background: "var(--surface)", color: "var(--fg)",
                border: "none", outline: "none", padding: "1rem",
                fontFamily: "JetBrains Mono, monospace", fontSize: "12.5px",
                lineHeight: 1.65, resize: "none",
              }} />
            )}
          </div>
        </div>
      )}

      {status === "idle" && (
        <div style={{ marginTop: "1.5rem", padding: "1.25rem 1.5rem", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10 }}>
          <h3 style={{ margin: "0 0 0.75rem", fontSize: "0.92rem", fontWeight: 600 }}>What gets converted</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem 2rem", fontSize: "0.84rem", color: "var(--fg-muted)" }}>
            {[
              ["✓", "Headings → \\section, \\subsection"],
              ["✓", "Bold, italic, underline"],
              ["✓", "Tables → booktabs \\begin{tabular}"],
              ["✓", "Lists → itemize / enumerate"],
              ["✓", "Images → \\includegraphics stubs"],
              ["✓", "Links → \\href"],
              ["✓", "Equations (OMML) → LaTeX math stubs"],
              ["✗", "Complex layouts (columns, text boxes)"],
            ].map(([icon, text], i) => (
              <div key={i} style={{ display: "flex", gap: "0.4rem" }}>
                <span style={{ color: icon === "✓" ? "var(--green)" : "var(--fg-muted)", opacity: icon === "✗" ? 0.5 : 1 }}>{icon}</span>
                <span>{text}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: "1rem", padding: "0.65rem 0.9rem", background: "var(--surface2)", borderRadius: 7, fontSize: "0.8rem", color: "var(--fg-muted)", lineHeight: 1.7 }}>
            <strong>Privacy:</strong> Your file is read entirely in your browser. Nothing is uploaded to any server.
          </div>
        </div>
      )}
    </div>
  );
}
