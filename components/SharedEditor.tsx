"use client";
import { useState, useMemo, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { latexToHtml, ParseWarning } from "@/lib/latex-parser";

const CodeMirror = dynamic(() => import("@uiw/react-codemirror"), { ssr: false });

type Props = {
  initialContent: string;
  title: string;
  readOnly: boolean;
  /** Share token — enables saving edits back when the doc allows public edits. */
  token?: string;
};

export default function SharedEditor({ initialContent, title, readOnly, token }: Props) {
  const [source, setSource] = useState(initialContent);
  const [copied, setCopied] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [activeTab, setActiveTab] = useState<"edit" | "preview">(readOnly ? "preview" : "edit");
  const previewRef = useRef<HTMLDivElement>(null);
  const saveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirtyRef = useRef(false);

  // Autosave edits back through the share token (debounced 2 s).
  // Without this, "anyone with the link can edit" edits were silently lost.
  useEffect(() => {
    if (readOnly || !token) return;
    if (!dirtyRef.current) { dirtyRef.current = true; return; } // skip initial content
    if (saveRef.current) clearTimeout(saveRef.current);
    setSaveStatus("saving");
    saveRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/shared/${token}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: source }),
        });
        setSaveStatus(res.ok ? "saved" : "error");
      } catch {
        setSaveStatus("error");
      }
      setTimeout(() => setSaveStatus("idle"), 2000);
    }, 2000);
    return () => { if (saveRef.current) clearTimeout(saveRef.current); };
  }, [source, readOnly, token]);

  const { html, warnings } = useMemo(() => latexToHtml(source), [source]);

  // Hydrate KaTeX math in the preview pane (same pattern as LatexEditor)
  useEffect(() => {
    if (!previewRef.current || !html) return;
    let cancelled = false;
    (async () => {
      const katex = (await import("katex")).default;
      // katex.min.css loaded globally in app/layout.tsx — no duplicate import needed
      if (cancelled || !previewRef.current) return;
      const root = previewRef.current;
      root.querySelectorAll<HTMLElement>(".math-inline[data-math]").forEach(el => {
        try {
          el.innerHTML = katex.renderToString(
            decodeURIComponent(el.dataset.math!),
            { throwOnError: false, displayMode: false }
          );
          el.removeAttribute("data-math");
        } catch { /* silent */ }
      });
      root.querySelectorAll<HTMLElement>(".math-block[data-math]").forEach(el => {
        try {
          el.innerHTML = katex.renderToString(
            decodeURIComponent(el.dataset.math!),
            { throwOnError: false, displayMode: true }
          );
          el.removeAttribute("data-math");
        } catch { /* silent */ }
      });
    })();
    return () => { cancelled = true; };
  }, [html]);

  const tabBtn = (tab: "edit" | "preview"): React.CSSProperties => ({
    padding: "0.25rem 0.75rem",
    borderRadius: 6,
    border: "none",
    cursor: readOnly && tab === "edit" ? "not-allowed" : "pointer",
    fontWeight: 600,
    fontSize: "0.78rem",
    background: activeTab === tab ? "var(--accent)" : "transparent",
    color:       activeTab === tab ? "#fff" : "var(--fg-muted)",
    opacity:     readOnly && tab === "edit" ? 0.4 : 1,
    transition:  "background 0.15s, color 0.15s",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Toolbar */}
      <div style={{
        display: "flex", alignItems: "center", gap: "0.5rem",
        padding: "0.4rem 0.75rem",
        background: "var(--surface)", borderBottom: "1px solid var(--border)",
        flexShrink: 0,
      }}>
        <span style={{
          fontSize: "0.82rem", fontWeight: 600, color: "var(--fg)",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1,
        }}>
          {title}
        </span>

        {/* Save status — only for editable shared docs */}
        {!readOnly && saveStatus !== "idle" && (
          <span style={{
            fontSize: "0.7rem", flexShrink: 0,
            color: saveStatus === "saved" ? "#10b981" : saveStatus === "error" ? "#ef4444" : "var(--fg-muted)",
          }}>
            {saveStatus === "saving" ? "Saving…" : saveStatus === "saved" ? "✓ Saved" : "Save failed"}
          </span>
        )}

        {/* Tab switcher */}
        <div style={{ display: "flex", gap: 2 }}>
          <button style={tabBtn("edit")} disabled={readOnly} onClick={() => !readOnly && setActiveTab("edit")}>
            Edit
          </button>
          <button style={tabBtn("preview")} onClick={() => setActiveTab("preview")}>
            Preview
          </button>
        </div>

        {/* Copy LaTeX */}
        <button
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(source);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            } catch {
              // clipboard blocked — keep label unchanged rather than lie
            }
          }}
          title="Copy LaTeX source"
          style={{
            padding: "0.25rem 0.65rem", borderRadius: 6,
            border: "1px solid var(--border)", background: "transparent",
            color: "var(--fg-muted)", fontSize: "0.75rem", cursor: "pointer",
            transition: "border-color 0.15s, color 0.15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--fg)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--fg-muted)"; }}
        >
          {copied ? "✓ Copied" : "Copy LaTeX"}
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
                marginBottom: "1rem", padding: "0.6rem 0.9rem",
                background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.3)",
                borderRadius: 8, fontSize: "0.78rem", color: "#ca8a04",
              }}>
                {warnings.map((w: ParseWarning, i: number) => (
                  <div key={i}>⚠ {w.env}: {w.reason}</div>
                ))}
              </div>
            )}
            <div
              ref={previewRef}
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
