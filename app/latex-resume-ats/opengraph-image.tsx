import { ogCard } from "@/lib/og/card";

export const alt = "Is a LaTeX resume ATS-friendly? What a text extractor reads from 15 test PDFs.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return ogCard({
    section: "Guide",
    title: "Is a LaTeX resume ATS-friendly?",
    lede: "What a text extractor reads from 15 test PDFs.",
    ledeCode: "\\usepackage[T1]{fontenc}",
  });
}
