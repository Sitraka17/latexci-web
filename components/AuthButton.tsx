"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export default function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <div style={{ width: 80, height: 28 }} />;

  if (user) {
    return (
      <Link
        href="/dashboard"
        title={user.email ?? "Dashboard"}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.4rem",
          padding: "0.28rem 0.7rem",
          borderRadius: 6,
          background: "var(--surface2)",
          border: "1px solid var(--border)",
          fontSize: "0.8rem",
          fontWeight: 600,
          color: "var(--fg)",
          textDecoration: "none",
        }}
      >
        <span style={{
          width: 20, height: 20, borderRadius: "50%",
          background: "linear-gradient(135deg, var(--accent), var(--accent2))",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          fontSize: "0.65rem", color: "#fff", fontWeight: 800,
          flexShrink: 0,
        }}>
          {(user.email ?? "?")[0].toUpperCase()}
        </span>
        Dashboard
      </Link>
    );
  }

  return (
    <Link
      href="/auth"
      style={{
        padding: "0.3rem 0.75rem",
        borderRadius: 6,
        background: "var(--surface2)",
        border: "1px solid var(--border)",
        fontSize: "0.8rem",
        fontWeight: 600,
        color: "var(--fg)",
        textDecoration: "none",
      }}
    >
      Sign in
    </Link>
  );
}
