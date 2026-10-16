"use client";
import { useState, type Ref } from "react";
import GoogleMark from "@/components/GoogleMark";

/**
 * "Sign in with Google" plus the product-news checkbox (unticked by
 * default). The choice travels through the OAuth state cookie to the
 * user record; it can be changed later in the dashboard.
 */
export default function GoogleSignIn({ next, compact = false, linkRef }: { next: string; compact?: boolean; linkRef?: Ref<HTMLAnchorElement> }) {
  const [news, setNews] = useState(false);
  const href = `/api/auth/google?next=${encodeURIComponent(next)}${news ? "&news=1" : ""}`;
  return (
    <div style={{ display: "flex", flexDirection: compact ? "row" : "column", flexWrap: "wrap", alignItems: compact ? "center" : "stretch", gap: compact ? "0.5rem 0.9rem" : "0.7rem" }}>
      <a
        ref={linkRef}
        href={href}
        style={{
          display: compact ? "inline-flex" : "flex", alignItems: "center", justifyContent: "center", gap: "0.6rem",
          padding: compact ? "0.35rem 0.8rem" : "0.65rem 1rem", border: "1px solid #dadce0", borderRadius: 4,
          background: "#fff", color: "#1f1f1f", fontWeight: 600, fontSize: compact ? "0.85rem" : "0.9rem", textDecoration: "none",
        }}
      >
        <GoogleMark />
        Sign in with Google
      </a>
      <label style={{ display: "flex", alignItems: "flex-start", gap: "0.45rem", fontSize: "0.8rem", lineHeight: 1.45, color: "var(--fg-muted)", cursor: "pointer" }}>
        <input type="checkbox" checked={news} onChange={(e) => setNews(e.target.checked)} style={{ marginTop: "0.15rem" }} />
        <span>Email me when a new tool or template ships (at most monthly, unsubscribe anytime)</span>
      </label>
    </div>
  );
}
