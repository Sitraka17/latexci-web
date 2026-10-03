"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

// The Supabase browser client keeps the session in "sb-<project>-auth-token"
// cookies. No such cookie means nobody is signed in, so we keep the plain
// "Sign in" link and never download supabase-js (~60 KB compressed). That is
// the case for almost every visitor and every crawler, on every page, since
// this button lives in the navbar.
function hasSessionCookie(): boolean {
  return document.cookie.split("; ").some((c) => c.startsWith("sb-"));
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
  // null = signed out (or not yet known). Signed-in users briefly see
  // "Sign in" before the swap; acceptable since they are rare, and it keeps
  // the server render identical for everyone (static pages, no cookies()).
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!hasSessionCookie()) return;
    let alive = true;
    let unsubscribe: (() => void) | undefined;

    import("@/lib/supabase/client").then(({ createClient }) => {
      if (!alive) return;
      const supabase = createClient();
      supabase.auth.getUser().then(({ data }) => {
        if (alive) setEmail(data.user ? (data.user.email ?? "") : null);
      });
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        if (alive) setEmail(session?.user ? (session.user.email ?? "") : null);
      });
      unsubscribe = () => data.subscription.unsubscribe();
    });

    return () => {
      alive = false;
      unsubscribe?.();
    };
  }, []);

  if (email !== null) {
    return (
      <Link
        href="/dashboard"
        title={email || "Dashboard"}
        style={{ ...baseStyle, display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.28rem 0.7rem" }}
      >
        <span style={{
          width: 20, height: 20, borderRadius: "50%",
          background: "linear-gradient(135deg, var(--accent), var(--accent2))",
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
