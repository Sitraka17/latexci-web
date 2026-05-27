import Link from "next/link";

const NAV = [
  { label: "Academics",      href: "/academics" },
  { label: "Preview",        href: "/tools/preview" },
  { label: "Diff",           href: "/tools/diff" },
  { label: "Word → LaTeX",   href: "/tools/word-to-latex" },
  { label: "Table",          href: "/tools/table" },
  { label: "Templates",      href: "/tools/templates" },
  { label: "GitHub",         href: "https://github.com/Sitraka17/latexci-web", external: true },
];

export default function SiteFooter() {
  return (
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
          gap: "1.25rem",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: "0.6rem" }}>
          <span
            style={{
              fontWeight: 800,
              fontSize: "0.95rem",
              background: "linear-gradient(135deg, var(--accent), var(--accent2))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            latexci
          </span>
          <span style={{ color: "var(--fg-muted)", fontSize: "0.78rem" }}>
            Free LaTeX tools · MIT License
          </span>
        </div>

        <nav aria-label="Footer links">
          <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap" }}>
            {NAV.map(({ label, href, external }) => (
              <Link
                key={label}
                href={href}
                style={{
                  fontSize: "0.8rem",
                  color: "var(--fg-muted)",
                  textDecoration: "none",
                }}
                {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              >
                {label}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </footer>
  );
}
