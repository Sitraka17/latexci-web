import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "latexci privacy policy. We run everything in your browser — your LaTeX source never leaves your machine.",
  alternates: { canonical: "/privacy" },
  openGraph: {
    title: "Privacy Policy — latexci",
    description: "latexci privacy policy. Your LaTeX source never leaves your browser.",
    url: "/privacy",
    type: "website",
  },
};


const SECTIONS = [
  {
    title: "1. What data we collect",
    body: [
      "latexci is designed to collect as little data as possible.",
      "**Tools that run entirely in your browser** (LaTeX Preview, LaTeX Diff, Table Generator, Word → LaTeX .docx conversion): your LaTeX source, uploaded files, and generated output never leave your device. Nothing is sent to our servers.",
      "**PDF export**: your LaTeX source is sent to YToTech (latex.ytotech.com), a third-party compile service, to generate a PDF. No account information or personal data is transmitted — only the raw LaTeX text.",
      "**Citation lookups (BibTeX tools)**: when you look up a DOI, arXiv ID, PubMed ID, or ISBN, that identifier is sent to the corresponding public service (CrossRef with a DataCite fallback for dataset and software DOIs, arXiv, NCBI PubMed, and Open Library respectively) to fetch the citation. NCBI is operated in the United States, so this is an international data transfer under Art. 44 GDPR. Only the identifier you enter is sent — no account data.",
      "**CV generator**: your CV draft stays in your browser (local storage) and is never sent to latexci. If you use the optional ORCID import, only the ORCID iD you enter is sent to ORCID (orcid.org) to list your public works. ORCID is operated in the United States, so this is an international data transfer under Art. 44 GDPR.",
      "**Sign-in (optional)**: you sign in with your Google account. Google tells us your name, your email address and a stable account id; we keep them only in a signed cookie in your browser, not in a database. Documents you save in the editor are stored in your browser (local storage) and never sent to latexci.",
      "**Analytics**: we may collect anonymised page-view counts and referrer data via Vercel Analytics. No cookies are set for this purpose.",
      "**Payments**: if you upgrade to a paid plan, payment details are handled entirely by Stripe. latexci never sees or stores your card number.",
    ],
  },
  {
    title: "2. How we use your data",
    body: [
      "Email address and Google account id: to recognise you when you sign in and to look up your subscription at Stripe.",
      "Saved documents: shown in your dashboard, on the device where you saved them. They are not synchronised between devices.",
      "We do not sell, rent, or share your personal data with third parties for marketing purposes.",
    ],
  },
  {
    title: "3. Cookies",
    body: [
      "We use essential cookies only for signed-in users: a signed session cookie (your name, email and Google account id, valid 30 days or until you sign out), a plain flag telling the page you are signed in, and a counter for free Word conversions.",
      "We do not use advertising cookies, tracking pixels, or third-party analytics cookies.",
    ],
  },
  {
    title: "4. Third-party services",
    body: [
      "**Google** (sign-in only): authenticates you when you click \"Sign in with Google\" and returns your name and email. See policies.google.com/privacy.",
      "**Vercel** — hosting and edge network. See vercel.com/legal/privacy-policy.",
      "**Stripe** — payment processing. See stripe.com/privacy.",
      "**YToTech (latex.ytotech.com)** — PDF compilation (only when you click the PDF export button). Receives your raw LaTeX source.",
      "**ORCID** (orcid.org): receives only the ORCID iD you enter, when you click \"Import from ORCID\" in the CV generator. United States service (international transfer).",
      "**CrossRef, DataCite, arXiv, NCBI PubMed, and Open Library** — citation metadata lookups in the BibTeX tools. Each receives only the identifier you enter (DOI / arXiv ID / PubMed ID / ISBN); DataCite (a German service) is queried only when a DOI is not found at CrossRef. NCBI is a United States service (international transfer).",
    ],
  },
  {
    title: "5. Data retention",
    body: [
      "latexci stores no account data on its servers. Your session cookie expires after 30 days or when you sign out; saved documents stay in your browser until you delete them.",
      "\"Delete my data\" in the dashboard removes your documents from the browser and clears the session immediately. Billing records are kept by Stripe for as long as tax law requires.",
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
      "This policy was last updated on 5 October 2026.",
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
