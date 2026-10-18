import { ogCard } from "@/lib/og/card";

export const alt = "Modèle de CV LaTeX gratuit : CV académique ou CV d'entreprise, en français.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return ogCard({
    section: "Guide en français",
    title: "Modèle de CV LaTeX gratuit",
    lede: "CV académique ou CV d’entreprise, typographie française.",
    ledeCode: "\\usepackage[french]{babel}",
  });
}
