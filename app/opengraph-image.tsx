import { ogCard } from "@/lib/og/card";

export const alt = "latexci: the tools Overleaf forgot. Free LaTeX preview, diff, tables, BibTeX and symbols.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return ogCard({
    section: "Free LaTeX tools",
    title: "The tools Overleaf forgot",
    lede: "Live preview, diff, Word to LaTeX, tables, BibTeX and 350+ symbols, in the browser.",
  });
}
