import { ogCard } from "@/lib/og/card";

export const alt = "LaTeX preview: Type LaTeX on the left, read the typeset page on the right. KaTeX math, no compiler.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return ogCard({
    section: "Tool",
    title: "LaTeX preview",
    lede: "Type LaTeX on the left, read the typeset page on the right. KaTeX math, no compiler.",
  });
}
