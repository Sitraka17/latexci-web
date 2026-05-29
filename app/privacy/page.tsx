import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Privacy Policy — latexci",
  description: "latexci privacy policy. We run everything in your browser — your LaTeX source never leaves your machine.",
  alternates: { canonical: "/privacy" },
};

const YEAR = new Date().getFullYear();

const SECTIONS = [
  {
    title: "1. What data we collect",
    body: [
      "latexci is designed to collect as little data as possible.",
      "**Tools that run entirely in your browser** (LaTeX Preview, LaTeX Diff, Table Generator, Word → LaTeX .docx conversion): your LaTeX source, uploaded files, and generated output never leave your device. Nothing is sent to our servers.",
      "**PDF export**: your LaTeX source is sent to latexonline.cc, a third-party compile service, to generate a PDF. No account information or personal data is transmitted — only the raw LaTeX text.",
      "**Account creation (optional)**: if you create an account, we store your email address, a hashed password, and the documents you choose to save. This data is stored in Supabase (EU region).",
      "**Analytics**: we may collect anonymised page-view counts and referrer data via Vercel Analytics. No cookies are set for this purpose.",
      "**Payments**: if you upgrade to a paid plan, payment details are handled entirely by Stripe. latexci never sees or stores your card number.",
    ],
  },
  {
    title: "2. How we use your data",
    body: [
      "Email address: to authenticate you, send transactional emails (password reset, receipts), and contact you about your account.",
      "Saved documents: to display them in your dashboard and sync them across your devices.",
      "We do not sell, rent, or share your personal data with third parties for marketing purposes.",
    ],
  },
  {
    title: "3. Cookies",
    body: [
      "We use a single, essential session cookie for authenticated users. This cookie stores your login state and expires when you sign out.",
      "We do not use advertising cookies, tracking pixels, or third-party analytics cookies.",
    ],
  },
  {
    title: "4. Third-party services",
    body: [
      "**Supabase** — database and authentication provider. Data is stored in the EU (West region). See supabase.com/privacy.",
      "**Vercel** — hosting and edge network. See vercel.com/legal/privacy-policy.",
      "**Stripe** — payment processing. See stripe.com/privacy.",
      "**latexonline.cc** — PDF compilation (only when you click the PDF export button). Their privacy policy is available at latexonline.cc.",
    ],
  },
  {
    title: "5. Data retention",
    body: [
      "Your account and saved documents are retained until you delete your account.",
      "You can delete your account at any time from your dashboard settings. All associated documents are permanently deleted within 30 days.",
    ],
  },
  {
    title: "6. Your rights",
    body: [
      "If you are located in the European Economic Area (EEA), you have the right to access, rectify, erase, restrict, or port your personal data.",
      "To exercise these rights or to ask a privacy question, email us at: hello@latexci.com",
    ],
  },
  {
    title: "7. Changes to this policy",
    body: [
      "We may update this policy from time to time. Material changes will be communicated via the GitHub repository changelog or by email to registered users.",
      `This policy was last updated in ${YEAR}.`,
    ],
  },
];

function renderBody(line: string) {
  // Bold **text** support
  const parts = line.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{part}</strong> : part
  );
}

export default function PrivacyPage() {
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
            Privacy Policy
          </h1>
          <p style={{
            color: "var(--fg-muted)", fontSize: "0.9rem", lineHeight: 1.7,
            padding: "0.85rem 1.1rem",
            background: "rgba(124,108,248,0.07)",
            border: "1px solid rgba(124,108,248,0.2)",
            borderRadius: 8,
          }}>
            <strong>Short version:</strong> most tools run entirely in your browser — your LaTeX source never leaves your machine.
            If you create an account, we store only your email and your saved documents.
            We don&apos;t sell data. Ever.
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
          <Link href="/terms" style={{ color: "var(--accent)", textDecoration: "none" }}>Terms of Service →</Link>
          <Link href="/" style={{ color: "var(--fg-muted)", textDecoration: "none" }}>← Back to home</Link>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
