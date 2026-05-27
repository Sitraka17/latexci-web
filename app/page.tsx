import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";

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
    title: "LaTeX Preview",
    subtitle: "Instant live preview",
    description:
      "Paste your LaTeX source and see a live HTML preview with full KaTeX math rendering. Supports equations, sections, tables, lists, and more. Share your document via a URL.",
    badge: "Live",
    badgeColor: "#10b981",
    keywords: ["latex preview online", "latex to html"],
  },
  {
    href: "/tools/diff",
    icon: "🔍",
    title: "LaTeX Diff",
    subtitle: "Track your changes",
    description:
      "Compare two .tex files side-by-side. See additions in green and deletions in red. Drag and drop .tex files directly. Perfect for paper revisions and co-authoring.",
    badge: "Free",
    badgeColor: "#6c63ff",
    keywords: ["latex diff online", "latexdiff web"],
  },
  {
    href: "/tools/word-to-latex",
    icon: "📄",
    title: "Word → LaTeX",
    subtitle: "Convert .docx instantly",
    description:
      "Upload a .docx, .odt, or .rtf file and get clean LaTeX source. Powered by pandoc. Edit the result inline before downloading.",
    badge: "Upload",
    badgeColor: "#f59e0b",
    keywords: ["word to latex converter", "docx to tex"],
  },
  {
    href: "/tools/templates",
    icon: "📋",
    title: "LaTeX Templates",
    subtitle: "Start from a template",
    description:
      "Browse ready-to-use LaTeX templates: academic papers, CVs, Beamer presentations, cover letters, and more. One click to open in the preview editor.",
    badge: "New",
    badgeColor: "#ec4899",
    keywords: ["latex templates", "latex cv template"],
  },
];

const features = [
  { icon: "🔒", title: "Privacy first", desc: "Uploaded files are processed and immediately discarded. Nothing is stored or logged." },
  { icon: "🚀", title: "Zero friction", desc: "No signup, no account, no install. Open a tool and start working in seconds." },
  { icon: "🧮", title: "Real math rendering", desc: "KaTeX renders your equations — inline, display, align environments, all supported." },
  { icon: "🔗", title: "Shareable links", desc: "Every document in the preview editor can be shared via a URL. Works offline too." },
  { icon: "📱", title: "Mobile friendly", desc: "All tools work on tablets and mobile phones, not just desktop." },
  { icon: "⚙️", title: "Open source", desc: "The latexci CLI and this web app are fully open source on GitHub. Fork and self-host." },
];

const faqs = [
  { q: "Is latexci free?", a: "Yes, completely free. There is no paid plan. All tools work without creating an account." },
  { q: "Can I use latexci without Overleaf?", a: "Yes. latexci is a standalone set of tools that works entirely in your browser. No Overleaf connection is needed or used." },
  { q: "Does the LaTeX preview support math equations?", a: "Yes. The preview renders inline math ($...$), display math (\\[...\\]), and environments like align, gather, and equation via KaTeX — the same engine used by Khan Academy." },
  { q: "What file types does Word → LaTeX support?", a: "Currently .docx (Word 2007+), .odt (LibreOffice), and .rtf files. The conversion is powered by pandoc running on the server." },
  { q: "Is my LaTeX source stored on your servers?", a: "No. For the preview and diff tools, all processing happens locally in your browser. For the Word → LaTeX tool, the file is sent to our server, converted, and immediately deleted." },
  { q: "Can I use latexci offline?", a: "The preview and diff tools work fully offline after the page is loaded (math rendering uses the bundled KaTeX). The Word → LaTeX tool requires an internet connection." },
];

