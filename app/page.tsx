import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import AdUnit from "@/components/AdUnit";

export const metadata: Metadata = {
  title: "Free Online LaTeX Preview, Diff & Word-to-LaTeX Converter",
  description:
    "latexci offers free browser-based LaTeX tools: live preview with KaTeX math, side-by-side diff highlighting, and instant Word (.docx) to LaTeX conversion. No account needed.",
  alternates: { canonical: "https://latexci-web.vercel.app" },
};

const tools = [
  {
    href: "/tools/preview",
    icon: "⚡",
    title: "Live Preview",
    subtitle: "Paste .tex, see it render",
    description:
      "KaTeX math, sections, tables, lists — everything renders instantly as you type. Share any document via a URL.",
    badge: "Live",
    badgeColor: "#10b981",
  },
  {
    href: "/tools/diff",
    icon: "↕",
    title: "LaTeX Diff",
    subtitle: "See exactly what changed",
    description:
      "Drop two .tex files side by side. Additions in green, deletions in red. Great for advisor revisions.",
    badge: "Diff",
    badgeColor: "#7c6cf8",
  },
  {
    href: "/tools/word-to-latex",
    icon: "↗",
    title: "Word → LaTeX",
    subtitle: "Get clean .tex from .docx",
    description:
      "Upload a Word, ODT, or RTF file. Get LaTeX source back. Edit inline before you download.",
    badge: "Convert",
    badgeColor: "#f59e0b",
  },
  {
    href: "/tools/table",
    icon: "▦",
    title: "Table Generator",
    subtitle: "LaTeX tables without the pain",
    description:
      "Enter your data in a grid, choose alignment and borders (booktabs or simple), copy the tabular code.",
    badge: "New",
    badgeColor: "#06b6d4",
  },
  {
    href: "/tools/templates",
    icon: "▤",
    title: "Templates",
    subtitle: "Start from something solid",
    description:
      "CV, thesis chapters, Beamer slides, IEEE papers, cover letters. One click to open in the editor.",
    badge: "Library",
    badgeColor: "#ec4899",
  },
];

const faqs = [
  {
    q: "Is latexci really free?",
    a: "Yes. All four tools are free, there is no paid plan, and no account is required. The code is open source on GitHub.",
  },
  {
    q: "Does the preview support math equations?",
    a: "Yes — inline math ($...$), display math (\\[...\\]), and block environments like align, gather, and equation all render via KaTeX, the same engine used by Khan Academy.",
  },
  {
    q: "What file types does Word → LaTeX accept?",
    a: ".docx (Word 2007+), .odt (LibreOffice), and .rtf. The conversion runs on our server via pandoc, and your file is deleted immediately after.",
  },
  {
    q: "Is my source code stored anywhere?",
    a: "No. The preview and diff tools run entirely in your browser — your LaTeX never leaves your machine. Only the Word → LaTeX tool sends a file to our server, and only to convert it.",
  },
  {
    q: "Can I use latexci offline?",
    a: "Preview and diff work fully offline once the page has loaded (math rendering is bundled with KaTeX). Word → LaTeX needs a connection.",
  },
  {
    q: "How is this different from Overleaf?",
    a: "Overleaf is a full collaborative editor — it runs a real LaTeX compiler. latexci is for the quick in-between moments: checking a formula, reviewing a diff, or pulling LaTeX out of a Word document, without logging in or waiting.",
  },
];

