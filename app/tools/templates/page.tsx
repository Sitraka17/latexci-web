import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";
import TemplatesFilter from "@/components/TemplatesFilter";

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

      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "3rem 1.5rem",
          width: "100%",
          flex: 1,
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: "2.5rem" }}>
          <h1
            style={{
              fontSize: "clamp(1.6rem, 4vw, 2.2rem)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              marginBottom: "0.5rem",
              color: "var(--fg)",
            }}
          >
            LaTeX Templates
          </h1>
          <p style={{ color: "var(--fg-muted)", fontSize: "0.92rem", maxWidth: 480, margin: 0 }}>
            Click any template to open it instantly in the live preview editor.
            No download, no signup.
          </p>
        </div>

        {/* Filterable grid — client component */}
        <TemplatesFilter />

        {/* SEO block */}
        <section
          style={{
            marginTop: "4rem",
            padding: "1.75rem",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 10,
          }}
        >
          <h2
            style={{
              fontSize: "0.95rem",
              fontWeight: 700,
              marginBottom: "0.6rem",
              color: "var(--fg)",
            }}
          >
            About these templates
          </h2>
          <p
            style={{
              fontSize: "0.85rem",
              color: "var(--fg-muted)",
              lineHeight: 1.8,
              margin: 0,
            }}
          >
            All templates are free to use and modify under the MIT license. They cover the most
            common LaTeX use cases: academic papers in standard journal formats, CVs for researchers
            and PhD students, Beamer presentations for conferences, math homework with theorem
            environments, cover letters, and physics lab reports. Each template opens directly in
            the latexci live preview editor — see the rendered output immediately and edit the
            source, no local LaTeX installation required.
          </p>
        </section>
      </div>

      <SiteFooter />
    </div>
  );
}
