import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Welcome to Pro — latexci",
  description: "Your latexci Pro subscription is now active.",
  robots: { index: false, follow: false },
};

export default function PricingSuccess() {
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
        {/* Icon */}
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: "color-mix(in srgb, #10b981 15%, transparent)",
            border: "2px solid color-mix(in srgb, #10b981 40%, transparent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "2rem",
            marginBottom: "1.75rem",
          }}
        >
          ✓
        </div>

        <h1
          style={{
            fontSize: "clamp(1.6rem, 4vw, 2.2rem)",
            fontWeight: 900,
            letterSpacing: "-0.04em",
            marginBottom: "0.75rem",
            color: "var(--fg)",
          }}
        >
          You&apos;re in.
        </h1>

        <p
          style={{
            fontSize: "1rem",
            color: "var(--fg-muted)",
            maxWidth: 440,
            lineHeight: 1.65,
            marginBottom: "2.5rem",
          }}
        >
          Your subscription is active. You now have unlimited Word→LaTeX conversions,
          PDF export, and priority support. Check your inbox for a receipt.
        </p>

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
          <Link
            href="/tools/preview"
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
            Open Preview →
          </Link>
          <Link
            href="/tools/word-to-latex"
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
            Convert Word → LaTeX
          </Link>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
