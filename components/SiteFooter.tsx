import Link from "next/link";

// Server component: the footer is static links, so it ships no client JS.
// Hover effects are plain CSS (.ft-* rules in app/globals.css) instead of the former
// onMouseEnter/onMouseLeave handlers, which forced hydration on every page.

const TOOLS = [
  { label: "Live Preview",   href: "/tools/preview" },
  { label: "BibTeX Tools",   href: "/tools/bibtex" },
  { label: "DOI → BibTeX",   href: "/tools/doi-to-bibtex" },
  { label: "arXiv → BibTeX", href: "/tools/arxiv-to-bibtex" },
  { label: "PubMed → BibTeX",href: "/tools/pubmed-to-bibtex" },
  { label: "ISBN → BibTeX",  href: "/tools/isbn-to-bibtex" },
  { label: "LaTeX Diff",     href: "/tools/diff" },
  { label: "Word → LaTeX",   href: "/tools/word-to-latex" },
  { label: "Symbol Search",  href: "/tools/symbols" },
  { label: "Table Generator",href: "/tools/table" },
  { label: "Templates",      href: "/tools/templates" },
  { label: "CV Generator",   href: "/tools/cv-builder" },
];

const LEARN = [
  { label: "Academics hub",  href: "/academics" },
  { label: "Life after Overleaf", href: "/after-overleaf" },
  { label: "Pricing",        href: "/pricing" },
  { label: "GitHub",         href: "https://github.com/Sitraka17/latexci-web", external: true },
];

const COMMUNITY = [
  { label: "💬 Discord",     href: "https://discord.gg/latexci", external: true, accent: true },
  { label: "GitHub Issues",  href: "https://github.com/Sitraka17/latexci-web/issues", external: true },
  { label: "Feature Requests", href: "https://github.com/Sitraka17/latexci-web/discussions", external: true },
];

const YEAR = new Date().getFullYear();

const headingStyle = {
  fontSize: "0.7rem", fontWeight: 700, color: "var(--fg-muted)",
  letterSpacing: "0.1em", textTransform: "uppercase" as const, margin: "0 0 0.9rem",
};

function FooterLink({ href, label, external, accent }: { href: string; label: string; external?: boolean; accent?: boolean }) {
  const cls = accent ? "ft-link ft-link-accent" : "ft-link";
  return external ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>{label}</a>
  ) : (
    <Link href={href} className={cls}>{label}</Link>
  );
}

export default function SiteFooter() {
  return (
    <footer style={{ borderTop: "1px solid var(--border)", background: "var(--surface)", marginTop: "auto" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "3rem 1.5rem 1.75rem" }}>

        {/* ── Top grid ───────────────────────────────────────────────── */}
        <div className="footer-grid" style={{ display: "grid", gap: "2.5rem", marginBottom: "2.5rem" }}>

          {/* Brand column */}
          <div>
            <div style={{
              fontWeight: 800, fontSize: "1.1rem", letterSpacing: "-0.03em",
              background: "linear-gradient(135deg, var(--accent), var(--accent2))",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              marginBottom: "0.6rem",
            }}>
              latexci
            </div>
            <p style={{
              fontSize: "0.82rem", color: "var(--fg-muted)", lineHeight: 1.75,
              maxWidth: 260, margin: "0 0 1.1rem",
            }}>
              Free, open-source LaTeX tools for researchers and students.
              No signup, no tracking, works in any browser.
            </p>
            <a
              href="https://github.com/Sitraka17/latexci-web"
              target="_blank"
              rel="noopener noreferrer"
              className="ft-star"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              Star on GitHub
            </a>

            {/* Support the project */}
            <a
              href="https://buymeacoffee.com/sitraka"
              target="_blank"
              rel="noopener noreferrer"
              className="ft-coffee"
            >
              <span aria-hidden="true">☕</span>
              Buy me a coffee
            </a>
          </div>

          {/* Tools column */}
          <div>
            <p style={headingStyle}>Tools</p>
            <nav aria-label="Footer tools links">
              <div className="ft-col">
                {TOOLS.map(({ label, href }) => <FooterLink key={href} href={href} label={label} />)}
              </div>
            </nav>
          </div>

          {/* Learn column */}
          <div>
            <p style={headingStyle}>Learn</p>
            <nav aria-label="Footer learn links">
              <div className="ft-col">
                {LEARN.map((l) => <FooterLink key={l.href} {...l} />)}
              </div>
            </nav>
          </div>

          {/* Community column */}
          <div>
            <p style={headingStyle}>Community</p>
            <nav aria-label="Footer community links">
              <div className="ft-col">
                {COMMUNITY.map((l) => <FooterLink key={l.href} {...l} />)}
              </div>
            </nav>
          </div>
        </div>

        {/* ── Bottom bar ─────────────────────────────────────────────── */}
        <div style={{
          borderTop: "1px solid var(--border)", paddingTop: "1.25rem",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: "0.75rem",
        }}>
          <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--fg-muted)" }}>
            © {YEAR} latexci · Open source under the{" "}
            <a href="https://github.com/Sitraka17/latexci-web/blob/main/LICENSE"
              target="_blank" rel="noopener noreferrer"
              style={{ color: "var(--accent)", textDecoration: "none" }}>
              MIT License
            </a>
          </p>
          <div style={{ display: "flex", gap: "1.25rem" }}>
            {[
              { label: "Privacy", href: "/privacy" },
              { label: "Terms",   href: "/terms" },
            ].map(({ label, href }) => (
              <Link key={href} href={href} style={{ fontSize: "0.75rem", color: "var(--fg-muted)", textDecoration: "none" }}>
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>

    </footer>
  );
}
