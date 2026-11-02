import type { ReactNode } from "react";
import Link from "@/components/Link";
import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";
import RelatedTools from "@/components/RelatedTools";
import BibFormatTool from "@/components/BibFormatTool";
import Faq from "@/components/Faq";
import { breadcrumbSchema } from "@/lib/breadcrumbs";
import { nodeFormatter } from "@/lib/bib-format-node";
import { SAMPLE_BIB } from "@/lib/bib-format-samples";
import { STYLES, type StyleId } from "@/lib/csl-styles";

export const FORMAT_PAGES = [
  { href: "/tools/bibtex-to-apa", label: "BibTeX to APA" },
  { href: "/tools/bibtex-to-mla", label: "BibTeX to MLA" },
  { href: "/tools/bibtex-to-chicago", label: "BibTeX to Chicago" },
];

/**
 * Shell of the three formatter pages: structured data, the tool (with the
 * sample list formatted at build time, so it shows before any script runs),
 * the page's own article, the credits and the questions.
 */
export default async function BibFormatPage({
  style, path, name, heading, tagline, description, faqs, children,
}: {
  style: StyleId;
  path: string;
  /** Short name for the breadcrumb and JSON-LD. */
  name: string;
  heading: string;
  tagline: string;
  description: string;
  faqs: { q: string; a: string }[];
  children: ReactNode;
}) {
  const initial = await nodeFormatter().format(SAMPLE_BIB, style);
  const appSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: `${heading} | latexci`,
    description,
    url: `https://latexci.com${path}`,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Web Browser",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  const breadcrumb = breadcrumbSchema({ name: "BibTeX Tools", path: "/tools/bibtex" }, { name, path });
  const others = FORMAT_PAGES.filter((p) => p.href !== path);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <Navbar />
      <main style={{ flex: 1 }}>
        <BibFormatTool defaultStyle={style} sample={SAMPLE_BIB} initial={initial} heading={heading} tagline={tagline} />

        <section className="paper bib-paper" aria-label={`About the ${name} converter`}>
          {children}

          <h2>Appendix A&ensp;Questions</h2>
          <Faq items={faqs} name={`${style}-format-faq`} />

          <h2>Appendix B&ensp;Credits</h2>
          <p>
            The references are produced by{" "}
            <a href="https://github.com/Juris-M/citeproc-js" rel="noopener">citeproc-js</a>{" "}
            (Frank Bennett, licensed under CPAL 1.0 or AGPL 3.0), the citation processor of Zotero,
            with the official style files of the{" "}
            <a href="https://citationstyles.org/" rel="noopener">Citation Style Language</a> project,
            unmodified: {STYLES.map((s) => s.cslTitle).join("; ")}. The style files and the
            en-US and en-GB locales are licensed under{" "}
            <a href="https://creativecommons.org/licenses/by-sa/3.0/" rel="noopener">CC BY-SA 3.0</a>;
            their authors are listed in each file, served from <a href="/csl/README.md">/csl/</a>.
          </p>

          <RelatedTools tools={[
            ...others,
            { label: "BibTeX cleaner", href: "/tools/bibtex" },
            { label: "DOI to BibTeX", href: "/tools/doi-to-bibtex" },
          ]} />
          <p className="note">
            <b>Not finding a style?</b> The selector also offers {STYLES.filter((s) => s.id !== style).map((s) => s.label).join("; ")}.
            {" "}Missing entries can be built from an identifier with the{" "}
            <Link href="/tools/bibtex">BibTeX tools</Link>.
          </p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
