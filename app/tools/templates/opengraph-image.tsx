import { ogCard } from "@/lib/og/card";

export const alt = "Free LaTeX templates: Articles, theses, CVs and slides that open in the browser editor.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return ogCard({
    section: "Templates",
    title: "Free LaTeX templates",
    lede: "Articles, theses, CVs and slides that open in the browser editor.",
  });
}
