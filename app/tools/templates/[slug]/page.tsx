import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";
import CopyButton from "@/components/CopyButton";
import { breadcrumbSchema } from "@/lib/breadcrumbs";
import {
  allTemplateIds,
  templateById,
  relatedTemplates,
  templateEditorHref,
  templatePackages,
  templateDocumentClass,
} from "@/lib/seo-pages";

export const dynamicParams = false;

export function generateStaticParams() {
  return allTemplateIds().map((slug) => ({ slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const t = templateById(slug);
  if (!t) return {};
  const path = `/tools/templates/${slug}`;
  return {
    title: `${t.title} — Free LaTeX Template`,
    description: `${t.desc} Open this ${t.category.toLowerCase()} template in the browser editor — no install, no signup — or copy the full source.`,
    alternates: { canonical: path },
    openGraph: {
      title: `${t.title} — Free LaTeX Template`,
      description: t.desc,
      url: path,
      type: "website",
    },
    twitter: { card: "summary_large_image", title: `${t.title} — Free LaTeX Template` },
  };
}

const wrap: CSSProperties = { maxWidth: 860, margin: "0 auto", padding: "2.5rem 1.5rem 3.5rem" };
const h2: CSSProperties = { color: "var(--fg)", fontSize: "1.25rem", fontWeight: 700, letterSpacing: "-0.02em", margin: "2.5rem 0 0.9rem" };
const para: CSSProperties = { color: "var(--fg-muted)", fontSize: "0.95rem", lineHeight: 1.75, margin: "0 0 1rem" };
const chip: CSSProperties = {
  fontFamily: "var(--font-mono), monospace", fontSize: "0.75rem",
  padding: "0.2rem 0.55rem", borderRadius: 999,
  background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--fg-muted)",
};

export default async function TemplatePage({ params }: Props) {
  const { slug } = await params;
  const t = templateById(slug);
  if (!t) notFound();

  const editorHref = templateEditorHref(t);
  const packages = templatePackages(t);
  const docClass = templateDocumentClass(t);
  const lineCount = t.source.split("\n").length;
  const related = relatedTemplates(t);

  const faqs = [
    {
      q: `Is the ${t.title} template free?`,
      a: "Yes — every latexci template is free, open-source, and needs no signup. Open it in the browser editor or copy the full source.",
    },
    {
      q: "How do I use this template?",
      a: "Click “Open in editor” to load it straight into the live LaTeX preview, or copy the source into Overleaf or your local TeX editor (TeX Live, MiKTeX).",
    },
  ];
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  const swSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareSourceCode",
    name: `${t.title} LaTeX template`,
    description: t.desc,
    programmingLanguage: "LaTeX",
    codeRepository: "https://github.com/Sitraka17/latexci-web",
    license: "https://opensource.org/licenses/MIT",
    url: `https://latexci.com/tools/templates/${slug}`,
  };
  const breadcrumb = breadcrumbSchema(
    { name: "LaTeX Templates", path: "/tools/templates" },
    { name: t.title, path: `/tools/templates/${slug}` },
  );

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(swSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <Navbar />
      <main style={{ flex: 1 }}>
        <div style={wrap}>
          <nav aria-label="Breadcrumb" style={{ fontSize: "0.8rem", color: "var(--fg-muted)", marginBottom: "1.5rem" }}>
            <Link href="/tools/templates" style={{ color: "var(--accent)", textDecoration: "none" }}>LaTeX templates</Link>
            <span style={{ margin: "0 0.5rem" }}>›</span>
            <span>{t.title}</span>
          </nav>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "1.9rem", lineHeight: 1 }} aria-hidden="true">{t.icon}</span>
            <h1 style={{ color: "var(--fg)", fontSize: "1.9rem", fontWeight: 800, letterSpacing: "-0.03em", margin: 0 }}>
              {t.title} LaTeX Template
            </h1>
          </div>
          <p style={{ ...para, marginBottom: "1.5rem" }}>{t.desc}</p>

          {/* Actions */}
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center", marginBottom: "1.25rem" }}>
            <Link
              href={editorHref}
              style={{
                display: "inline-flex", alignItems: "center", gap: "0.4rem",
                padding: "0.55rem 1.1rem", borderRadius: 8,
                background: "var(--accent)", color: "#fff", fontWeight: 700,
                fontSize: "0.9rem", textDecoration: "none",
              }}
            >
              ✦ Open in editor
            </Link>
            <CopyButton text={t.source} label="Copy source" />
            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
              <span style={chip}>{t.category}</span>
              {docClass && <span style={chip}>{docClass}</span>}
              <span style={chip}>{lineCount} lines</span>
            </div>
          </div>

          {/* What's included */}
          {packages.length > 0 && (
            <>
              <h2 style={h2}>What&rsquo;s included</h2>
              <p style={para}>
                This template builds on the{" "}
                {docClass ? <><code style={{ fontFamily: "var(--font-mono), monospace" }}>{docClass}</code> document class and </> : null}
                the following packages, already wired up in the preamble:
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "1rem" }}>
                {packages.map((p) => <span key={p} style={chip}>{p}</span>)}
              </div>
            </>
          )}

          {/* Full source */}
          <h2 style={h2}>Full source</h2>
          <p style={para}>
            Copy it, or hit <strong>Open in editor</strong> to load it into the live preview and start editing immediately.
          </p>
          <div style={{
            position: "relative", background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: 10, overflow: "hidden",
          }}>
            <div style={{ display: "flex", justifyContent: "flex-end", padding: "0.5rem 0.6rem", borderBottom: "1px solid var(--border)" }}>
              <CopyButton text={t.source} label="Copy" />
            </div>
            <pre style={{ margin: 0, padding: "1rem 1.25rem", overflowX: "auto", fontSize: "0.8rem", lineHeight: 1.6 }}>
              <code style={{ fontFamily: "var(--font-mono), monospace", color: "var(--fg)", whiteSpace: "pre" }}>{t.source}</code>
            </pre>
          </div>

          {/* Related */}
          {related.length > 0 && (
            <>
              <h2 style={h2}>Related templates</h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {related.map((r) => (
                  <Link
                    key={r.id}
                    href={`/tools/templates/${r.id}`}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: "0.45rem",
                      padding: "0.4rem 0.8rem", borderRadius: 8,
                      border: "1px solid var(--border)", background: "var(--surface2)",
                      fontSize: "0.85rem", color: "var(--fg-muted)", textDecoration: "none",
                    }}
                  >
                    <span aria-hidden="true">{r.icon}</span> {r.title}
                  </Link>
                ))}
              </div>
              <p style={{ ...para, marginTop: "1rem" }}>
                <Link href="/tools/templates" style={{ color: "var(--accent)" }}>Browse all free LaTeX templates →</Link>
              </p>
            </>
          )}

          {/* FAQ */}
          <h2 style={h2}>FAQ</h2>
          {faqs.map((f) => (
            <div key={f.q} style={{ marginBottom: "1.1rem" }}>
              <h3 style={{ color: "var(--fg)", fontSize: "0.98rem", fontWeight: 600, margin: "0 0 0.3rem" }}>{f.q}</h3>
              <p style={{ ...para, margin: 0 }}>{f.a}</p>
            </div>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
