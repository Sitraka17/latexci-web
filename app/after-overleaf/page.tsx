import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "After Overleaf — Free LaTeX Tools When Your University License Ends",
  description:
    "Graduated and lost your Overleaf Premium? latexci gives you free Word→LaTeX, BibTeX cleaning, live preview, and diff tools — no subscription, no signup, works forever.",
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
    title: "After Overleaf — latexci",
    description: "Lost your university Overleaf license? These tools are free, forever.",
    url: "/after-overleaf", type: "website",
  },
};

const WHAT_YOU_LOSE = [
  { feature: "Unlimited collaborators per project", workaround: "Use Git + GitHub for version control & collaboration." },
  { feature: "Track changes", workaround: "Use latexci Diff to compare two .tex files side-by-side." },
  { feature: "Full project history", workaround: "git log gives you infinite history. Free, offline, faster." },
  { feature: "Dropbox / GitHub sync", workaround: "Work locally in VS Code + LaTeX Workshop. Full power, no limits." },
  { feature: "Extended compile timeout", workaround: "YToTech (free API, what latexci uses) handles most documents." },
  { feature: "Mendeley / Zotero sync", workaround: "latexci BibTeX tools — clean, format, and look up citations free." },
];

const TOOLS = [
  {
    href: "/tools/word-to-latex",
    icon: "↗",
    title: "Word → LaTeX",
    desc: "Convert .docx files with equation detection, image stubs, and a quality report. The converter Overleaf doesn't have.",
    badge: "Overleaf doesn't have this",
  },
  {
    href: "/tools/bibtex",
    icon: "📚",
    title: "BibTeX Tools",
    desc: "Clean messy .bib files, look up DOIs, and fetch arXiv citations. Replaces the Mendeley/Zotero sync you just lost.",
    badge: "Replaces Overleaf sync",
  },
  {
    href: "/tools/diff",
    icon: "↕",
    title: "LaTeX Diff",
    desc: "Compare two .tex files and see exactly what changed. Replaces Overleaf's track changes for your personal workflow.",
    badge: "Replaces track changes",
  },
  {
    href: "/tools/preview",
    icon: "⚡",
    title: "Instant Preview",
    desc: "KaTeX-powered preview with zero compile wait. Check formulas and structure without opening your TeX engine.",
    badge: "Zero compile time",
  },
  {
    href: "/tools/templates",
    icon: "▤",
    title: "Templates",
    desc: "PhD thesis, IEEE paper, academic CV, beamer slides, and more — download .tex and open in any editor.",
    badge: "Works offline",
  },
];

const LOCAL_EDITORS = [
  { name: "VS Code + LaTeX Workshop", url: "https://github.com/James-Yu/LaTeX-Workshop", desc: "The best local LaTeX setup. Free, fast, full syntax highlighting, SyncTeX, live compile." },
  { name: "Texifier (macOS)", url: "https://www.texifier.com/", desc: "Beautiful native macOS LaTeX editor with live preview. One-time purchase." },
  { name: "TeXstudio (all platforms)", url: "https://www.texstudio.org/", desc: "Full-featured free LaTeX IDE for Windows, macOS, Linux." },
  { name: "Zed / Neovim + VimTeX", url: "https://github.com/lervag/vimtex", desc: "For power users who want LaTeX in their main editor." },
];

