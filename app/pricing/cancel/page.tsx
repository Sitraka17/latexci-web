import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Checkout cancelled — latexci",
  description: "Your checkout was cancelled. No charge was made.",
  robots: { index: false, follow: false },
};

export default function PricingCancel() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />

      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "4rem 1.5rem",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: "color-mix(in srgb, var(--fg) 8%, transparent)",
            border: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.8rem",
            marginBottom: "1.75rem",
            color: "var(--fg-muted)",
          }}
        >
          ←
        </div>

        <h1
          style={{
            fontSize: "clamp(1.5rem, 4vw, 2rem)",
            fontWeight: 800,
            letterSpacing: "-0.04em",
            marginBottom: "0.75rem",
            color: "var(--fg)",
          }}
        >
          No charge was made.
        </h1>

        <p
          style={{
            fontSize: "0.95rem",
            color: "var(--fg-muted)",
            maxWidth: 420,
            lineHeight: 1.65,
            marginBottom: "2.5rem",
          }}
        >
          You cancelled checkout — your card was not charged. The free tier
          stays available as long as you need it.
        </p>

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
          <Link
            href="/pricing"
            style={{
              padding: "0.7rem 1.5rem",
              borderRadius: 8,
              background: "var(--accent)",
              color: "#fff",
              fontWeight: 700,
              fontSize: "0.9rem",
              textDecoration: "none",
            }}
          >
            Back to pricing
          </Link>
          <Link
            href="/"
            style={{
              padding: "0.7rem 1.5rem",
              borderRadius: 8,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              color: "var(--fg)",
              fontWeight: 600,
              fontSize: "0.9rem",
              textDecoration: "none",
            }}
          >
            Go to tools
          </Link>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
