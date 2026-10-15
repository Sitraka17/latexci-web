import { ogCard } from "@/lib/og/card";

export const alt = "After Overleaf: Free LaTeX tools for when your license ends.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return ogCard({
    section: "Guide",
    title: "After Overleaf",
    lede: "Free LaTeX tools for when your license ends.",
  });
}
