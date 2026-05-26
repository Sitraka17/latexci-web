"use client";
import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";

export default function WordToLatex() {
  const [status, setStatus] = useState<"idle" | "converting" | "done" | "error">("idle");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [fileName, setFileName] = useState("");

  const convert = useCallback(async (file: File) => {
    setFileName(file.name);
    setStatus("converting");
    setError("");
    setResult("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/word-to-latex", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Conversion failed");
      }
      const data = await res.json();
      setResult(data.latex);
      setStatus("done");
    } catch (e: unknown) {
      setError((e as Error).message);
      setStatus("error");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
    maxFiles: 1,
    onDrop: (accepted) => {
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
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName.replace(/\.docx$/, ".tex") || "output.tex";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "3rem 1.5rem" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
        <h1
          style={{
            fontSize: "2rem",
            fontWeight: 800,
            background: "linear-gradient(135deg, var(--accent), var(--accent2))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            marginBottom: "0.5rem",
          }}
        >
          Word → LaTeX
        </h1>
        <p style={{ color: "var(--fg-muted)", fontSize: "1rem" }}>
          Upload a <code style={{ background: "var(--surface2)", padding: "0.1em 0.4em", borderRadius: 4 }}>.docx</code> file
          and get clean LaTeX source. Powered by{" "}
          <a href="https://pandoc.org" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)" }}>
            pandoc
          </a>{" "}
          on the server.
        </p>
      </div>

      {/* Drop zone */}
      <div
        {...getRootProps()}
        style={{
          border: `2px dashed ${isDragActive ? "var(--accent)" : "var(--border)"}`,
          borderRadius: 12,
          padding: "3rem 2rem",
          textAlign: "center",
          cursor: "pointer",
          background: isDragActive ? "rgba(108,99,255,0.05)" : "var(--surface)",
          transition: "all 0.2s",
          marginBottom: "2rem",
        }}
      >
        <input {...getInputProps()} />
        <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>📄</div>
        {isDragActive ? (
          <p style={{ color: "var(--accent)", fontWeight: 600 }}>Drop it here!</p>
        ) : (
          <>
            <p style={{ color: "var(--fg)", fontWeight: 600, marginBottom: "0.25rem" }}>
              Drag & drop a .docx file
            </p>
            <p style={{ color: "var(--fg-muted)", fontSize: "0.9rem" }}>
              or click to browse
            </p>
          </>
        )}
      </div>

      {/* Status */}
      {status === "converting" && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            padding: "1rem 1.25rem",
            background: "rgba(108,99,255,0.1)",
            border: "1px solid var(--accent)",
            borderRadius: 8,
            marginBottom: "1.5rem",
          }}
        >
          <div
            style={{
              width: 16,
              height: 16,
              border: "2px solid var(--accent)",
              borderTopColor: "transparent",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <span style={{ color: "var(--accent)" }}>Converting {fileName}…</span>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {status === "error" && (
        <div
          style={{
            padding: "1rem 1.25rem",
            background: "rgba(239,68,68,0.1)",
            border: "1px solid var(--red)",
            borderRadius: 8,
            marginBottom: "1.5rem",
            color: "#f87171",
          }}
        >
          <strong>Error:</strong> {error}
          <p style={{ marginTop: "0.5rem", fontSize: "0.85rem", color: "var(--fg-muted)" }}>
            Make sure pandoc is installed on the server. On Vercel, this requires a custom build step.
            Locally, install with: <code>brew install pandoc</code>
          </p>
        </div>
      )}

      {/* Result */}
      {status === "done" && result && (
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              marginBottom: "0.75rem",
            }}
          >
            <span style={{ color: "var(--green)", fontWeight: 600 }}>✓ Converted successfully</span>
            <div style={{ flex: 1 }} />
            <button
              onClick={copyLatex}
              style={{
                background: copied ? "rgba(16,185,129,0.15)" : "var(--surface2)",
                border: `1px solid ${copied ? "var(--green)" : "var(--border)"}`,
                borderRadius: 6,
                color: copied ? "var(--green)" : "var(--fg-muted)",
                fontSize: "0.8rem",
                padding: "0.3rem 0.8rem",
                cursor: "pointer",
              }}
            >
              {copied ? "✓ Copied!" : "Copy LaTeX"}
            </button>
            <button
              onClick={downloadLatex}
              style={{
                background: "var(--accent)",
                border: "none",
                borderRadius: 6,
                color: "#fff",
                fontSize: "0.8rem",
                padding: "0.3rem 0.8rem",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              ↓ Download .tex
            </button>
          </div>
          <pre
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              padding: "1.25rem",
              overflowX: "auto",
              fontFamily: "JetBrains Mono, monospace",
              fontSize: "12.5px",
              lineHeight: 1.65,
              color: "var(--fg)",
              maxHeight: "60vh",
              overflowY: "auto",
            }}
          >
            <code>{result}</code>
          </pre>
        </div>
      )}

      {/* How it works */}
      <div
        style={{
          marginTop: "3rem",
          padding: "1.5rem",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 10,
        }}
      >
        <h3 style={{ marginTop: 0, marginBottom: "0.75rem", fontSize: "0.95rem", fontWeight: 600 }}>
          How it works
        </h3>
        <ol style={{ margin: 0, paddingLeft: "1.25rem", fontSize: "0.88rem", color: "var(--fg-muted)", lineHeight: 2 }}>
          <li>Your .docx is sent to the server API route (<code>/api/word-to-latex</code>)</li>
          <li>pandoc converts it: <code>pandoc input.docx --to latex -o output.tex</code></li>
          <li>The generated LaTeX is returned and displayed here</li>
          <li>Download or copy the result — ready to use with <code>latexci build</code></li>
        </ol>
      </div>
    </div>
  );
}
