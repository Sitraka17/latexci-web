import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import LZString from "lz-string";
import { TEMPLATES, CATEGORIES } from "@/lib/templates";

export const metadata: Metadata = {
  title: "Free LaTeX Templates — Academic, CV, Beamer & More",
  description:
    "Browse free LaTeX templates: academic papers, CVs, Beamer presentations, math assignments, cover letters, and lab reports. Open any template in the browser — no download, no signup.",
  alternates: { canonical: "https://latexci-web.vercel.app/tools/templates" },
};

export default function TemplatesPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "3rem 1.5rem", width: "100%", flex: 1 }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <h1 style={{
            fontSize: "2rem", fontWeight: 900, letterSpacing: "-0.02em",
            background: "linear-gradient(135deg, var(--accent), var(--accent2))",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            marginBottom: "0.5rem",
          }}>
            Free LaTeX Templates
          </h1>
          <p style={{ color: "var(--fg-muted)", fontSize: "1rem", maxWidth: 520, margin: "0 auto" }}>
            Click any template to open it instantly in the live preview editor.
            No download, no signup required.
          </p>
        </div>

        {/* Category pills */}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "2rem" }}>
          {CATEGORIES.map(cat => (
            <span key={cat} style={{
              padding: "0.25rem 0.8rem", borderRadius: 999, fontSize: "0.78rem", fontWeight: 500,
              background: "var(--surface)", border: "1px solid var(--border)", color: "var(--fg-muted)",
            }}>{cat}</span>
          ))}
        </div>

        {/* Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "1.25rem",
        }}>
          {TEMPLATES.map(t => {
            const encoded = LZString.compressToEncodedURIComponent(t.source);
            const href = `/tools/preview#s=${encoded}`;
            return (
              <article key={t.id} style={{
                background: "var(--surface)", border: "1px solid var(--border)",
                borderRadius: 12, padding: "1.5rem", display: "flex",
                flexDirection: "column", gap: "0.6rem",
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "2rem" }} aria-hidden="true">{t.icon}</span>
                  <span style={{
                    fontSize: "0.68rem", fontWeight: 600, padding: "0.2rem 0.6rem",
                    borderRadius: 999, background: "var(--surface2)",
                    border: "1px solid var(--border)", color: "var(--fg-muted)",
                    letterSpacing: "0.04em",
                  }}>{t.category}</span>
                </div>
                <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "var(--fg)" }}>{t.title}</h2>
                <p style={{ margin: 0, fontSize: "0.83rem", color: "var(--fg-muted)", lineHeight: 1.55, flex: 1 }}>
                  {t.desc}
                </p>
                <Link href={href} style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  gap: "0.4rem", padding: "0.55rem 1rem", borderRadius: 7,
                  background: "linear-gradient(135deg, var(--accent), var(--accent2))",
                  color: "#fff", fontWeight: 600, fontSize: "0.85rem", textDecoration: "none",
                  marginTop: "0.25rem",
                }}>
                  ⚡ Open in Preview
                </Link>
              </article>
            );
          })}
        </div>

        {/* SEO content block */}
        <section style={{
          marginTop: "4rem", padding: "2rem", background: "var(--surface)",
          border: "1px solid var(--border)", borderRadius: 12,
        }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.75rem" }}>
            About these LaTeX templates
          </h2>
          <p style={{ fontSize: "0.88rem", color: "var(--fg-muted)", lineHeight: 1.75, margin: 0 }}>
            All templates are free to use and modify under the MIT license. They cover the most common
            LaTeX use cases: academic papers following standard journal formats, CVs for researchers and
            PhD students, Beamer presentations for conferences, math homework and problem sets with theorem
            environments, cover letters for job applications, and physics lab reports with SI units and error
            analysis. Each template opens directly in the latexci live preview editor so you can see the
            rendered output immediately and edit the source — no local LaTeX installation required.
          </p>
        </section>
      </div>

      {/* Footer */}
      <footer style={{
        borderTop: "1px solid var(--border)", padding: "1.25rem 1.5rem",
        textAlign: "center", color: "var(--fg-muted)", fontSize: "0.8rem",
        background: "var(--surface)",
      }}>
        <span style={{ fontWeight: 700, color: "var(--accent)" }}>latexci</span>
        {" "}· Free LaTeX tools for researchers &amp; students
      </footer>
    </div>
  );
}
