"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

// The httpOnly session cookie is invisible to JS; "lx_signed_in" is a plain
// hint set alongside it. No hint means nobody is signed in, so the navbar keeps
// the static "Sign in" link and never calls /api/auth/me. That is the case for
// almost every visitor and every crawler.
function hasSessionHint(): boolean {
  return document.cookie.split("; ").some((c) => c.startsWith("lx_signed_in="));
}

const baseStyle = {
  borderRadius: 6,
  background: "var(--surface2)",
  border: "1px solid var(--border)",
  fontSize: "0.8rem",
  fontWeight: 600,
  color: "var(--fg)",
  textDecoration: "none",
  whiteSpace: "nowrap" as const,
};

export default function AuthButton() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!hasSessionHint()) return;
    let alive = true;
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { user: { email: string } | null } | null) => {
        if (alive) setEmail(d?.user?.email ?? null);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  if (email !== null) {
    return (
      <Link
        href="/dashboard"
        title={email}
        style={{ ...baseStyle, display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.28rem 0.7rem" }}
      >
        <span style={{
          width: 20, height: 20, borderRadius: "50%",
          background: "var(--accent)",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          fontSize: "0.65rem", color: "#fff", fontWeight: 800, flexShrink: 0,
        }}>
          {(email || "?")[0].toUpperCase()}
        </span>
        Dashboard
      </Link>
    );
  }

  return (
    <Link href="/auth" style={{ ...baseStyle, padding: "0.3rem 0.75rem" }}>
      Sign in
    </Link>
  );
}
