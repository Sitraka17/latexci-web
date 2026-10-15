import { ogCard } from "@/lib/og/card";

export const alt = "LaTeX table generator: Paste from Excel or CSV and copy a booktabs table that compiles.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return ogCard({
    section: "Tool",
    title: "LaTeX table generator",
    lede: "Paste from Excel or CSV and copy a booktabs table that compiles.",
  });
}