export default function AfterOverleafPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />

      <main style={{ flex: 1 }}>
        {/* Hero */}
        <section style={{ padding: "5rem 1.5rem 3rem", textAlign: "center", borderBottom: "1px solid var(--border)" }}>
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            <div style={{
              display: "inline-block", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em",
              color: "var(--accent2)", background: "color-mix(in srgb, var(--accent) 10%, transparent)",
              border: "1px solid color-mix(in srgb, var(--accent) 25%, transparent)",
              padding: "0.3rem 0.9rem", borderRadius: 20, marginBottom: "1.5rem",
              textTransform: "uppercase",
            }}>
              Graduated? We've got you.
            </div>
            <h1 style={{ fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 800, letterSpacing: "-0.035em", lineHeight: 1.15, marginBottom: "1rem" }}>
              Lost your Overleaf license.<br />
              <span style={{ background: "linear-gradient(135deg, var(--accent), var(--accent2))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Keep your workflow.
              </span>
            </h1>
            <p style={{ fontSize: "1.1rem", color: "var(--fg-muted)", lineHeight: 1.75, marginBottom: "2rem" }}>
              When you graduate, your institution's Overleaf Premium license disappears.
              latexci gives you the tools that Overleaf never had — free, browser-based,
              no signup, no subscription. Forever.
            </p>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/tools/bibtex" style={{
                padding: "0.7rem 1.75rem", borderRadius: 8,
                background: "linear-gradient(135deg, var(--accent), var(--accent2))",
                color: "#fff", fontWeight: 700, fontSize: "0.95rem", textDecoration: "none",
                boxShadow: "0 4px 18px color-mix(in srgb, var(--accent) 35%, transparent)",
              }}>
                Start with BibTeX Tools →
              </Link>
              <Link href="/tools/word-to-latex" style={{
                padding: "0.7rem 1.5rem", borderRadius: 8,
                background: "var(--surface2)", border: "1px solid var(--border)",
                color: "var(--fg)", fontWeight: 600, fontSize: "0.95rem", textDecoration: "none",
              }}>
                Word → LaTeX Converter
              </Link>
            </div>
          </div>
        </section>

        {/* What you lose vs. what to do */}
        <section style={{ padding: "4rem 1.5rem", borderBottom: "1px solid var(--border)" }}>
          <div style={{ maxWidth: 860, margin: "0 auto" }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>
              What you lose when your license ends
            </h2>
            <p style={{ color: "var(--fg-muted)", fontSize: "0.92rem", marginBottom: "2rem" }}>
              And what to do instead — all free.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 0, border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
              {WHAT_YOU_LOSE.map((item, i) => (
                <div key={i} style={{
                  display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem",
                  padding: "1rem 1.25rem",
                  borderBottom: i < WHAT_YOU_LOSE.length - 1 ? "1px solid var(--border)" : "none",
                  background: i % 2 === 0 ? "var(--surface)" : "transparent",
                }}>
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
                    <span style={{ color: "#ef4444", marginTop: 2 }}>✗</span>
                    <span style={{ fontSize: "0.88rem", color: "var(--fg)" }}>{item.feature}</span>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
                    <span style={{ color: "var(--green)", marginTop: 2 }}>→</span>
                    <span style={{ fontSize: "0.88rem", color: "var(--fg-muted)" }}>{item.workaround}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* latexci tools */}
        <section style={{ padding: "4rem 1.5rem", borderBottom: "1px solid var(--border)" }}>
          <div style={{ maxWidth: 960, margin: "0 auto" }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>
              The tools Overleaf never had
            </h2>
            <p style={{ color: "var(--fg-muted)", fontSize: "0.92rem", marginBottom: "2rem" }}>
              These work alongside any editor — Overleaf, VS Code, TeXstudio, whatever you use next.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
              {TOOLS.map(tool => (
                <Link key={tool.href} href={tool.href} style={{
                  textDecoration: "none", display: "block", padding: "1.25rem",
                  background: "var(--surface)", border: "1px solid var(--border)",
                  borderRadius: 10, transition: "border-color 0.15s, transform 0.15s",
                }} className="tool-card">
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                    <span style={{ fontSize: "1.2rem" }}>{tool.icon}</span>
                    <span style={{ fontWeight: 700, color: "var(--fg)" }}>{tool.title}</span>
                    <span style={{
                      marginLeft: "auto", fontSize: "0.65rem", fontWeight: 700, padding: "0.15rem 0.5rem",
                      borderRadius: 10, background: "color-mix(in srgb, var(--accent) 10%, transparent)",
                      color: "var(--accent2)", border: "1px solid color-mix(in srgb, var(--accent) 25%, transparent)",
                      whiteSpace: "nowrap",
                    }}>
                      {tool.badge}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--fg-muted)", lineHeight: 1.6 }}>{tool.desc}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Local editor recommendations */}
        <section style={{ padding: "4rem 1.5rem" }}>
          <div style={{ maxWidth: 860, margin: "0 auto" }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>
              Where to write LaTeX now
            </h2>
            <p style={{ color: "var(--fg-muted)", fontSize: "0.92rem", marginBottom: "2rem" }}>
              You don't need a cloud editor. A local setup is faster, private, and works offline.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem" }}>
              {LOCAL_EDITORS.map(editor => (
                <a key={editor.name} href={editor.url} target="_blank" rel="noopener noreferrer" style={{
                  textDecoration: "none", padding: "1rem 1.15rem",
                  background: "var(--surface)", border: "1px solid var(--border)",
                  borderRadius: 8, display: "block",
                }}>
                  <div style={{ fontWeight: 600, color: "var(--fg)", marginBottom: "0.3rem", fontSize: "0.9rem" }}>
                    {editor.name} ↗
                  </div>
                  <div style={{ fontSize: "0.82rem", color: "var(--fg-muted)", lineHeight: 1.55 }}>
                    {editor.desc}
                  </div>
                </a>
              ))}
            </div>

            {/* CTA */}
            <div style={{
              marginTop: "2.5rem", padding: "1.75rem", textAlign: "center",
              background: "color-mix(in srgb, var(--accent) 6%, transparent)",
              border: "1px solid color-mix(in srgb, var(--accent) 20%, transparent)",
              borderRadius: 10,
            }}>
              <h3 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>Ready to keep writing?</h3>
              <p style={{ color: "var(--fg-muted)", fontSize: "0.9rem", marginBottom: "1.25rem", lineHeight: 1.65 }}>
                latexci's tools are free, require no signup, and work in any browser.
                Use them alongside whatever editor you choose next.
              </p>
              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
                <Link href="/tools/bibtex" style={{ padding: "0.6rem 1.5rem", borderRadius: 7, background: "var(--accent)", color: "#fff", fontWeight: 700, fontSize: "0.9rem", textDecoration: "none" }}>BibTeX Tools</Link>
                <Link href="/tools/word-to-latex" style={{ padding: "0.6rem 1.5rem", borderRadius: 7, background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--fg)", fontWeight: 600, fontSize: "0.9rem", textDecoration: "none" }}>Word → LaTeX</Link>
                <Link href="/tools/templates" style={{ padding: "0.6rem 1.5rem", borderRadius: 7, background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--fg)", fontWeight: 600, fontSize: "0.9rem", textDecoration: "none" }}>Templates</Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
