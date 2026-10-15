import { ogCard } from "@/lib/og/card";

export const alt = "Word to LaTeX: Turn a .docx file into clean LaTeX source, in your browser.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return ogCard({
    section: "Tool",
    title: "Word to LaTeX",
    lede: "Turn a .docx file into clean LaTeX source, in your browser.",
  });
}
