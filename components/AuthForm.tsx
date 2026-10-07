"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import GoogleMark from "@/components/GoogleMark";

const ERRORS: Record<string, string> = {
  cancelled: "Sign-in was cancelled.",
  state: "The sign-in link expired. Please try again.",
  exchange: "Google could not confirm the sign-in. Please try again.",
  token: "Google returned an invalid sign-in. Please try again.",
  email: "Your Google account has no verified email address.",
  unavailable: "Sign-in is not available right now. Every free tool still works without an account.",
};

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
        Everything on latexci is free. PDF export and Word to LaTeX need a free account: one click
        with Google. The other tools work without signing in.
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
          Sign-in is being set up. In the meantime every tool works without an account.
        </p>
      )}

      <p style={{ color: "var(--fg-muted)", fontSize: "0.78rem", lineHeight: 1.6, margin: "1.5rem 0 0" }}>
        We receive your name and email from Google and keep a short usage record (sign-ins, exports). Your documents stay in your browser. See the{" "}
        <Link href="/privacy" style={{ color: "var(--accent)" }}>privacy policy</Link>.
      </p>
    </div>
  );
}
