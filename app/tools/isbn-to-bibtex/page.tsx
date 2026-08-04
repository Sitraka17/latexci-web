import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";
import BibTexTool from "@/components/BibTexTool";
import { breadcrumbSchema } from "@/lib/breadcrumbs";

export const metadata: Metadata = {
  title: "ISBN to BibTeX — @book Entry Generator",
  description:
    "Turn an ISBN into a formatted BibTeX @book entry — title, authors, publisher, and year from Open Library. Cite textbooks and monographs in seconds. Free, no signup.",
  keywords: [
    "isbn to bibtex", "isbn bibtex generator", "book bibtex entry",
    "cite book latex", "bibtex book citation", "isbn citation generator",
    "textbook bibtex", "open library bibtex",
  ],
  alternates: { canonical: "/tools/isbn-to-bibtex" },
  openGraph: {
    title: "ISBN to BibTeX Converter — latexci",
    description: "Paste an ISBN, get a formatted @book BibTeX entry from Open Library data. Free, no signup.",
    url: "/tools/isbn-to-bibtex", type: "website",
  },
  twitter: { card: "summary_large_image", title: "ISBN to BibTeX Converter — latexci" },
};

const FAQS = [
  {
    q: "ISBN-10 or ISBN-13 — which one works?",
    a: "Both. Use the ISBN printed on the book's copyright page or back cover — modern books carry an ISBN-13 starting with 978 or 979; older ones an ISBN-10.",
  },
  {
    q: "Where does the book data come from?",
    a: "From Open Library, the Internet Archive's open catalog of published books. The entry includes the title, authors, publisher, and year as recorded there.",
  },
  {
    q: "The year doesn't match my copy — why?",
    a: "An ISBN identifies a specific edition. If you're citing a different edition than the one the ISBN belongs to, look up the ISBN of your actual copy — page numbers and even chapter structure can differ between editions.",
  },
  {
    q: "What about book chapters or edited volumes?",
    a: "The converter produces a @book entry. For a chapter in an edited volume, start from the @book entry and adapt it to @incollection or @inbook, adding the chapter title, editors, and page range — or use the DOI converter if the chapter has its own DOI.",
  },
];

const appSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "ISBN to BibTeX Converter — latexci",
  description: "Convert an ISBN into a formatted BibTeX @book entry using Open Library data.",
  url: "https://latexci.com/tools/isbn-to-bibtex",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Web Browser",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((f) => ({
    "@type": "Question", name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};
const breadcrumb = breadcrumbSchema({ name: "ISBN to BibTeX", path: "/tools/isbn-to-bibtex" });

const h2: CSSProperties = { color: "var(--fg)", fontSize: "1.4rem", fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 1rem" };
const h3: CSSProperties = { color: "var(--fg)", fontSize: "1.02rem", fontWeight: 600, margin: "1.8rem 0 0.5rem" };
const para: CSSProperties = { color: "var(--fg-muted)", fontSize: "0.95rem", lineHeight: 1.75, margin: "0 0 1rem" };

const RELATED = [
  { label: "DOI → BibTeX",    href: "/tools/doi-to-bibtex" },
  { label: "arXiv → BibTeX",  href: "/tools/arxiv-to-bibtex" },
  { label: "PubMed → BibTeX", href: "/tools/pubmed-to-bibtex" },
  { label: "All BibTeX tools", href: "/tools/bibtex" },
];

export default function IsbnToBibtexPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <Navbar />
      <main style={{ flex: 1 }}>
        <BibTexTool
          initialTab="isbn"
          heading="ISBN to BibTeX Converter"
          tagline="Paste an ISBN-10 or ISBN-13, get a formatted @book entry from Open Library data."
        />

        <section aria-label="About the ISBN to BibTeX converter" style={{ background: "var(--surface)", borderTop: "1px solid var(--border)" }}>
          <div style={{ maxWidth: 820, margin: "0 auto", padding: "3rem 1.5rem" }}>
            <h2 style={h2}>Books deserve better than hand-typed citations</h2>
            <p style={para}>
              Articles have DOIs; books have ISBNs. Paste the one from the copyright page above and the
              converter looks it up in Open Library and returns a BibTeX <code>@book</code> entry — title,
              authors, publisher, and year — ready to paste into your <code>.bib</code> file. Handy for
              textbooks in course notes, monographs in a thesis&rsquo; literature review, or methods
              handbooks in a paper.
            </p>
            <h3 style={h3}>Mind the edition</h3>
            <p style={para}>
              An ISBN identifies one specific edition of a book. If your citation includes page numbers,
              make sure the ISBN you convert matches the copy on your desk — editions can differ in
              pagination and content. When in doubt, the copyright page of your copy has the right ISBN.
            </p>

            <h2 style={{ ...h2, marginTop: "2.5rem" }}>Frequently asked questions</h2>
            {FAQS.map((f) => (
              <div key={f.q} style={{ marginBottom: "1.3rem" }}>
                <h3 style={{ ...h3, margin: "0 0 0.35rem" }}>{f.q}</h3>
                <p style={{ ...para, margin: 0 }}>{f.a}</p>
              </div>
            ))}

            <nav aria-label="Related tools" style={{ marginTop: "2.5rem", display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
              {RELATED.map(({ label, href }) => (
                <Link key={href} href={href} style={{
                  padding: "0.35rem 0.9rem", borderRadius: 7, border: "1px solid var(--border)",
                  background: "var(--surface2)", fontSize: "0.82rem", color: "var(--fg-muted)", textDecoration: "none",
                }}>
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
