import { ogCard } from "@/lib/og/card";

export const alt = "DOI to APA: Enter a DOI and copy its APA 7th edition reference into Word.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return ogCard({
    section: "Tool",
    title: "DOI to APA",
    lede: "Enter a DOI and copy its APA 7th edition reference into Word.",
  });
}
