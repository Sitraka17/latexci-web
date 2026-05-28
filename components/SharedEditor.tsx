"use client";
import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { latexToHtml, ParseWarning } from "@/lib/latex-parser";

const CodeMirror = dynamic(() => import("@uiw/react-codemirror"), { ssr: false });

type Props = {
  initialContent: string;
  title: string;
  readOnly: boolean;
};

export default function SharedEditor({ initialContent, title, readOnly }: Props) {
  const [source, setSource] = useState(initialContent);
  const [activeTab, setActiveTab] = useState<"edit" | "preview">(readOnly ? "preview" : "edit");

  const { html, warnings } = useMemo(() => latexToHtml(source), [source]);

  const tabBtn = (tab: "edit" | "preview") => ({
    padding: "0.25rem 0.75rem",
    borderRadius: 6,
    border: "none",
    cursor: readOnly && tab === "edit" ? "not-allowed" : "pointer",
    fontWeight: 600,
    fontSize: "0.78rem",
    background: activeTab === tab ? "var(--accent)" : "transparent",
    color:       activeTab === tab ? "#fff" : "var(--fg-muted)",
    opacity:     readOnly && tab === "edit" ? 0.4 : 1,
  } as React.CSSProperties);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Mini toolbar */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.4rem 0.75rem",
        background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
        flexShrink: 0,
      }}>
        <span style={{
          fontSize: "0.82rem",
          fontWeight: 600,
          color: "var(--fg)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          flex: 1,
        }}>
          {title}
        </span>
        <div style={{ display: "flex", gap: 2 }}>
          <button
            style={tabBtn("edit")}
            disabled={readOnly}
            onClick={() => !readOnly && setActiveTab("edit")}
          >
            Edit
          </button>
          <button
            style={tabBtn("preview")}
            onClick={() => setActiveTab("preview")}
          >
            Preview
          </button>
        </div>
        {/* Copy LaTeX button */}
        <button
          onClick={() => navigator.clipboard.writeText(source)}
          style={{
            padding: "0.25rem 0.65rem",
            borderRadius: 6,
            border: "1px solid var(--border)",
            background: "transparent",
            color: "var(--fg-muted)",
            fontSize: "0.75rem",
            cursor: "pointer",
          }}
          title="Copy LaTeX source"
        >
          Copy LaTeX
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        {/* Editor pane */}
        {activeTab === "edit" && !readOnly && (
          <div style={{ height: "100%", overflow: "auto" }}>
            <CodeMirror
              value={source}
              height="100%"
              onChange={val => setSource(val)}
              theme="dark"
              basicSetup={{ lineNumbers: true, foldGutter: false }}
            />
          </div>
        )}

        {/* Preview pane */}
        {activeTab === "preview" && (
          <div style={{ height: "100%", overflow: "auto", padding: "1.5rem 2rem" }}>
            {warnings.length > 0 && (
              <div style={{
                marginBottom: "1rem",
                padding: "0.6rem 0.9rem",
                background: "rgba(234,179,8,0.1)",
                border: "1px solid rgba(234,179,8,0.3)",
                borderRadius: 8,
                fontSize: "0.78rem",
                color: "#ca8a04",
              }}>
                {warnings.map((w: ParseWarning, i: number) => <div key={i}>⚠ {w.env}: {w.reason}</div>)}
              </div>
            )}
            <div
              className="latex-preview"
              dangerouslySetInnerHTML={{ __html: html }}
              style={{ maxWidth: 760, margin: "0 auto" }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
