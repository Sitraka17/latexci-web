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

export default function WordToLatex() {
  const [status, setStatus] = useState<"idle" | "converting" | "done" | "error">("idle");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [fileName, setFileName] = useState("");
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
    setStatus("converting");
    setError("");
    setResult("");
    loadCm();

    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/word-to-latex", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Conversion failed");
      setResult(data.latex);
      setStatus("done");
    } catch (e: unknown) {
      setError((e as Error).message);
      setStatus("error");
    }
  }, [loadCm]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: ACCEPTED,
    maxFiles: 1,
    onDrop: accepted => { if (accepted[0]) convert(accepted[0]); },
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
      download: fileName.replace(/\.(docx|odt|rtf)$/, ".tex") || "output.tex",
    });
    a.click();
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "3rem 1.5rem" }}>
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
          Upload a <code style={{ background: "var(--surface2)", padding: "0.1em 0.4em", borderRadius: 4 }}>.docx</code>,{" "}
          <code style={{ background: "var(--surface2)", padding: "0.1em 0.4em", borderRadius: 4 }}>.odt</code>, or{" "}
          <code style={{ background: "var(--surface2)", padding: "0.1em 0.4em", borderRadius: 4 }}>.rtf</code>{" "}
          and get clean LaTeX source. Powered by{" "}
          <a href="https://pandoc.org" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)" }}>pandoc</a>.
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
        {isDragActive
          ? <p style={{ color: "var(--accent)", fontWeight: 600, margin: 0 }}>Drop it!</p>
          : <>
            <p style={{ color: "var(--fg)", fontWeight: 600, margin: "0 0 0.25rem" }}>Drag & drop a .docx / .odt / .rtf file</p>
            <p style={{ color: "var(--fg-muted)", fontSize: "0.88rem", margin: 0 }}>or click to browse · max 10 MB</p>
          </>
        }
      </div>

      {/* Converting */}
      {status === "converting" && (
        <div style={{
          display: "flex", alignItems: "center", gap: "0.75rem",
          padding: "1rem 1.25rem", background: "rgba(108,99,255,0.08)",
          border: "1px solid var(--accent)", borderRadius: 8, marginBottom: "1.25rem",
        }}>
          <div style={{
            width: 16, height: 16, border: "2px solid var(--accent)", borderTopColor: "transparent",
            borderRadius: "50%", animation: "spin 0.8s linear infinite",
          }} />
          <span style={{ color: "var(--accent)" }}>Converting <strong>{fileName}</strong>…</span>
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
          <p style={{ marginTop: "0.5rem", marginBottom: 0, fontSize: "0.82rem", color: "var(--fg-muted)" }}>
            To use this tool locally, install pandoc: <code>brew install pandoc</code>
          </p>
        </div>
      )}

      {/* Result — editable CodeMirror */}
      {status === "done" && result && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.6rem", flexWrap: "wrap" }}>
            <span style={{ color: "var(--green)", fontWeight: 600, fontSize: "0.9rem" }}>✓ Converted — edit before downloading</span>
            <div style={{ flex: 1 }} />
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
            }}>↓ Download .tex</button>
          </div>

          {/* Editable result */}
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
                  lineHeight: 1.65, resize: "none",
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* How it works */}
      {status === "idle" && (
        <div style={{
          marginTop: "1.5rem", padding: "1.25rem 1.5rem", background: "var(--surface)",
          border: "1px solid var(--border)", borderRadius: 10,
        }}>
          <h3 style={{ margin: "0 0 0.75rem", fontSize: "0.92rem", fontWeight: 600 }}>How it works</h3>
          <ol style={{ margin: 0, paddingLeft: "1.25rem", fontSize: "0.85rem", color: "var(--fg-muted)", lineHeight: 2 }}>
            <li>Upload your Word/ODT/RTF file — it is sent to our server</li>
            <li>pandoc converts it to LaTeX and the file is immediately deleted</li>
            <li>Edit the result inline to fix any conversion artifacts</li>
            <li>Download the <code>.tex</code> file — ready to compile with <code>latexci build</code></li>
          </ol>
        </div>
      )}
    </div>
  );
}
