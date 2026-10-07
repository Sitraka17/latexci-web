import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";
import { breadcrumbSchema } from "@/lib/breadcrumbs";

export const metadata: Metadata = {
  title: "After Overleaf: Free LaTeX Tools When Your License Ends",
  description:
    "Graduated and lost Overleaf Premium? latexci gives you free Word to LaTeX, BibTeX cleaning, live preview and diff tools. No subscription, no paid plan.",
  keywords: [
    "overleaf alternative after graduation",
    "lost overleaf university subscription",
    "overleaf premium expired",
    "free latex tools after university",
    "overleaf commons ended",
    "latex tools no subscription",
    "free overleaf replacement",
  ],
  alternates: { canonical: "/after-overleaf" },
  openGraph: {
    title: "After Overleaf | latexci",
    description: "Lost your university Overleaf license? These tools are free, forever.",
    url: "/after-overleaf", type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "After Overleaf: Free LaTeX Tools When Your License Ends",
    description: "Lost your university Overleaf license? These tools are free, forever. No subscription.",
  },
};

const WHAT_YOU_LOSE = [
  { feature: "Unlimited collaborators per project", workaround: "Use Git and GitHub for version control and collaboration." },
  { feature: "Track changes", workaround: "Use the latexci diff to compare two .tex files side by side.", href: "/tools/diff" },
  { feature: "Full project history", workaround: "git log gives you the whole history: free, offline, faster (Figure 1)." },
  { feature: "Dropbox and GitHub sync", workaround: "Work locally in VS Code with LaTeX Workshop: full power, no limits." },
  { feature: "Extended compile timeout", workaround: "YToTech (a free compile API, the one latexci uses for PDF export) handles most documents." },
  { feature: "Mendeley and Zotero sync", workaround: "The latexci BibTeX tools clean, format, and look up citations for free.", href: "/tools/bibtex" },
];

const TOOLS = [
  {
    href: "/tools/word-to-latex",
    title: "Word to LaTeX",
    desc: "Convert .docx files with equation detection, image stubs, and a quality report. The converter Overleaf does not have.",
    role: "Not in Overleaf",
    access: "Google sign-in",
  },
  {
    href: "/tools/bibtex",
    title: "BibTeX tools",
    desc: "Clean messy .bib files, look up DOIs, and fetch arXiv citations. Replaces the Mendeley and Zotero sync you just lost.",
    role: "Replaces Overleaf sync",
    access: "No account",
  },
  {
    href: "/tools/diff",
    title: "LaTeX diff",
    desc: "Compare two .tex files and see exactly what changed. Replaces Overleaf's track changes for your personal workflow.",
    role: "Replaces track changes",
    access: "No account",
  },
  {
    href: "/tools/preview",
    title: "Instant preview",
    desc: "KaTeX-powered preview with no compile wait. Check formulas and structure without opening your TeX engine.",
    role: "No compile time",
    access: "PDF: Google sign-in",
  },
  {
    href: "/tools/templates",
    title: "Templates",
    desc: "28 starting points: PhD thesis, IEEE paper, academic CV, Beamer slides, and more. Open one in the live editor and copy the source into any editor.",
    role: "Works with any editor",
    access: "No account",
  },
];

const LOCAL_EDITORS = [
  { name: "VS Code + LaTeX Workshop", url: "https://github.com/James-Yu/LaTeX-Workshop", desc: "The best local LaTeX setup. Free, fast, full syntax highlighting, SyncTeX, live compile.", cost: "Free" },
  { name: "Texifier (macOS)", url: "https://www.texifier.com/", desc: "Native macOS LaTeX editor with live preview.", cost: "One-time purchase" },
  { name: "TeXstudio (all platforms)", url: "https://www.texstudio.org/", desc: "Full-featured LaTeX IDE for Windows, macOS, Linux.", cost: "Free" },
  { name: "Zed / Neovim + VimTeX", url: "https://github.com/lervag/vimtex", desc: "For power users who want LaTeX in their main editor.", cost: "Free" },
];

// Figure 1: project history with git instead of the Overleaf history panel.
const GIT_SOURCE = `$ git init thesis && cd thesis
$ git add main.tex chapters/ refs.bib
$ git commit -m "Chapter 2: first full draft"
$ git log --oneline -- chapters/methods.tex
a41c9e2 Methods: answer advisor comments
7d02b18 Chapter 2: first full draft
$ git show 7d02b18:chapters/methods.tex > old.tex`;

const codeStyle = { fontFamily: "var(--font-tt)", fontSize: "0.92em" } as const;

