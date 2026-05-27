import type { Metadata } from "next";
import ToolLayout from "@/components/ToolLayout";
import WordToLatex from "@/components/WordToLatex";

export const metadata: Metadata = {
  title: "Word to LaTeX Converter — Convert .docx to .tex Free — latexci",
  description:
    "Convert Microsoft Word (.docx), LibreOffice (.odt), and RTF files to clean LaTeX source. Powered by pandoc. Edit inline and download your .tex file. Free, no signup.",
  keywords: [
    "word to latex converter", "docx to latex", "word document to latex",
    "convert docx to tex", "word to tex online", "pandoc word to latex online",
  ],
  alternates: { canonical: "/tools/word-to-latex" },
  openGraph: {
    title: "Word → LaTeX Converter — latexci",
    description: "Upload a .docx, .odt, or .rtf file and get clean LaTeX source instantly.",
    url: "/tools/word-to-latex", type: "website",
  },
  twitter: { card: "summary_large_image", title: "Word to LaTeX Converter — latexci" },
};

const schema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Word to LaTeX Converter — latexci",
  description: "Convert .docx, .odt, and .rtf to LaTeX source. Powered by pandoc.",
  url: "https://latexci-web.vercel.app/tools/word-to-latex",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Web Browser",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

export default function WordToLatexPage() {
  return (
    <ToolLayout>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <WordToLatex />
    </ToolLayout>
  );
}
