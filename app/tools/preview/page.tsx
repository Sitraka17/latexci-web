import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import LatexEditor from "@/components/LatexEditor";

export const metadata: Metadata = {
  title: "Online LaTeX Preview with KaTeX Math Rendering — latexci",
  description:
    "Paste LaTeX source and see a live preview instantly — equations rendered by KaTeX, sections, tables, figures, theorem environments. No install, no signup, no compiler wait.",
  keywords: [
    "online latex preview",
    "latex previewer",
    "katex online renderer",
    "latex to html converter",
    "check latex equation online",
    "latex preview no installation",
    "live latex editor",
    "latex equation renderer",
    "latex preview browser",
  ],
  alternates: { canonical: "/tools/preview" },
  openGraph: {
    title: "Online LaTeX Preview — latexci",
    description:
      "Live LaTeX preview with KaTeX math rendering. Equations, sections, tables, theorem environments. Free, no signup.",
    url: "/tools/preview",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Online LaTeX Preview — latexci",
    description: "Live LaTeX preview with KaTeX math. No install, no signup.",
  },
};

const schema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "LaTeX Preview — latexci",
  description:
    "Browser-based LaTeX preview tool with live KaTeX math rendering. Supports equations, align, gather, sections, tables, lists, and theorem environments.",
  url: "https://latexci-web.vercel.app/tools/preview",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Web Browser",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  featureList: [
    "Live LaTeX to HTML preview",
    "KaTeX math rendering",
    "align, gather, equation environments",
    "Theorem, lemma, proof environments",
    "Shareable URL via LZ compression",
    "Offline capable",
  ],
};

export default function PreviewPage() {
  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <Navbar />
      <LatexEditor />
    </div>
  );
}
