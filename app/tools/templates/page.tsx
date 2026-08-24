import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";
import Link from "next/link";
import TemplatesFilter from "@/components/TemplatesFilter";
import { breadcrumbSchema } from "@/lib/breadcrumbs";
import { TEMPLATES } from "@/lib/templates";

export const metadata: Metadata = {
  title: "Free LaTeX Templates — NeurIPS, ICML, ACL, CV, PhD Thesis & More",
  description:
    "28 free LaTeX templates — NeurIPS, ICML, ACL, Nature, PhD thesis, CV, Beamer, and more. Open any template instantly in the browser. No download, no signup.",
  keywords: [
    "free latex templates",
    "neurips latex template 2024",
    "icml paper template",
    "acl emnlp latex template",
    "nature latex template",
    "latex cv template",
    "beamer presentation template",
    "phd thesis latex template",
    "latex academic paper template",
    "latex conference paper template",
    "latex cover letter",
    "math assignment latex",
    "centrale marseille latex",
    "amse working paper template",
    "ml paper latex template",
    "nlp paper latex template",
  ],
  alternates: { canonical: "/tools/templates" },
  openGraph: {
    title: "Free LaTeX Templates — NeurIPS, ICML, ACL, CV, PhD Thesis",
    description:
      "28 free LaTeX templates: NeurIPS, ICML, ACL, Nature, thesis, CV, Beamer. Click to open in the live editor instantly.",
    url: "/tools/templates",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free LaTeX Templates — latexci",
    description:
      "NeurIPS 2024, ICML, ACL, Nature style, PhD thesis, CV with photo, Beamer. All free, open in browser.",
  },
};

export default function TemplatesPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema({ name: "LaTeX Templates", path: "/tools/templates" })) }} />
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
          <p style={{ color: "var(--fg-muted)", fontSize: "0.92rem", maxWidth: 540, margin: 0 }}>
            28 free templates — NeurIPS, ICML, ACL, Nature, PhD thesis, CV, Beamer.
            Click any template to open it in the live editor. No download, no signup.
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
            common LaTeX use cases: <strong style={{color:"var(--fg)"}}>NeurIPS 2024</strong>, <strong style={{color:"var(--fg)"}}>ICML</strong>, <strong style={{color:"var(--fg)"}}>ACL/EMNLP/NAACL</strong>,{" "}
            <strong style={{color:"var(--fg)"}}>Nature/Science style</strong> manuscripts,
            PhD and Master&apos;s thesis, CVs for researchers and PhD students (French &amp; English),
            Beamer presentations, math homework with theorem environments, cover letters,
            and Centrale Marseille / AMSE institutional reports.
            Each template opens directly in the latexci live preview editor — see the rendered
            output immediately and edit the source, no local LaTeX installation required.
          </p>
        </section>

        {/* Crawlable directory — each template also has its own detail page (SEO). */}
        <section style={{ padding: "2.5rem 1.5rem 3.5rem", borderTop: "1px solid var(--border)" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "0.4rem" }}>
              All templates, one page each
            </h2>
            <p style={{ color: "var(--fg-muted)", fontSize: "0.9rem", lineHeight: 1.7, margin: "0 0 1.25rem", maxWidth: 640 }}>
              Prefer a direct link? Each template has its own page with the full source, the packages it
              uses, and a one-click “open in editor”.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {TEMPLATES.map((t) => (
                <Link
                  key={t.id}
                  href={`/tools/templates/${t.id}`}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "0.45rem",
                    padding: "0.4rem 0.8rem", borderRadius: 8,
                    border: "1px solid var(--border)", background: "var(--surface2)",
                    fontSize: "0.83rem", color: "var(--fg-muted)", textDecoration: "none",
                  }}
                >
                  <span aria-hidden="true">{t.icon}</span> {t.title}
                </Link>
              ))}
            </div>
          </div>
        </section>
      </div>

      <SiteFooter />
    </div>
  );
}
