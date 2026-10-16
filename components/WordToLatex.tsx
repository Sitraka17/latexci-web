"use client";
import { useState, useCallback, useEffect } from "react";
import SignInPrompt from "@/components/SignInPrompt";
import GoogleSignIn from "@/components/GoogleSignIn";
import { docxToLatex } from "@/lib/word-latex";
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
  // Signed-out visitors sign in before choosing the file: after the Google
  // round trip the dropped file would be gone.
  const [signedOut, setSignedOut] = useState(false);
  // The first file is free without an account (cookie set by the API).
  const [freeUsed, setFreeUsed] = useState(false);
  const [anonDone, setAnonDone] = useState(false);
  useEffect(() => {
    let live = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFreeUsed(/(?:^|;\s*)lx_wf_used=1/.test(document.cookie));
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((me: { configured?: boolean; user?: unknown } | null) => {
        if (live && me?.configured && !me.user) setSignedOut(true);
      })
      .catch(() => {});
    return () => { live = false; };
  }, []);
  const convert = useCallback(async (file: File) => {
    setFileName(file.name);
    setFileSize(file.size);
    setError(""); setResult(""); setWarnings([]); setReport(null);

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "docx";

    // Free, but needs an account (.odt/.rtf only show a pandoc command).
    if (ext === "docx") {
      const gate = await fetch("/api/word-conversion", { method: "POST" }).catch(() => null);
      if (gate?.status === 401) {
        setFreeUsed(true);
        setNeedSignIn(true);
        setStatus("idle");
        return;
      }
      const verdict = gate?.ok ? await gate.json().catch(() => null) : null;
      if (verdict?.anonymous) { setFreeUsed(true); setAnonDone(true); }
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
      const [{ default: JSZip }, mammoth] = await Promise.all([import("jszip"), import("mammoth")]);
      // OMML equations are swapped for placeholders before mammoth (which
      // drops them), then the HTML is walked into LaTeX: see lib/word-latex.ts.
      const res = await docxToLatex(arrayBuffer, {
        loadZip: (data) => JSZip.loadAsync(data),
        toHtml: (data) => {
          let imageIdx = 0;
          return mammoth.convertToHtml(
            { arrayBuffer: data },
            { convertImage: mammoth.images.imgElement(async () => ({ src: `__img_${++imageIdx}` })) },
          );
        },
      });
      const stats = res.stats;
      const fullReport: QualityReport = {
        headings:  stats.headings,
        paragraphs: stats.paragraphs,
        tables:    stats.tables,
        images:    stats.images,
        equations: res.equations,
        footnotes: stats.footnotes,
        lists:     stats.lists,
        links:     stats.links,
        unresolvedImages: stats.unresolvedImages,
        score: "excellent",
      };
      fullReport.score = calcScore(fullReport);
      const finalLatex = res.latex;
      const warns = res.warnings;

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

  const openPreview = async () => {
    const LZString = (await import("lz-string")).default;
    window.open(`/tools/preview#s=${LZString.compressToEncodedURIComponent(result)}`, "_blank", "noopener");
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
          {signedOut && !done && (
            freeUsed ? (
              <div className="note" style={{ margin: "0 0 0.75rem" }}>
                <p style={{ margin: "0 0 0.5rem" }}>Your free conversion is used. Sign in once (free, no card), then drop your next .docx; the file never leaves your browser.</p>
                <GoogleSignIn next="/tools/word-to-latex" compact />
              </div>
            ) : (
              <p className="note" style={{ margin: "0 0 0.75rem" }}>
                No account needed for your first file. Further conversions ask for a free Google sign-in.
              </p>
            )
          )}
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
                <p className="w2l-drop-sub">20 MB at most. Your first file needs no account.</p>
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
                  <tr><td>Bold, italic, underline</td><td><code>\textbf</code>, <code>\emph</code>, <code>\underline</code></td><td>supported</td></tr>
                  <tr><td>Bulleted and numbered lists</td><td><code>itemize</code>, <code>enumerate</code></td><td>supported</td></tr>
                  <tr><td>Tables</td><td><code>tabular</code> with booktabs rules, <code>p{"{}"}</code> columns when a cell holds a list</td><td>supported</td></tr>
                  <tr><td>Images</td><td><code>figure</code> with an <code>\includegraphics</code> placeholder</td><td>supported</td></tr>
                  <tr><td>Hyperlinks</td><td><code>\href</code></td><td>supported</td></tr>
                  <tr><td>Footnotes</td><td><code>\footnote</code></td><td>supported</td></tr>
                  <tr><td>Equations (equation editor, OMML)</td><td>inline <code>$…$</code> and display <code>\[…\]</code> math</td><td>supported, best effort</td></tr>
                  <tr><td>MathType objects</td><td>an image placeholder at most (OLE objects, not math)</td><td><i>not supported</i></td></tr>
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

      {done && anonDone && signedOut && (
        <div className="note">
          <p style={{ margin: "0 0 0.5rem" }}>
            That was your free conversion. Sign in with Google (free, no card) to convert your next files; this
            result stays here while you download it.
          </p>
          <GoogleSignIn next="/tools/word-to-latex" compact />
        </div>
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
                <button type="button" className="btn btn-sm" onClick={openPreview}>Open in the live preview</button>
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
