import { ogCard } from "@/lib/og/card";

export const alt = "LaTeX for PhD students: Thesis templates, an advisor diff workflow and the packages that matter.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return ogCard({
    section: "For researchers",
    title: "LaTeX for PhD students",
    lede: "Thesis templates, an advisor diff workflow and the packages that matter.",
  });
}
