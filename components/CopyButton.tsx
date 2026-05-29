"use client";
import { useState } from "react";

export default function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [state, setState] = useState<"idle" | "copied" | "err">("idle");

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setState("copied");
      setTimeout(() => setState("idle"), 2000);
    } catch {
      setState("err");
      setTimeout(() => setState("idle"), 2000);
    }
  }

  return (
    <button
      onClick={copy}
      title={state === "copied" ? "Copied!" : `Copy ${label}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.3rem",
        padding: "0.18rem 0.55rem",
        borderRadius: 5,
        fontSize: "0.7rem",
        fontWeight: 600,
        fontFamily: "inherit",
        border: `1px solid ${state === "copied" ? "rgba(52,211,153,0.5)" : state === "err" ? "rgba(248,113,113,0.5)" : "var(--border)"}`,
        background: state === "copied" ? "rgba(52,211,153,0.1)" : state === "err" ? "rgba(248,113,113,0.1)" : "var(--surface2)",
        color: state === "copied" ? "#34d399" : state === "err" ? "#f87171" : "var(--fg-muted)",
        cursor: "pointer",
        flexShrink: 0,
        transition: "all 0.15s",
      }}
    >
      {state === "copied" ? (
        <>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Copied
        </>
      ) : state === "err" ? (
        "Failed"
      ) : (
        <>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          {label}
        </>
      )}
    </button>
  );
}
