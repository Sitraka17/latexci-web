import Navbar from "@/components/Navbar";
import WordToLatex from "@/components/WordToLatex";

export const metadata = {
  title: "Word to LaTeX — latexci tools",
  description: "Convert .docx files to LaTeX source. Upload your Word document and get clean .tex output.",
};

export default function WordToLatexPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />
      <WordToLatex />
    </div>
  );
}
