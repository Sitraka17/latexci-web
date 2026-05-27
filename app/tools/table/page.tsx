import type { Metadata } from "next";
import ToolLayout from "@/components/ToolLayout";
import TableGenerator from "@/components/TableGenerator";

export const metadata: Metadata = {
  title: "LaTeX Table Generator — Free Online tabular Builder — latexci",
  description:
    "Generate LaTeX table code instantly. Enter data in a visual grid, choose column alignment and borders (booktabs or simple), copy the ready-to-use tabular environment. Free.",
  keywords: [
    "latex table generator", "latex tabular generator", "latex table maker online",
    "booktabs latex generator", "create latex table online", "latex table builder free",
  ],
  alternates: { canonical: "/tools/table" },
  openGraph: {
    title: "LaTeX Table Generator — latexci",
    description: "Visual LaTeX table builder. Enter data, pick alignment, copy the tabular code.",
    url: "/tools/table", type: "website",
  },
  twitter: { card: "summary_large_image", title: "LaTeX Table Generator — latexci" },
};

const schema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "LaTeX Table Generator — latexci",
  description: "Visual LaTeX tabular generator. Enter data, choose alignment and borders, copy the code.",
  url: "https://latexci-web.vercel.app/tools/table",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Web Browser",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

export default function TablePage() {
  return (
    <ToolLayout>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <TableGenerator />
    </ToolLayout>
  );
}
