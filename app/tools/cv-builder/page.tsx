import type { Metadata } from "next";
import Link from "@/components/Link";
import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";
import CvBuilder from "@/components/CvBuilder";
import Faq from "@/components/Faq";
import { breadcrumbSchema } from "@/lib/breadcrumbs";
import "./cv.css";

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
    a: "The academic layout follows the classic research CV (dated entries, publication list, small-caps headings). The industry layout is a compact resume in the order recruiters read (profile, skills, experience, education), with a one-page option and an optional photo slot. Both exist in English and French, and both keep each date next to its entry when an applicant tracking system reads the PDF as text.",
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

export default function CvBuilderPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <Navbar />
      <main style={{ flex: 1 }}>
        <header className="tool-head">
          <h1>LaTeX CV generator</h1>
          <p className="lede">
            Fill in the form, choose a layout, and get a clean LaTeX CV that compiles. Import your publications from
            ORCID, then open the result in Overleaf for the PDF. No account is needed. Built on the same layouts as our{" "}
            <Link href="/tools/templates/cv">academic</Link> and{" "}
            <Link href="/tools/templates/cv-photo">industry</Link> CV templates.
          </p>
        </header>

        <div className="cvb-wrap">
          <CvBuilder />
        </div>

        <section aria-label="About the CV generator" className="paper cvb-paper">
          <h2><span className="secnum">8</span>Why a LaTeX CV</h2>
          <p>
            Academic hiring committees read many CVs, and a LaTeX CV is easy to recognise: consistent spacing, real
            small caps, a publication list that stays aligned over several pages. The catch has always been writing
            it. This generator removes that step: you type your details once, the LaTeX is produced for you, and you
            keep full control of the source if you want to adjust it.
          </p>
          <p>
            Table 1 compares the two layouts. Looking for a different design? Browse the{" "}
            <Link href="/tools/templates">free LaTeX templates</Link>, including
            French academic and industry CVs.
          </p>

          <div style={{ overflowX: "auto", margin: "1.25rem 0 0" }}>
            <table className="booktabs">
              <thead>
                <tr><th>Layout</th><th>Meant for</th><th>What it sets</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td>Academic</td>
                  <td>The classic research CV</td>
                  <td>Dated entries, publications by type with your name in bold, grants, teaching and talks</td>
                </tr>
                <tr>
                  <td>Industry</td>
                  <td>A compact one-page resume</td>
                  <td>Bullet points, skills as plain lines, a one-page option, an optional photo slot</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="caption"><b>Table 1.</b> The two layouts. Both exist in English and in French.</p>

          <h2>Appendix A&ensp;Questions</h2>
          <Faq items={FAQS} name="cv-faq" />
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
