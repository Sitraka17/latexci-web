import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of service for latexci: free online LaTeX tools for researchers and students. No paid plan, optional Google sign-in for PDF export and Word to LaTeX.",
  alternates: { canonical: "/terms" },
  openGraph: {
    title: "Terms of Service | latexci",
    description: "Terms of service for latexci: free online LaTeX tools for researchers.",
    url: "/terms",
    type: "website",
  },
};


const SECTIONS = [
  {
    title: "1. Acceptance",
    body: [
      `By accessing latexci (latexci.com), you agree to these Terms of Service. If you do not agree, please do not use the service. These terms were last updated on 7 October 2026.`,
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
      "The PDF export feature sends your LaTeX source to an external compile service (YToTech LaTeX-on-HTTP). Misuse of this feature, including sending excessively large documents repeatedly, may result in rate limiting.",
    ],
  },
  {
    title: "4. Google sign-in",
    body: [
      "Most tools work without an account. PDF export and Word to LaTeX require a free sign-in with your Google account. latexci never sees or stores a password: Google confirms your identity and we keep a signed session cookie.",
      "When you sign in, we keep a private record of your email address, name, first and last visit, and the number of sign-ins, PDF exports and Word conversions, stored in Vercel Blob (Paris, EU). Documents you save stay in your own browser (localStorage) and are never uploaded to an account.",
      "You can erase that record at any time with \"Delete my data\" in the dashboard: it is deleted immediately, you are signed out, and the documents saved in that browser are wiped too. We may block sign-in for accounts that violate these terms.",
    ],
  },
  {
    title: "5. Intellectual property",
    body: [
      "**Your content**: any LaTeX documents, templates, or text you create remain your property. We claim no ownership over content you create or upload.",
      "**Our software**: the latexci website and its code remain the property of their author. No licence to the code is granted beyond using the service.",
      "**Templates**: the built-in LaTeX templates are free to copy and use as the basis for your own documents, including commercial and academic work, without attribution.",
    ],
  },
  {
    title: "6. Price",
    body: [
      "latexci is free. There is no paid plan and no payment is ever requested. Voluntary donations through Buy Me a Coffee are gifts and give no additional rights.",
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
      "latexci is provided free of charge and no payment is ever collected. To the maximum extent permitted by law, latexci accepts no liability for any claim arising out of use of the service.",
      "We are not liable for loss of data, loss of profits, or indirect damages. Documents saved in your browser can be lost if you clear its storage: keep your own copies.",
    ],
  },
  {
    title: "9. Changes",
    body: [
      "We may update these terms from time to time. The date in section 1 shows the latest version. Continued use of the service after a change constitutes acceptance of the new terms.",
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
            your content is yours. Everything is free; PDF export and Word to LaTeX need a one-click Google sign-in.
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
