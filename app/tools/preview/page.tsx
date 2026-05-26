import Navbar from "@/components/Navbar";
import LatexEditor from "@/components/LatexEditor";

export const metadata = {
  title: "LaTeX Preview — latexci tools",
  description: "Live LaTeX to HTML preview with KaTeX math rendering. No install required.",
};

export default function PreviewPage() {
  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />
      <LatexEditor />
    </div>
  );
}
