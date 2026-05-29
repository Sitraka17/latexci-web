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

// ── HTML → LaTeX converter (runs in browser after mammoth gives us HTML) ──────
function htmlToLatex(html: string): string {
  const escTex = (text: string) =>
    text
      .replace(/\\/g, "\\textbackslash{}")
      .replace(/\{/g, "\\{")
      .replace(/\}/g, "\\}")
      .replace(/\$/g, "\\$")
      .replace(/&/g, "\\&")
      .replace(/%/g, "\\%")
      .replace(/#/g, "\\#")
      .replace(/\^/g, "\\textasciicircum{}")
      .replace(/_/g, "\\_")
      .replace(/~/g, "\\textasciitilde{}");

  function walk(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) return escTex(node.textContent ?? "");
    if (node.nodeType !== Node.ELEMENT_NODE) return "";
    const el = node as Element;
    const tag = el.tagName.toLowerCase();
    const kids = Array.from(el.childNodes).map(walk).join("");

    switch (tag) {
      case "h1": return `\n\n\\section{${kids}}\n`;
      case "h2": return `\n\n\\subsection{${kids}}\n`;
      case "h3": return `\n\n\\subsubsection{${kids}}\n`;
      case "h4": case "h5": case "h6": return `\n\n\\paragraph{${kids}}\n`;
      case "p":  return kids.trim() ? `\n${kids.trim()}\n` : "";
      case "strong": case "b": return `\\textbf{${kids}}`;
      case "em":    case "i": return `\\textit{${kids}}`;
      case "u": return `\\underline{${kids}}`;
      case "s": return `\\sout{${kids}}`;
      case "code": return `\\texttt{${kids}}`;
      case "pre": return `\n\\begin{verbatim}\n${el.textContent ?? ""}\n\\end{verbatim}\n`;
      case "br": return "\\\\\n";
      case "hr": return "\n\\noindent\\rule{\\linewidth}{0.4pt}\n";
      case "ul": return `\n\\begin{itemize}\n${kids}\\end{itemize}\n`;
      case "ol": return `\n\\begin{enumerate}\n${kids}\\end{enumerate}\n`;
      case "li": return `  \\item ${kids.trim()}\n`;
      case "blockquote": return `\n\\begin{quote}\n${kids.trim()}\n\\end{quote}\n`;
      case "a": {
        const href = el.getAttribute("href") ?? "";
        return href ? `\\href{${href}}{${kids}}` : kids;
      }
      case "table": {
        const firstRow = el.querySelector("tr");
        const cols = firstRow ? firstRow.querySelectorAll("td, th").length : 1;
        const spec = Array(cols).fill("l").join(" | ");
        return `\n\\begin{tabular}{| ${spec} |}\n\\hline\n${kids}\\end{tabular}\n`;
      }
      case "thead": case "tbody": case "tfoot": return kids;
      case "tr": {
        const cells = Array.from(el.querySelectorAll(":scope > td, :scope > th"))
          .map(c => Array.from(c.childNodes).map(walk).join("").trim());
        return cells.join(" & ") + " \\\\\n\\hline\n";
      }
      case "td": case "th": return kids;
      default: return kids;
    }
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const body = Array.from(doc.body.childNodes).map(walk).join("");

  return [
    "\\documentclass{article}",
    "\\usepackage[utf8]{inputenc}",
    "\\usepackage[T1]{fontenc}",
    "\\usepackage{hyperref}",
    "\\usepackage{ulem}      % for \\sout (strikethrough)",
    "",
    "\\begin{document}",
    "",
    body.trim(),
    "",
    "\\end{document}",
  ].join("\n");
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function WordToLatex() {
  const [status, setStatus] = useState<"idle" | "converting" | "done" | "error">("idle");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [warnings, setWarnings] = useState<string[]>([]);
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
    setError("");
    setResult("");
    setWarnings([]);
    loadCm();

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "docx";

    if (ext === "docx") {
      try {
        // mammoth is a large lib — load it lazily
        const mammoth = await import("mammoth");
        const arrayBuffer = await file.arrayBuffer();
        const { value: html, messages } = await mammoth.convertToHtml({ arrayBuffer });

        // Collect warnings (skip info-level)
        const warns = messages
          .filter(m => m.type === "warning" || m.type === "error")
          .map(m => m.message);
        setWarnings(warns);

        const latex = htmlToLatex(html);
        setResult(latex);
        setStatus("done");
      } catch (err) {
        setError(String(err));
        setStatus("error");
      }
      return;
    }

    // .odt / .rtf — can't run pandoc in the browser, show instructions + blank editor
    const localCommand = `pandoc "${file.name}" --from ${ext} --to latex --output output.tex --wrap=none`;
    setResult(
      `% ─────────────────────────────────────────────────────────────────\n` +
      `% ${ext.toUpperCase()} → LaTeX  (server-side conversion not available)\n` +
      `%\n` +
      `% Run this in your terminal to convert locally:\n` +
      `%\n` +
      `%   ${localCommand}\n` +
      `%\n` +
      `% Install pandoc: https://pandoc.org/installing.html\n` +
      `% ─────────────────────────────────────────────────────────────────\n` +
      `%\n` +
      `% Alternatively, save your file as .docx in Word / LibreOffice\n` +
      `% and re-upload — .docx is converted automatically in the browser.\n`
    );
    setWarnings([`${ext.toUpperCase()} files require pandoc. Re-save as .docx for automatic conversion.`]);
    setStatus("done");
  }, [loadCm]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: ACCEPTED,
    maxFiles: 1,
    maxSize: 20 * 1024 * 1024, // 20 MB
    onDrop: (accepted, rejected) => {
      if (rejected[0]) {
        setError(rejected[0].errors[0]?.message ?? "File rejected");
        setStatus("error");
        return;
      }
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

  const reset = () => {
    setStatus("idle");
    setResult("");
    setError("");
    setWarnings([]);
    setFileName("");
    setFileSize(0);
  };

  const fmtSize = (bytes: number) =>
    bytes < 1024 ? `${bytes} B`
    : bytes < 1024 ** 2 ? `${(bytes / 1024).toFixed(1)} KB`
    : `${(bytes / 1024 ** 2).toFixed(1)} MB`;

  return (
    <div style={{ maxWidth: 920, margin: "0 auto", padding: "3rem 1.5rem" }}>

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
        <h1 style={{
          fontSize: "2rem", fontWeight: 800,
          background: "linear-gradient(135deg, var(--accent), var(--accent2))",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          marginBottom: "0.5rem",
        }}>
          Word → LaTeX Converter
        </h1>
        <p style={{ color: "var(--fg-muted)", fontSize: "1rem", lineHeight: 1.6 }}>
          Upload a{" "}
          <code style={{ background: "var(--surface2)", padding: "0.1em 0.4em", borderRadius: 4 }}>.docx</code>{" "}
          and get clean LaTeX source — converted right in your browser using{" "}
          <a href="https://github.com/mwilliamson/mammoth.js" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)" }}>mammoth.js</a>.{" "}
          No file is sent to any server.
        </p>
      </div>

      {/* Drop zone */}
      <div {...getRootProps()} style={{
        border: `2px dashed ${isDragActive ? "var(--accent)" : "var(--border)"}`,
        borderRadius: 12, padding: "3rem 2rem", textAlign: "center", cursor: "pointer",
        background: isDragActive ? "rgba(108,99,255,0.05)" : "var(--surface)",
        transition: "all 0.2s", marginBottom: "1.5rem",
      }}>
        <input {...getInputProps()} />
        <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>📄</div>
        {isDragActive ? (
          <p style={{ color: "var(--accent)", fontWeight: 600, margin: 0 }}>Drop it!</p>
        ) : (
          <>
            <p style={{ color: "var(--fg)", fontWeight: 600, margin: "0 0 0.25rem" }}>
              Drag & drop a .docx file here
            </p>
            <p style={{ color: "var(--fg-muted)", fontSize: "0.88rem", margin: "0 0 0.5rem" }}>
              or click to browse · max 20 MB
            </p>
            <p style={{ color: "var(--fg-muted)", fontSize: "0.78rem", margin: 0, opacity: 0.7 }}>
              .odt and .rtf are accepted but require local pandoc to convert
            </p>
          </>
        )}
      </div>

      {/* Converting spinner */}
      {status === "converting" && (
        <div style={{
          display: "flex", alignItems: "center", gap: "0.75rem",
          padding: "1rem 1.25rem", background: "rgba(108,99,255,0.08)",
          border: "1px solid var(--accent)", borderRadius: 8, marginBottom: "1.25rem",
        }}>
          <div style={{
            width: 16, height: 16, border: "2px solid var(--accent)", borderTopColor: "transparent",
            borderRadius: "50%", animation: "spin 0.8s linear infinite", flexShrink: 0,
          }} />
          <span style={{ color: "var(--accent)" }}>
            Converting <strong>{fileName}</strong>…
          </span>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {/* Error */}
      {status === "error" && (
        <div style={{
          padding: "1rem 1.25rem", background: "rgba(239,68,68,0.08)",
          border: "1px solid rgba(239,68,68,0.4)", borderRadius: 8,
          marginBottom: "1.25rem", color: "#f87171",
        }}>
          <strong>Conversion failed.</strong> {error}
        </div>
      )}

      {/* Mammoth warnings */}
      {warnings.length > 0 && status === "done" && (
        <div style={{
          padding: "0.75rem 1rem", background: "rgba(234,179,8,0.08)",
          border: "1px solid rgba(234,179,8,0.3)", borderRadius: 8,
          marginBottom: "1rem", fontSize: "0.82rem", color: "#ca8a04",
        }}>
          <strong>⚠ Conversion notes:</strong>
          <ul style={{ margin: "0.35rem 0 0", paddingLeft: "1.25rem" }}>
            {warnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      )}

      {/* Result */}
      {status === "done" && result && (
        <div>
          {/* Toolbar row */}
          <div style={{
            display: "flex", alignItems: "center", gap: "0.65rem",
            marginBottom: "0.6rem", flexWrap: "wrap",
          }}>
            <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
              <span style={{ color: "var(--green)", fontWeight: 600, fontSize: "0.9rem" }}>
                ✓ {fileName} converted
              </span>
              <span style={{ fontSize: "0.75rem", color: "var(--fg-muted)" }}>
                {fmtSize(fileSize)} → {result.split("\n").length} lines of LaTeX · edit before downloading
              </span>
            </div>

            <button onClick={reset} style={{
              background: "var(--surface2)", border: "1px solid var(--border)",
              borderRadius: 6, color: "var(--fg-muted)", fontSize: "0.8rem",
              padding: "0.3rem 0.75rem", cursor: "pointer",
            }}>
              ↑ New file
            </button>
            <button onClick={copyLatex} style={{
              background: copied ? "rgba(16,185,129,0.12)" : "var(--surface2)",
              border: `1px solid ${copied ? "var(--green)" : "var(--border)"}`,
              borderRadius: 6, color: copied ? "var(--green)" : "var(--fg-muted)",
              fontSize: "0.8rem", padding: "0.3rem 0.8rem", cursor: "pointer",
            }}>
              {copied ? "✓ Copied!" : "Copy LaTeX"}
            </button>
            <button onClick={downloadLatex} style={{
              background: "var(--accent)", border: "none", borderRadius: 6,
              color: "#fff", fontSize: "0.8rem", padding: "0.3rem 0.8rem",
              cursor: "pointer", fontWeight: 600,
            }}>
              ↓ Download .tex
            </button>
          </div>

          {/* Editable CodeMirror */}
          <div style={{ border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
            {cmExtensions.length > 0 ? (
              <CodeMirror
                value={result}
                onChange={setResult}
                extensions={cmExtensions as import("@uiw/react-codemirror").ReactCodeMirrorProps["extensions"]}
                height="60vh"
                style={{ fontSize: "12.5px" }}
                basicSetup={{ lineNumbers: true, highlightActiveLine: true }}
              />
            ) : (
              <textarea
                value={result}
                onChange={e => setResult(e.target.value)}
                style={{
                  width: "100%", height: "60vh", background: "var(--surface)", color: "var(--fg)",
                  border: "none", outline: "none", padding: "1rem",
                  fontFamily: "JetBrains Mono, monospace", fontSize: "12.5px",
                  lineHeight: 1.65, resize: "none", boxSizing: "border-box",
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* How it works — only shown when idle */}
      {status === "idle" && (
        <div style={{
          marginTop: "1.5rem", padding: "1.25rem 1.5rem", background: "var(--surface)",
          border: "1px solid var(--border)", borderRadius: 10,
        }}>
          <h3 style={{ margin: "0 0 0.75rem", fontSize: "0.92rem", fontWeight: 600 }}>How it works</h3>
          <ol style={{ margin: 0, paddingLeft: "1.25rem", fontSize: "0.85rem", color: "var(--fg-muted)", lineHeight: 2.1 }}>
            <li>Upload a <strong>.docx</strong> file — it is read <em>entirely in your browser</em>, nothing is uploaded.</li>
            <li>
              <a href="https://github.com/mwilliamson/mammoth.js" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)" }}>mammoth.js</a>{" "}
              extracts the document structure (headings, bold, tables, lists, links…) and converts it to LaTeX.
            </li>
            <li>Edit the result inline to fix conversion artifacts or add math.</li>
            <li>Download the <code style={{ background: "var(--surface2)", padding: "0 0.3em", borderRadius: 3 }}>.tex</code> file and compile it with any LaTeX engine.</li>
          </ol>
          <div style={{
            marginTop: "1rem", padding: "0.65rem 0.9rem",
            background: "var(--surface2)", borderRadius: 7,
            fontSize: "0.8rem", color: "var(--fg-muted)", lineHeight: 1.7,
          }}>
            <strong>Tip:</strong> Math formulas in Word are not preserved — you&apos;ll need to re-enter them as LaTeX math.
            Complex layouts (multi-column, text boxes) may need manual cleanup.
          </div>
        </div>
      )}
    </div>
  );
}
