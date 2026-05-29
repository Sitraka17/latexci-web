import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Terms of Service — latexci",
  description: "Terms of service for latexci — free, open-source LaTeX tools for researchers and students.",
  alternates: { canonical: "/terms" },
};

const YEAR = new Date().getFullYear();

const SECTIONS = [
  {
    title: "1. Acceptance",
    body: [
      `By accessing latexci (latexci-web.vercel.app), you agree to these Terms of Service. If you do not agree, please do not use the service. These terms were last updated in ${YEAR}.`,
    ],
  },
  {
    title: "2. Description of service",
    body: [
      "latexci provides free, browser-based LaTeX utilities including a live preview, diff tool, Word-to-LaTeX converter, table generator, and template library.",
      "The service is provided as-is, free of charge, for personal, academic, and commercial use within the limits described here.",
    ],
  },
  {
    title: "3. Acceptable use",
    body: [
      "You may use latexci for any lawful purpose, including personal projects, academic research, and commercial work.",
      "You may not: (a) attempt to disrupt or overload our servers; (b) use automated scripts to abuse the PDF export service; (c) reverse-engineer or attempt to extract private API keys; (d) use the service to distribute illegal or harmful content.",
      "The PDF export feature calls an external LaTeX compile service (latexonline.cc). Misuse of this feature — including sending excessively large documents repeatedly — may result in rate limiting.",
    ],
  },
  {
    title: "4. User accounts",
    body: [
      "Creating an account is optional. You are responsible for maintaining the security of your account credentials.",
      "You may delete your account at any time. We will permanently delete your data within 30 days of account deletion.",
      "We reserve the right to suspend accounts that violate these terms.",
    ],
  },
  {
    title: "5. Intellectual property",
    body: [
      "**Your content**: any LaTeX documents, templates, or text you create remain your property. We claim no ownership over content you create or upload.",
      "**Our software**: latexci's source code is released under the MIT License, available on GitHub. You are free to fork, modify, and redistribute it under the same license.",
      "**Templates**: the built-in LaTeX templates are provided under the MIT License. You may use them as the basis for your own documents without restriction.",
    ],
  },
  {
    title: "6. Paid plans",
    body: [
      "Pro and Lab plans are billed via Stripe. By purchasing a plan, you agree to Stripe's Terms of Service.",
      "Annual plans are billed once per year. Monthly plans are billed each month. Prices are in USD and exclude applicable taxes.",
      "You may cancel at any time. Your plan remains active until the end of the current billing period. We do not offer pro-rated refunds on annual plans unless required by law.",
    ],
  },
  {
    title: "7. Disclaimer of warranties",
    body: [
      "latexci is provided \"as is\" without warranties of any kind, express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, or non-infringement.",
      "We do not guarantee that the service will be available 100% of the time or that LaTeX compilation will produce error-free output.",
    ],
  },
  {
    title: "8. Limitation of liability",
    body: [
      "To the maximum extent permitted by law, latexci's liability for any claim arising out of use of the service is limited to the amount you paid in the 12 months preceding the claim (or $0 if you used only the free plan).",
      "We are not liable for loss of data, loss of profits, or indirect damages.",
    ],
  },
  {
    title: "9. Changes",
    body: [
      "We may update these terms from time to time. Material changes will be announced in the GitHub repository changelog. Continued use of the service after a change constitutes acceptance of the new terms.",
    ],
  },
  {
    title: "10. Governing law",
    body: [
      "These terms are governed by the laws of France. Disputes will be resolved in the courts of Marseille, France.",
    ],
  },
];

function renderBody(line: string) {
  const parts = line.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{part}</strong> : part
  );
}

export default function TermsPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />

      <main style={{ flex: 1, maxWidth: 760, margin: "0 auto", padding: "4rem 1.5rem 5rem", width: "100%" }}>
        {/* Header */}
        <div style={{ marginBottom: "3rem" }}>
          <span style={{
            display: "inline-block", marginBottom: "1rem",
            fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.12em",
            textTransform: "uppercase", color: "var(--accent)",
          }}>
            Legal
          </span>
          <h1 style={{
            fontSize: "clamp(1.75rem, 4vw, 2.4rem)", fontWeight: 900,
            letterSpacing: "-0.04em", lineHeight: 1.1, marginBottom: "1rem",
          }}>
            Terms of Service
          </h1>
          <p style={{
            color: "var(--fg-muted)", fontSize: "0.9rem", lineHeight: 1.7,
            padding: "0.85rem 1.1rem",
            background: "rgba(124,108,248,0.07)",
            border: "1px solid rgba(124,108,248,0.2)",
            borderRadius: 8,
          }}>
            <strong>Short version:</strong> use latexci for lawful purposes, don&apos;t abuse the compile service,
            your content is yours. The software is MIT-licensed open source.
          </p>
        </div>

        {/* Sections */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
          {SECTIONS.map(section => (
            <section key={section.title}>
              <h2 style={{
                fontSize: "1.05rem", fontWeight: 700,
                marginBottom: "0.85rem", paddingBottom: "0.5rem",
                borderBottom: "1px solid var(--border)",
              }}>
                {section.title}
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                {section.body.map((line, i) => (
                  <p key={i} style={{
                    margin: 0, fontSize: "0.88rem", lineHeight: 1.75,
                    color: "var(--fg-muted)",
                  }}>
                    {renderBody(line)}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Contact */}
        <div style={{
          marginTop: "3rem", padding: "1.5rem",
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: 10,
        }}>
          <p style={{ fontWeight: 700, fontSize: "0.9rem", marginBottom: "0.35rem" }}>Questions?</p>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--fg-muted)", lineHeight: 1.65 }}>
            Email us at{" "}
            <a href="mailto:hello@latexci.com" style={{ color: "var(--accent)", textDecoration: "none" }}>
              hello@latexci.com
            </a>
            {" "}or open an issue on{" "}
            <a
              href="https://github.com/Sitraka17/latexci-web/issues"
              target="_blank" rel="noopener noreferrer"
              style={{ color: "var(--accent)", textDecoration: "none" }}
            >
              GitHub
            </a>.
          </p>
        </div>

        <div style={{ marginTop: "2rem", display: "flex", gap: "1rem", fontSize: "0.82rem" }}>
          <Link href="/privacy" style={{ color: "var(--accent)", textDecoration: "none" }}>Privacy Policy →</Link>
          <Link href="/" style={{ color: "var(--fg-muted)", textDecoration: "none" }}>← Back to home</Link>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
