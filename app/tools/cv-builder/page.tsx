import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";
import CvBuilder from "@/components/CvBuilder";
import Faq from "@/components/Faq";
import { breadcrumbSchema } from "@/lib/breadcrumbs";

export const metadata: Metadata = {
  title: "LaTeX CV Generator: Fill a Form, Get a Clean CV",
  description:
    "Build a LaTeX CV without writing LaTeX: fill in a form, pick an academic or industry layout in English or French, import publications from ORCID, then open it in Overleaf. Free, no signup.",
  keywords: [
    "latex cv generator", "latex cv builder", "latex resume generator", "academic cv latex",
    "cv latex template", "orcid cv", "générateur cv latex", "cv latex français",
  ],
  alternates: { canonical: "/tools/cv-builder" },
  openGraph: {
    title: "LaTeX CV Generator | latexci",
    description: "Fill a form, get a clean LaTeX CV. Academic or industry, English or French, ORCID import.",
    url: "/tools/cv-builder",
    type: "website",
  },
  twitter: { card: "summary_large_image", title: "LaTeX CV Generator | latexci" },
};

const FAQS = [
  {
    q: "Do I need to know LaTeX?",
    a: "No. You fill in plain text fields; special characters such as &, %, $ or _ are escaped for you, so the generated document always compiles. You can still edit the LaTeX afterwards.",
  },
  {
    q: "How do I get the PDF?",
    a: "Click \"Open in Overleaf\": your CV opens as a new Overleaf project and compiles there for free. You can also download the .tex file and compile it with any TeX distribution (pdfLaTeX).",
  },
  {
    q: "Is my data stored anywhere?",
    a: "Your draft stays in your browser (local storage) and is never sent to latexci. The only network call is the optional ORCID import, which sends your ORCID iD to orcid.org.",
  },
  {
    q: "What does the ORCID import fill in?",
    a: "Title, journal or venue, year and DOI of each public work on your ORCID record. ORCID summaries do not include co-authors, so add them yourself before exporting.",
  },
  {
    q: "Academic or industry layout?",
    a: "The academic layout follows the classic research CV (dated entries, publication list, small-caps headings). The industry layout is a compact one-page resume with bullet points, skill tags and an optional photo slot. Both exist in English and French.",
  },
];

const appSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "LaTeX CV Generator | latexci",
  description: "Form-based LaTeX CV generator with academic and industry layouts and ORCID import.",
  url: "https://latexci.com/tools/cv-builder",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Web Browser",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
};
const breadcrumb = breadcrumbSchema({ name: "CV Generator", path: "/tools/cv-builder" });

const para: CSSProperties = { color: "var(--fg-muted)", fontSize: "0.95rem", lineHeight: 1.75, margin: "0 0 1rem" };

export default function CvBuilderPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <Navbar />
      <main style={{ flex: 1 }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "2.25rem 1.5rem 3rem" }}>
          <h1 style={{ color: "var(--fg)", fontSize: "1.9rem", fontWeight: 800, letterSpacing: "-0.03em", margin: "0 0 0.4rem" }}>
            LaTeX CV generator
          </h1>
          <p style={{ ...para, maxWidth: 720 }}>
            Fill in the form, choose a layout, and get a clean LaTeX CV that compiles. Import your publications from
            ORCID, then open the result in Overleaf for the PDF. Built on the same layouts as our{" "}
            <Link href="/tools/templates/cv" style={{ color: "var(--accent)" }}>academic</Link> and{" "}
            <Link href="/tools/templates/cv-photo" style={{ color: "var(--accent)" }}>industry</Link> CV templates.
          </p>
          <CvBuilder />
        </div>

        <section aria-label="About the CV generator" style={{ background: "var(--surface)", borderTop: "1px solid var(--border)" }}>
          <div style={{ maxWidth: 820, margin: "0 auto", padding: "3rem 1.5rem" }}>
            <h2 style={{ color: "var(--fg)", fontSize: "1.4rem", fontWeight: 700, margin: "0 0 1rem" }}>Why a LaTeX CV</h2>
            <p style={para}>
              Academic hiring committees read many CVs, and a LaTeX CV is easy to recognise: consistent spacing, real
              small caps, a publication list that stays aligned over several pages. The catch has always been writing
              it. This generator removes that step: you type your details once, the LaTeX is produced for you, and you
              keep full control of the source if you want to adjust it.
            </p>
            <p style={para}>
              Looking for a different design? Browse the{" "}
              <Link href="/tools/templates" style={{ color: "var(--accent)" }}>free LaTeX templates</Link>, including
              French academic and industry CVs.
            </p>
            <h2 style={{ color: "var(--fg)", fontSize: "1.4rem", fontWeight: 700, margin: "2.25rem 0 1rem" }}>Frequently asked questions</h2>
            <Faq items={FAQS} name="cv-faq" />
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