export default function HomePage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const appSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "latexci",
    description:
      "Free browser-based LaTeX tools: live preview with KaTeX math, side-by-side diff, Word to LaTeX conversion, table generator, and templates. No signup, no install.",
    url: "https://latexci-web.vercel.app",
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Web Browser",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    featureList: [
      "Live LaTeX preview with KaTeX math rendering",
      "Side-by-side LaTeX diff tool",
      "Word to LaTeX converter (docx, odt, rtf)",
      "LaTeX table generator with booktabs support",
      "Free LaTeX templates for thesis, CV, Beamer",
      "Shareable document URLs",
      "Offline capable preview and diff",
    ],
    author: {
      "@type": "Person",
      name: "Sitraka Forler",
      url: "https://github.com/Sitraka17",
    },
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "latexci",
    url: "https://latexci-web.vercel.app",
    description: "Free online LaTeX tools — preview, diff, Word to LaTeX, table generator, templates.",
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
      <Navbar />

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="has-grid" style={{ padding: "5.5rem 1.5rem 4.5rem", textAlign: "center" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>

          <h1
            style={{
              fontSize: "clamp(2.1rem, 5.5vw, 3.5rem)",
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: "-0.04em",
              marginBottom: "1.25rem",
              color: "var(--fg)",
            }}
          >
            LaTeX in your browser.
            <br />
            <span
              style={{
                background: "linear-gradient(135deg, var(--accent), var(--accent2))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              No setup required.
            </span>
          </h1>

          <p
            style={{
              fontSize: "1.05rem",
              color: "var(--fg-muted)",
              lineHeight: 1.75,
              maxWidth: 520,
              margin: "0 auto 2.25rem",
            }}
          >
            Preview equations, compare revisions, and convert Word files to{" "}
            <code
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "0.9em",
                background: "var(--surface2)",
                border: "1px solid var(--border)",
                padding: "0.05em 0.4em",
                borderRadius: 4,
                color: "var(--fg)",
              }}
            >
              .tex
            </code>
            {" "}— all in a tab, no account, nothing to install.
          </p>

          <div
            style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}
          >
            <Link
              href="/tools/preview"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.75rem 1.75rem",
                borderRadius: 8,
                background: "linear-gradient(135deg, var(--accent), var(--accent2))",
                color: "#fff",
                fontWeight: 700,
                fontSize: "0.95rem",
                textDecoration: "none",
                boxShadow: "0 4px 18px color-mix(in srgb, var(--accent) 45%, transparent)",
              }}
            >
              Open Preview
            </Link>
            <Link
              href="/tools/templates"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.75rem 1.5rem",
                borderRadius: 8,
                background: "var(--surface)",
                color: "var(--fg)",
                fontWeight: 600,
                fontSize: "0.95rem",
                textDecoration: "none",
                border: "1px solid var(--border)",
              }}
            >
              Browse templates
            </Link>
          </div>

          <p
            style={{
              marginTop: "1.75rem",
              fontSize: "0.78rem",
              color: "var(--fg-muted)",
              letterSpacing: "0.01em",
            }}
          >
            Works in any browser · Files never stored · Open source
          </p>
        </div>
      </section>

      {/* ── Tools ────────────────────────────────────────────── */}
      <section
        style={{
          padding: "1rem 1.5rem 3rem",
          maxWidth: 1100,
          margin: "0 auto",
          width: "100%",
        }}
      >
        <h2
          style={{
            fontSize: "1rem",
            fontWeight: 600,
            marginBottom: "1.25rem",
            color: "var(--fg-muted)",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          Four tools
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "1rem",
          }}
        >
          {tools.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="tool-card"
              style={{ textDecoration: "none" }}
            >
              <div
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  padding: "1.5rem",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "0.25rem",
                  }}
                >
                  <span
                    style={{
                      fontSize: "1.3rem",
                      lineHeight: 1,
                      fontWeight: 700,
                      color: "var(--fg-muted)",
                      fontFamily: "monospace",
                    }}
                  >
                    {tool.icon}
                  </span>
                  <span
                    style={{
                      fontSize: "0.65rem",
                      fontWeight: 700,
                      letterSpacing: "0.06em",
                      padding: "0.18rem 0.5rem",
                      borderRadius: 999,
                      background: `${tool.badgeColor}1a`,
                      color: tool.badgeColor,
                      border: `1px solid ${tool.badgeColor}3a`,
                    }}
                  >
                    {tool.badge}
                  </span>
                </div>
                <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--fg)" }}>
                  {tool.title}
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--accent2)", fontWeight: 500 }}>
                  {tool.subtitle}
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.84rem",
                    color: "var(--fg-muted)",
                    lineHeight: 1.65,
                    flex: 1,
                  }}
                >
                  {tool.description}
                </p>
                <span
                  style={{
                    marginTop: "0.5rem",
                    fontSize: "0.8rem",
                    color: "var(--accent)",
                    fontWeight: 600,
                  }}
                >
                  Open →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Ad unit ──────────────────────────────────────────── */}
      <div style={{ maxWidth: 1100, margin: "0 auto", width: "100%", padding: "0 1.5rem" }}>
        <AdUnit />
      </div>

      {/* ── Honest pitch ─────────────────────────────────────── */}
      <section
        style={{
          padding: "2rem 1.5rem 4rem",
          maxWidth: 1100,
          margin: "0 auto",
          width: "100%",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "4rem",
            alignItems: "start",
          }}
          className="pitch-grid"
        >
          <div>
            <h2
              style={{
                fontSize: "clamp(1.4rem, 3vw, 1.9rem)",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                lineHeight: 1.25,
                marginBottom: "1rem",
                color: "var(--fg)",
              }}
            >
              For the quick things
              <br />
              Overleaf isn&apos;t designed for.
            </h2>
            <p
              style={{
                fontSize: "0.92rem",
                color: "var(--fg-muted)",
                lineHeight: 1.8,
                maxWidth: 420,
              }}
            >
              Overleaf is excellent for collaborative editing and full document
              compilation. But when you want to check if a formula renders correctly,
              spot what changed between two drafts, or pull LaTeX out of a Word document
              your advisor sent — you don&apos;t want to log in and wait. latexci is
              for those moments.
            </p>
          </div>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "1rem", paddingTop: "0.25rem" }}
          >
            {[
              {
                label: "Everything in your browser",
                detail: "Preview and diff run locally. No server sees your LaTeX source.",
              },
              {
                label: "Math that actually renders",
                detail: "KaTeX handles inline, display, align, gather, and custom environments.",
              },
              {
                label: "Shareable in one click",
                detail: "Every document compresses into a URL. Send it to a collaborator.",
              },
              {
                label: "For researchers, by default",
                detail: "PhD thesis templates, advisor diff workflow, essential package guide.",
              },
            ].map((item) => (
              <div key={item.label} style={{ display: "flex", gap: "0.9rem", alignItems: "flex-start" }}>
                <span
                  style={{
                    marginTop: "0.2rem",
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "var(--accent)",
                    flexShrink: 0,
                  }}
                />
                <div>
                  <div
                    style={{ fontWeight: 600, fontSize: "0.88rem", color: "var(--fg)", marginBottom: "0.15rem" }}
                  >
                    {item.label}
                  </div>
                  <div style={{ fontSize: "0.82rem", color: "var(--fg-muted)", lineHeight: 1.6 }}>
                    {item.detail}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <style>{`
          @media (max-width: 680px) {
            .pitch-grid { grid-template-columns: 1fr !important; gap: 2rem !important; }
          }
        `}</style>
      </section>

      {/* ── Academics callout ────────────────────────────────── */}
      <section
        style={{
          padding: "0 1.5rem 4rem",
          maxWidth: 1100,
          margin: "0 auto",
          width: "100%",
        }}
      >
        <Link href="/academics" style={{ textDecoration: "none", display: "block" }}>
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: "2rem 2.25rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "2rem",
              flexWrap: "wrap",
              transition: "border-color 0.18s",
            }}
            className="callout-card"
          >
            <div>
              <p
                style={{
                  margin: "0 0 0.5rem",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  color: "var(--accent2)",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                For PhD students & researchers
              </p>
              <h2
                style={{ margin: "0 0 0.5rem", fontSize: "1.25rem", fontWeight: 700, color: "var(--fg)" }}
              >
                Writing a thesis?
              </h2>
              <p
                style={{
                  margin: 0,
                  fontSize: "0.87rem",
                  color: "var(--fg-muted)",
                  lineHeight: 1.7,
                  maxWidth: 480,
                }}
              >
                PhD thesis templates, a 12-package reference guide, advisor diff
                workflow, and a dedicated section for heavy academic documents.
              </p>
            </div>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.65rem 1.4rem",
                borderRadius: 8,
                background: "linear-gradient(135deg, var(--accent), var(--accent2))",
                color: "#fff",
                fontWeight: 700,
                fontSize: "0.88rem",
                flexShrink: 0,
              }}
            >
              Academics hub →
            </span>
          </div>
        </Link>

        <style>{`
          .callout-card:hover { border-color: var(--accent) !important; }
        `}</style>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────── */}
      <section
        style={{
          padding: "0 1.5rem 5rem",
          maxWidth: 740,
          margin: "0 auto",
          width: "100%",
        }}
      >
        <h2
          style={{
            fontSize: "1.3rem",
            fontWeight: 700,
            marginBottom: "1.75rem",
            color: "var(--fg)",
          }}
        >
          Questions
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {faqs.map(({ q, a }) => (
            <div
              key={q}
              style={{
                padding: "1.1rem 1.4rem",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 9,
              }}
            >
              <div
                style={{ fontWeight: 600, fontSize: "0.91rem", marginBottom: "0.4rem", color: "var(--fg)" }}
              >
                {q}
              </div>
              <div style={{ fontSize: "0.84rem", color: "var(--fg-muted)", lineHeight: 1.7 }}>
                {a}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer
        style={{
          marginTop: "auto",
          borderTop: "1px solid var(--border)",
          background: "var(--surface)",
          padding: "1.5rem",
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            display: "flex",
            flexWrap: "wrap",
            gap: "1.5rem",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: "0.6rem" }}>
            <span
              style={{
                fontWeight: 800,
                background: "linear-gradient(135deg, var(--accent), var(--accent2))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              latexci
            </span>
            <span style={{ color: "var(--fg-muted)", fontSize: "0.8rem" }}>
              Free LaTeX tools · MIT License
            </span>
          </div>
          <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap" }}>
            {[
              ["Academics", "/academics"],
              ["Preview", "/tools/preview"],
              ["Diff", "/tools/diff"],
              ["Word → LaTeX", "/tools/word-to-latex"],
              ["Table Generator", "/tools/table"],
              ["Templates", "/tools/templates"],
              ["GitHub", "https://github.com/Sitraka17/latexci-web"],
            ].map(([label, href]) => (
              <a
                key={label}
                href={href}
                style={{ fontSize: "0.82rem", color: "var(--fg-muted)", textDecoration: "none" }}
                {...(href.startsWith("http")
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