export default function HomePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(f => ({
      "@type": "Question",
      "name": f.q,
      "acceptedAnswer": { "@type": "Answer", "text": f.a },
    })),
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />

      {/* Hero */}
      <section
        style={{
          textAlign: "center",
          padding: "5rem 1.5rem 4rem",
          background: "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(108,99,255,0.18), transparent)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: "absolute", inset: 0,
            backgroundImage: "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
            backgroundSize: "40px 40px", opacity: 0.25,
            maskImage: "radial-gradient(ellipse 80% 60% at center, black, transparent)",
          }}
        />
        <div style={{ position: "relative", maxWidth: 760, margin: "0 auto" }}>
          <span style={{
            display: "inline-block", padding: "0.3rem 1rem", borderRadius: 999,
            border: "1px solid var(--border)", background: "var(--surface)",
            fontSize: "0.78rem", color: "var(--accent2)", fontWeight: 500,
            marginBottom: "1.5rem", letterSpacing: "0.05em",
          }}>
            FREE · OPEN SOURCE · NO SIGNUP
          </span>
          <h1 style={{
            fontSize: "clamp(2rem, 5vw, 3.4rem)", fontWeight: 900,
            lineHeight: 1.1, letterSpacing: "-0.03em", marginBottom: "1.25rem",
          }}>
            Free Online{" "}
            <span style={{
              background: "linear-gradient(135deg, var(--accent), var(--accent2))",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              LaTeX Tools
            </span>
            <br />for Researchers & Students
          </h1>
          <p style={{
            fontSize: "1.05rem", color: "var(--fg-muted)", lineHeight: 1.75,
            maxWidth: 560, margin: "0 auto 2.5rem",
          }}>
            Preview LaTeX with live math rendering, compare document versions with
            our diff tool, and convert Word files to .tex instantly — all in your browser,
            no account required.
          </p>
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/tools/preview" style={{
              display: "inline-flex", alignItems: "center", gap: "0.5rem",
              padding: "0.75rem 1.75rem", borderRadius: 8,
              background: "linear-gradient(135deg, var(--accent), var(--accent2))",
              color: "#fff", fontWeight: 700, fontSize: "0.95rem", textDecoration: "none",
              boxShadow: "0 0 30px rgba(108,99,255,0.35)",
            }}>
              ⚡ Try LaTeX Preview — free
            </Link>
            <a href="https://github.com/Sitraka17/latexci-web" target="_blank" rel="noopener noreferrer"
              style={{
                display: "inline-flex", alignItems: "center", gap: "0.5rem",
                padding: "0.75rem 1.5rem", borderRadius: 8,
                background: "var(--surface)", color: "var(--fg)", fontWeight: 600,
                fontSize: "0.95rem", textDecoration: "none", border: "1px solid var(--border)",
              }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              GitHub
            </a>
          </div>

          {/* Social proof bar */}
          <div style={{
            display: "flex", gap: "2rem", justifyContent: "center", marginTop: "3rem",
            flexWrap: "wrap",
          }}>
            {[
              ["100%", "Free forever"],
              ["0", "Signup required"],
              ["4", "Tools available"],
              ["∞", "Documents processed"],
            ].map(([stat, label]) => (
              <div key={label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--accent2)" }}>{stat}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--fg-muted)", marginTop: "0.2rem" }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tools grid */}
      <section style={{ padding: "4rem 1.5rem 2rem", maxWidth: 1100, margin: "0 auto", width: "100%" }}>
        <h2 style={{
          fontSize: "1.4rem", fontWeight: 700, textAlign: "center",
          marginBottom: "0.5rem", letterSpacing: "-0.01em",
        }}>
          All tools — free, no login
        </h2>
        <p style={{ textAlign: "center", color: "var(--fg-muted)", fontSize: "0.9rem", marginBottom: "2rem" }}>
          Click any tool to start instantly. No account or install needed.
        </p>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "1.25rem",
        }}>
          {tools.map((tool) => (
            <Link key={tool.href} href={tool.href} className="tool-card" style={{ textDecoration: "none" }}>
              <div style={{
                background: "var(--surface)", border: "1px solid var(--border)",
                borderRadius: 12, padding: "1.75rem", height: "100%",
                display: "flex", flexDirection: "column", gap: "0.6rem",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <span style={{ fontSize: "1.6rem" }}>{tool.icon}</span>
                  <span style={{
                    fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.06em",
                    padding: "0.2rem 0.55rem", borderRadius: 999,
                    background: `${tool.badgeColor}22`, color: tool.badgeColor,
                    border: `1px solid ${tool.badgeColor}44`,
                  }}>{tool.badge}</span>
                </div>
                <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "var(--fg)" }}>{tool.title}</h3>
                <div style={{ fontSize: "0.78rem", color: "var(--accent2)", fontWeight: 500 }}>{tool.subtitle}</div>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--fg-muted)", lineHeight: 1.6 }}>{tool.description}</p>
                <span style={{ marginTop: "auto", paddingTop: "0.5rem", fontSize: "0.82rem", color: "var(--accent)", fontWeight: 600 }}>
                  Open tool →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: "3rem 1.5rem", maxWidth: 900, margin: "0 auto", width: "100%", textAlign: "center" }}>
        <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "0.5rem" }}>Why latexci?</h2>
        <p style={{ color: "var(--fg-muted)", fontSize: "0.9rem", marginBottom: "2.5rem", maxWidth: 540, margin: "0 auto 2.5rem" }}>
          Overleaf is great for collaborative editing, but sometimes you just need a quick preview or a diff. latexci fills that gap — no signup, no friction.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
          {features.map(f => (
            <div key={f.title} style={{
              padding: "1.25rem", background: "var(--surface)", border: "1px solid var(--border)",
              borderRadius: 10, display: "flex", gap: "0.75rem", alignItems: "flex-start", textAlign: "left",
            }}>
              <span style={{ fontSize: "1.3rem", flexShrink: 0 }}>{f.icon}</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.88rem", marginBottom: "0.25rem" }}>{f.title}</div>
                <div style={{ fontSize: "0.8rem", color: "var(--fg-muted)", lineHeight: 1.55 }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: "3rem 1.5rem 5rem", maxWidth: 760, margin: "0 auto", width: "100%" }}>
        <h2 style={{ fontSize: "1.4rem", fontWeight: 700, textAlign: "center", marginBottom: "2rem" }}>
          Frequently asked questions
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {faqs.map(({ q, a }) => (
            <div key={q} style={{
              padding: "1.25rem 1.5rem", background: "var(--surface)",
              border: "1px solid var(--border)", borderRadius: 10,
            }}>
              <div style={{ fontWeight: 600, fontSize: "0.92rem", marginBottom: "0.4rem" }}>{q}</div>
              <div style={{ fontSize: "0.85rem", color: "var(--fg-muted)", lineHeight: 1.65 }}>{a}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        marginTop: "auto", borderTop: "1px solid var(--border)",
        padding: "1.5rem", background: "var(--surface)",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", flexWrap: "wrap", gap: "1.5rem", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <span style={{ fontWeight: 800, background: "linear-gradient(135deg, var(--accent), var(--accent2))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>latexci</span>
            <span style={{ color: "var(--fg-muted)", fontSize: "0.8rem", marginLeft: "0.5rem" }}>Free LaTeX tools for everyone</span>
          </div>
          <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
            {[
              ["Preview", "/tools/preview"],
              ["Diff", "/tools/diff"],
              ["Word → LaTeX", "/tools/word-to-latex"],
              ["Templates", "/tools/templates"],
              ["GitHub", "https://github.com/Sitraka17/latexci-web"],
            ].map(([label, href]) => (
              <a key={label} href={href} style={{ fontSize: "0.82rem", color: "var(--fg-muted)", textDecoration: "none" }}
                {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                {label}
              </a>
            ))}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--fg-muted)" }}>Open source · MIT License</div>
        </div>
      </footer>
    </div>
  );
}
