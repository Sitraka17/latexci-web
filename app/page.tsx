import Link from "next/link";
import Navbar from "@/components/Navbar";

const tools = [
  {
    href: "/tools/preview",
    icon: "⚡",
    title: "LaTeX Preview",
    description:
      "Paste your LaTeX source and see a live HTML preview instantly. Math rendered via KaTeX. No install needed.",
    badge: "Live",
    badgeColor: "#10b981",
  },
  {
    href: "/tools/diff",
    icon: "🔍",
    title: "LaTeX Diff",
    description:
      "Compare two .tex files side-by-side. See additions in green and deletions in red — perfect for revision tracking.",
    badge: "Free",
    badgeColor: "#6c63ff",
  },
  {
    href: "/tools/word-to-latex",
    icon: "📄",
    title: "Word → LaTeX",
    description:
      "Upload a .docx file and get clean LaTeX source back. Powered by pandoc. Great for converting existing documents.",
    badge: "Upload",
    badgeColor: "#f59e0b",
  },
];

const features = [
  { icon: "🔒", title: "Privacy first", desc: "Files processed server-side and immediately discarded. Nothing stored." },
  { icon: "🚀", title: "No install", desc: "Everything runs in your browser or on our edge servers. Zero setup." },
  { icon: "🎨", title: "Beautiful output", desc: "Clean HTML with math support via KaTeX, syntax highlighting, and more." },
  { icon: "⚙️", title: "Open source", desc: "The CLI tool behind this site is fully open source on GitHub." },
];

export default function HomePage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />

      {/* Hero */}
      <section
        style={{
          textAlign: "center",
          padding: "5rem 1.5rem 4rem",
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(108,99,255,0.15), transparent)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
            opacity: 0.3,
            maskImage: "radial-gradient(ellipse 80% 60% at center, black, transparent)",
          }}
        />

        <div style={{ position: "relative", maxWidth: 700, margin: "0 auto" }}>
          <span
            style={{
              display: "inline-block",
              padding: "0.3rem 1rem",
              borderRadius: 999,
              border: "1px solid var(--border)",
              background: "var(--surface)",
              fontSize: "0.78rem",
              color: "var(--accent2)",
              fontWeight: 500,
              marginBottom: "1.5rem",
              letterSpacing: "0.05em",
            }}
          >
            FREE · BROWSER-BASED · OPEN SOURCE
          </span>

          <h1
            style={{
              fontSize: "clamp(2.2rem, 5vw, 3.5rem)",
              fontWeight: 900,
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              marginBottom: "1.25rem",
            }}
          >
            LaTeX tools for{" "}
            <span
              style={{
                background: "linear-gradient(135deg, var(--accent), var(--accent2))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              everyone
            </span>
          </h1>

          <p
            style={{
              fontSize: "1.1rem",
              color: "var(--fg-muted)",
              lineHeight: 1.7,
              maxWidth: 520,
              margin: "0 auto 2.5rem",
            }}
          >
            Preview, diff, and convert LaTeX documents directly in your browser.
            No account. No install. Just paste and go.
          </p>

          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link
              href="/tools/preview"
              style={{
                display: "inline-block",
                padding: "0.7rem 1.75rem",
                borderRadius: 8,
                background: "linear-gradient(135deg, var(--accent), var(--accent2))",
                color: "#fff",
                fontWeight: 700,
                fontSize: "0.95rem",
                textDecoration: "none",
                boxShadow: "0 0 30px rgba(108,99,255,0.3)",
              }}
            >
              Try LaTeX Preview →
            </Link>
            <a
              href="https://github.com/Sitraka17/latexci"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-block",
                padding: "0.7rem 1.75rem",
                borderRadius: 8,
                background: "var(--surface)",
                color: "var(--fg)",
                fontWeight: 600,
                fontSize: "0.95rem",
                textDecoration: "none",
                border: "1px solid var(--border)",
              }}
            >
              GitHub ↗
            </a>
          </div>
        </div>
      </section>

      {/* Tools grid */}
      <section style={{ padding: "4rem 1.5rem", maxWidth: 1100, margin: "0 auto", width: "100%" }}>
        <h2
          style={{
            fontSize: "1.5rem",
            fontWeight: 700,
            textAlign: "center",
            marginBottom: "2.5rem",
            color: "var(--fg-muted)",
            letterSpacing: "-0.01em",
          }}
        >
          Tools
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "1.25rem",
          }}
        >
          {tools.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              style={{ textDecoration: "none" }}
            >
              <div
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  padding: "1.75rem",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <span style={{ fontSize: "1.75rem" }}>{tool.icon}</span>
                  <span
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      letterSpacing: "0.06em",
                      padding: "0.2rem 0.55rem",
                      borderRadius: 999,
                      background: `${tool.badgeColor}22`,
                      color: tool.badgeColor,
                      border: `1px solid ${tool.badgeColor}44`,
                    }}
                  >
                    {tool.badge}
                  </span>
                </div>
                <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "var(--fg)" }}>
                  {tool.title}
                </h3>
                <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--fg-muted)", lineHeight: 1.6 }}>
                  {tool.description}
                </p>
                <span
                  style={{
                    marginTop: "auto",
                    paddingTop: "0.5rem",
                    fontSize: "0.82rem",
                    color: "var(--accent)",
                    fontWeight: 600,
                  }}
                >
                  Open tool →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Features */}
      <section
        style={{
          padding: "0 1.5rem 5rem",
          maxWidth: 1100,
          margin: "0 auto",
          width: "100%",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "1.25rem",
          }}
        >
          {features.map((f) => (
            <div
              key={f.title}
              style={{
                padding: "1.25rem",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                display: "flex",
                gap: "1rem",
                alignItems: "flex-start",
              }}
            >
              <span style={{ fontSize: "1.4rem" }}>{f.icon}</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.9rem", marginBottom: "0.3rem" }}>{f.title}</div>
                <div style={{ fontSize: "0.82rem", color: "var(--fg-muted)", lineHeight: 1.55 }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          marginTop: "auto",
          borderTop: "1px solid var(--border)",
          padding: "1.25rem 1.5rem",
          textAlign: "center",
          color: "var(--fg-muted)",
          fontSize: "0.8rem",
          background: "var(--surface)",
        }}
      >
        Built with{" "}
        <a href="https://github.com/Sitraka17/latexci" style={{ color: "var(--accent)" }}>
          latexci
        </a>{" "}
        · Open source · Free forever
      </footer>
    </div>
  );
}