export default function AfterOverleafPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema({ name: "Life after Overleaf", path: "/after-overleaf" })) }} />
      <Navbar />

      <main className="paper" style={{ flex: 1, width: "100%", boxSizing: "border-box", paddingBottom: "3rem" }}>
        <header className="titleblock">
          <h1>Lost your Overleaf license, keep your workflow</h1>
          <p className="subtitle">Free LaTeX tools for life after graduation</p>
          <p className="authors">latexci.com &middot; graduated? we&rsquo;ve got you</p>
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap", marginTop: "1.6rem" }}>
            <Link href="/tools/bibtex" className="btn btn-primary">Start with the BibTeX tools</Link>
            <Link href="/tools/word-to-latex" className="btn">Word to LaTeX converter</Link>
          </div>
        </header>

        <section className="abstract" aria-label="Abstract">
          <p className="abstract-title">Abstract</p>
          <p>
            When you graduate, your institution&rsquo;s Overleaf Premium license disappears. This note lists
            what you lose, what replaces each feature for free, and where to write LaTeX next. latexci gives
            you the tools Overleaf never had, in the browser and with no subscription: every tool is free, most
            need no account, and PDF export and Word to LaTeX ask for a one-click Google sign-in.
          </p>
        </section>

        <h2><span className="secnum">1</span>What you lose when your license ends</h2>
        <p>And what to do instead, all free (Table 1).</p>
        <div style={{ overflowX: "auto", margin: "1.25rem 0 0" }}>
          <table className="booktabs">
            <thead>
              <tr><th>Premium feature lost</th><th>What to do instead</th></tr>
            </thead>
            <tbody>
              {WHAT_YOU_LOSE.map(item => (
                <tr key={item.feature}>
                  <td style={{ width: "38%" }}>{item.feature}</td>
                  <td>
                    {item.workaround}
                    {item.href && <> <Link href={item.href}>Open</Link>.</>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="caption"><b>Table 1.</b> Overleaf Premium features and their free replacements.</p>

        <figure style={{ margin: "2rem 0 0" }}>
          <div className="figure">
            <pre style={{ margin: 0, padding: "1rem 1.15rem", fontFamily: "var(--font-tt)", fontSize: "0.86rem", lineHeight: 1.6, whiteSpace: "pre-wrap", color: "var(--fg)", overflowX: "auto" }}>{GIT_SOURCE}</pre>
          </div>
          <figcaption className="caption">
            <b>Figure 1.</b> Project history without Overleaf: <code style={codeStyle}>git log</code> lists every
            version of a chapter, and <code style={codeStyle}>git show</code> restores an old one, ready to compare
            in the <Link href="/tools/diff">LaTeX diff</Link>.
          </figcaption>
        </figure>

        <h2><span className="secnum">2</span>The tools Overleaf never had</h2>
        <p>
          These work alongside any editor: Overleaf, VS Code, TeXstudio, whatever you use next. Table 2 lists
          them with the Overleaf feature each one replaces.
        </p>
        <div style={{ overflowX: "auto", margin: "1.25rem 0 0" }}>
          <table className="booktabs">
            <thead>
              <tr><th>Tool</th><th>What it does</th><th className="hide-sm">Role</th></tr>
            </thead>
            <tbody>
              {TOOLS.map(tool => (
                <tr key={tool.href}>
                  <td style={{ whiteSpace: "nowrap" }}><Link href={tool.href}>{tool.title}</Link></td>
                  <td>{tool.desc}</td>
                  <td className="muted hide-sm">{tool.role}<br />{tool.access}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="caption"><b>Table 2.</b> latexci tools for former Overleaf Premium users. All are free.</p>
        <p className="remark" style={{ marginTop: "1rem", textIndent: 0 }}>
          <b>Remark.</b> Preview, diff and Word to LaTeX process your files in the browser. PDF export is the
          exception: it sends the LaTeX source to the YToTech compile service and downloads the PDF.
        </p>

        <h2><span className="secnum">3</span>Where to write LaTeX now</h2>
        <p>
          You do not need a cloud editor. A local setup is faster, private, and works offline. Table 3 lists
          four good options.
        </p>
        <div style={{ overflowX: "auto", margin: "1.25rem 0 0" }}>
          <table className="booktabs">
            <thead>
              <tr><th>Editor</th><th>Notes</th><th className="hide-sm">Cost</th></tr>
            </thead>
            <tbody>
              {LOCAL_EDITORS.map(editor => (
                <tr key={editor.name}>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <a href={editor.url} target="_blank" rel="noopener noreferrer">{editor.name}</a>
                  </td>
                  <td>{editor.desc}</td>
                  <td className="muted hide-sm">{editor.cost}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="caption"><b>Table 3.</b> Local LaTeX editors. Links open the project pages.</p>

        <h2><span className="secnum">4</span>Keep writing</h2>
        <p>
          latexci&rsquo;s tools are free and work in any browser; only PDF export and Word to LaTeX ask for a
          one-click Google sign-in. Use them alongside whatever editor you choose next.
        </p>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "1rem" }}>
          <Link href="/tools/bibtex" className="btn btn-primary">BibTeX tools</Link>
          <Link href="/tools/word-to-latex" className="btn">Word to LaTeX</Link>
          <Link href="/tools/templates" className="btn">Templates</Link>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
