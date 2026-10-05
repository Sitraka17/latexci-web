"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

const ERRORS: Record<string, string> = {
  cancelled: "Sign-in was cancelled.",
  state: "The sign-in link expired. Please try again.",
  exchange: "Google could not confirm the sign-in. Please try again.",
  token: "Google returned an invalid sign-in. Please try again.",
  email: "Your Google account has no verified email address.",
  unavailable: "Sign-in is not available right now. Every free tool still works without an account.",
};

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

export default function AuthForm({ configured }: { configured: boolean }) {
  const [error, setError] = useState<string | null>(null);
  const [nextPath, setNextPath] = useState("/dashboard");

  useEffect(() => {
    // The page is static, so ?error / ?next can only be read after hydration.
    const p = new URLSearchParams(window.location.search);
    const e = p.get("error");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (e) setError(ERRORS[e] ?? "Sign-in failed. Please try again.");
    const n = p.get("next");
    if (n && n.startsWith("/") && !n.startsWith("//")) setNextPath(n);
  }, []);

  return (
    <div style={{ maxWidth: 420, width: "100%", border: "1px solid var(--border)", background: "var(--surface)", padding: "2rem 1.75rem" }}>
      <h1 style={{ fontSize: "1.45rem", fontWeight: 800, margin: "0 0 0.5rem" }}>Sign in to latexci</h1>
      <p style={{ color: "var(--fg-muted)", fontSize: "0.88rem", lineHeight: 1.65, margin: "0 0 1.5rem" }}>
        Sign in to use Pro features (PDF export, unlimited Word conversions) and manage your plan. Every
        other tool works without an account.
      </p>

      {error && (
        <p role="alert" style={{ fontSize: "0.84rem", color: "#ef4444", margin: "0 0 1rem" }}>{error}</p>
      )}

      {configured ? (
        <a
          href={`/api/auth/google?next=${encodeURIComponent(nextPath)}`}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: "0.7rem",
            width: "100%", boxSizing: "border-box", padding: "0.7rem 1rem",
            border: "1px solid #dadce0", borderRadius: 4, background: "#fff", color: "#1f1f1f",
            fontWeight: 600, fontSize: "0.92rem", textDecoration: "none",
          }}
        >
          <GoogleMark />
          Sign in with Google
        </a>
      ) : (
        <p style={{ fontSize: "0.86rem", lineHeight: 1.6, margin: 0, padding: "0.75rem 0.9rem", border: "1px solid var(--border)", background: "var(--surface2)" }}>
          Sign-in is being set up. In the meantime every tool is open to everyone, including PDF export.
        </p>
      )}

      <p style={{ color: "var(--fg-muted)", fontSize: "0.78rem", lineHeight: 1.6, margin: "1.5rem 0 0" }}>
        We only receive your name and email from Google. Your documents stay in your browser. See the{" "}
        <Link href="/privacy" style={{ color: "var(--accent)" }}>privacy policy</Link>.
      </p>
    </div>
  );
}
