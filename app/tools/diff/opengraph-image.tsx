import { ogCard } from "@/lib/og/card";

export const alt = "LaTeX diff: Compare two .tex files side by side and see every change.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return ogCard({
    section: "Tool",
    title: "LaTeX diff",
    lede: "Compare two .tex files side by side and see every change.",
  });
}
