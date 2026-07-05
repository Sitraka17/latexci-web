import type { Metadata } from "next";
import ToolLayout from "@/components/ToolLayout";
import TableGenerator from "@/components/TableGenerator";

export const metadata: Metadata = {
  title: "LaTeX Table Generator — Free, Paste from Excel or CSV — latexci",
  description:
    "Free LaTeX table generator — paste from Excel or CSV, pick alignment, choose booktabs or simple borders, and copy ready-to-use tabular code. No signup.",
  keywords: [
    "latex table generator",
    "latex table generator online",
    "latex tabular generator",
    "booktabs latex table",
    "latex table maker",
    "create latex table from excel",
    "latex table from csv",
    "online latex table creator",
    "latex tabular environment",
    "latex table generator free",
    "paste excel to latex table",
    "academic table latex",
    "latex table online",
    "convert excel to latex table",
  ],
  alternates: { canonical: "/tools/table" },
  openGraph: {
    title: "LaTeX Table Generator — Free, Paste from Excel — latexci",
    description: "Visual LaTeX table builder. Paste from Excel/CSV or type data, pick alignment and borders, copy booktabs or tabular code instantly.",
    url: "/tools/table", type: "website",
  },
  twitter: { card: "summary_large_image", title: "LaTeX Table Generator — latexci" },
};

const schema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "LaTeX Table Generator — latexci",
  description: "Free online LaTeX table generator. Paste from Excel/CSV, pick alignment, copy booktabs or tabular code. No signup required.",
  url: "https://latexci.com/tools/table",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Web Browser",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How do I create a LaTeX table from Excel?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Select your data in Excel, copy it (Ctrl+C / Cmd+C), then paste it into the latexci table generator. The tool automatically detects tab-separated values and fills all rows and columns. Click 'Copy LaTeX' to get the tabular code.",
      },
    },
    {
      "@type": "Question",
      name: "What is the difference between booktabs and simple borders in LaTeX?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Booktabs uses \\toprule, \\midrule, and \\bottomrule — horizontal rules only, no vertical lines. This is the style recommended by most journals and the LaTeX typesetting community. Simple borders use \\hline and vertical | characters in the column spec. Booktabs is generally preferred for academic papers.",
      },
    },
    {
      "@type": "Question",
      name: "How do I paste a CSV file into a LaTeX table?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Open your CSV in a text editor or Excel, copy the rows, and paste them directly into the table generator grid. The tool handles both comma-separated and tab-separated formats.",
      },
    },
    {
      "@type": "Question",
      name: "Do I need \\usepackage{booktabs} in my preamble?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes — when using the booktabs style, the generated LaTeX includes a comment reminding you to add \\usepackage{booktabs} to your preamble. Simple and no-border styles do not need this package.",
      },
    },
  ],
};

export default function TablePage() {
  return (
    <ToolLayout>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <h1 style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap" }}>
        LaTeX Table Generator — Free, Paste from Excel or CSV
      </h1>
      <TableGenerator />
    </ToolLayout>
  );
}
