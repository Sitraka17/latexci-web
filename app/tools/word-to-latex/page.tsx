import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import WordToLatex from "@/components/WordToLatex";

export const metadata: Metadata = {
  title: "Word to LaTeX Converter Online — Convert .docx to .tex Free — latexci",
  description:
    "Convert Microsoft Word (.docx), LibreOffice (.odt), and RTF files to clean LaTeX source. Powered by pandoc. Edit the result inline and download your .tex file. Free, no signup.",
  keywords: [
    "word to latex converter",
    "docx to latex",
    "word document to latex",
    "convert docx to tex",
    "word to tex online",
    "docx to tex free",
    "microsoft word to latex",
    "odt to latex",
    "pandoc word to latex online",
  ],
  alternates: { canonical: "/tools/word-to-latex" },
  openGraph: {
    title: "Word → LaTeX Converter — latexci",
    description:
      "Upload a .docx, .odt, or .rtf file and get clean LaTeX source instantly. Free, no signup.",
    url: "/tools/word-to-latex",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Word to LaTeX Converter — latexci",
    description: "Convert .docx files to LaTeX instantly. Powered by pandoc. Free.",
  },
};

const schema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Word to LaTeX Converter — latexci",
  description:
    "Convert Microsoft Word (.docx), LibreOffice (.odt), and RTF files to clean LaTeX source code. Powered by pandoc, running server-side. File deleted immediately after conversion.",
  url: "https://latexci-web.vercel.app/tools/word-to-latex",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Web Browser",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  featureList: [
    "Convert .docx to LaTeX",
    "Convert .odt to LaTeX",
    "Convert .rtf to LaTeX",
    "Powered by pandoc",
    "Edit result inline before downloading",
    "File deleted immediately after conversion",
  ],
};

export default function WordToLatexPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <Navbar />
      <WordToLatex />
    </div>
  );
}
