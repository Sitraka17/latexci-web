import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import TableGenerator from "@/components/TableGenerator";

export const metadata: Metadata = {
  title: "LaTeX Table Generator — Free Online tabular Builder — latexci",
  description:
    "Generate LaTeX table code instantly. Enter your data in a visual grid, choose column alignment and borders, and copy the ready-to-use tabular environment. Free, no install.",
  keywords: [
    "latex table generator",
    "latex tabular generator",
    "latex table maker online",
    "latex table code generator",
    "booktabs latex generator",
    "create latex table online",
    "latex table builder free",
  ],
  alternates: { canonical: "/tools/table" },
  openGraph: {
    title: "LaTeX Table Generator — latexci",
    description:
      "Visual LaTeX table builder. Enter data, pick alignment, copy the tabular code. Free.",
    url: "/tools/table",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LaTeX Table Generator — latexci",
    description: "Build LaTeX tables visually. Copy the tabular code instantly. Free.",
  },
};

const schema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "LaTeX Table Generator — latexci",
  description:
    "Visual LaTeX tabular environment generator. Enter data in a grid, choose alignment and borders, and copy the resulting LaTeX code.",
  url: "https://latexci-web.vercel.app/tools/table",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Web Browser",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

export default function TablePage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <Navbar />
      <TableGenerator />
    </div>
  );
}
