import Navbar from "@/components/Navbar";
import LatexDiff from "@/components/LatexDiff";

export const metadata = {
  title: "LaTeX Diff — latexci tools",
  description: "Compare two LaTeX files side-by-side. See additions, deletions and changes highlighted.",
};

export default function DiffPage() {
  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />
      <LatexDiff />
    </div>
  );
}
