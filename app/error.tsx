"use client";
/**
 * Global error boundary — catches unhandled errors in any Server Component.
 * Rendered instead of the page when an unexpected error is thrown.
 */
import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to console in dev; swap for Sentry / DataDog in production
    console.error("[latexci] Unhandled error:", error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg)",
        color: "var(--fg)",
        padding: "2rem 1.5rem",
        textAlign: "center",
        fontFamily: "var(--font-inter), 'Inter', system-ui, sans-serif",
      }}
    >
      {/* LaTeX-style error block */}
      <div
        style={{
          fontFamily: "var(--font-mono), monospace",
          fontSize: "0.78rem",
          color: "var(--fg-muted, #8a88a4)",
          background: "var(--surface, #141419)",
          border: "1px solid var(--border, #28283a)",
          borderRadius: 10,
          padding: "1.25rem 1.75rem",
          marginBottom: "2rem",
          lineHeight: 2,
          textAlign: "left",
          maxWidth: 520,
          width: "100%",
        }}
      >
        <div>
          <span style={{ color: "#f87171" }}>! LaTeX Error:</span>{" "}
          <span>Something went wrong.</span>
        </div>
        <div style={{ opacity: 0.55, marginLeft: "1rem" }}>
          See the latexci documentation for explanation.
        </div>
        {error.digest && (
          <div style={{ marginTop: "0.25rem", opacity: 0.45, fontSize: "0.72rem" }}>
            Error digest: {error.digest}
          </div>
        )}
        <div style={{ marginTop: "0.5rem", opacity: 0.45, fontSize: "0.72rem" }}>
          ? x to quit, &lt;RETURN&gt; to proceed, or press Ctrl+C
        </div>
      </div>

      <h1
        style={{
          fontSize: "clamp(1.4rem, 3.5vw, 1.9rem)",
          fontWeight: 800,
          letterSpacing: "-0.03em",
          marginBottom: "0.6rem",
          color: "var(--fg, #e4e1ef)",
        }}
      >
        Something didn&apos;t compile.
      </h1>
      <p
        style={{
          color: "var(--fg-muted, #8a88a4)",
          fontSize: "0.9rem",
          marginBottom: "2rem",
          maxWidth: 380,
          lineHeight: 1.75,
        }}
      >
        An unexpected error occurred. The tools still work — this is likely a
        temporary blip.
      </p>

      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
        <button
          onClick={reset}
          style={{
            padding: "0.65rem 1.5rem",
            borderRadius: 8,
            background: "linear-gradient(135deg, #7c6cf8, #b49ff5)",
            color: "#fff",
            fontWeight: 700,
            fontSize: "0.9rem",
            border: "none",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
        <Link
          href="/"
          style={{
            padding: "0.65rem 1.5rem",
            borderRadius: 8,
            background: "var(--surface, #141419)",
            color: "var(--fg, #e4e1ef)",
            fontWeight: 600,
            fontSize: "0.9rem",
            textDecoration: "none",
            border: "1px solid var(--border, #28283a)",
          }}
        >
          ← Back to home
        </Link>
      </div>
    </div>
  );
}
