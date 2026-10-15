import { ogCard } from "@/lib/og/card";

export const alt = "LaTeX CV generator: Fill in a form and get a clean CV as LaTeX source and PDF.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return ogCard({
    section: "Tool",
    title: "LaTeX CV generator",
    lede: "Fill in a form and get a clean CV as LaTeX source and PDF.",
  });
}
