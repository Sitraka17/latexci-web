"use client";
import { useEffect, useRef } from "react";
import GoogleMark from "@/components/GoogleMark";

/**
 * Shown when a free feature needs an account (PDF export, Word to LaTeX).
 * Signing in returns the visitor to the same page; editor drafts survive
 * because they live in localStorage.
 */
export default function SignInPrompt({ feature, onClose }: { feature: string; onClose: () => void }) {
  const btnRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    btnRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const next = typeof window === "undefined" ? "/" : window.location.pathname + window.location.search;

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="signin-prompt-title"
        onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 400, background: "var(--surface)", border: "1px solid var(--border)", padding: "1.6rem 1.5rem", color: "var(--fg)" }}
      >
        <h2 id="signin-prompt-title" style={{ fontSize: "1.15rem", fontWeight: 700, margin: "0 0 0.5rem" }}>
          Sign in to use {feature}
        </h2>
        <p style={{ fontSize: "0.88rem", lineHeight: 1.6, color: "var(--fg-muted)", margin: "0 0 1.25rem" }}>
          It stays free. One click with your Google account, then you come straight back here
          with your work where you left it.
        </p>
        <a
          ref={btnRef}
          href={`/api/auth/google?next=${encodeURIComponent(next)}`}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: "0.6rem", padding: "0.65rem 1rem", border: "1px solid #dadce0",
            borderRadius: 4, background: "#fff", color: "#1f1f1f", fontWeight: 600, fontSize: "0.9rem", textDecoration: "none",
          }}
        >
          <GoogleMark />
          Sign in with Google
        </a>
        <button
          onClick={onClose}
          style={{ display: "block", width: "100%", marginTop: "0.6rem", padding: "0.5rem", background: "none", border: "none", color: "var(--fg-muted)", fontSize: "0.84rem", cursor: "pointer" }}
        >
          Not now
        </button>
      </div>
    </div>
  );
}
