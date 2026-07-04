"use client";
import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import LZString from "lz-string";
import { TEMPLATES, CATEGORIES } from "@/lib/templates";

// Templates marked as new (shown with a badge)
const NEW_TEMPLATE_IDS = new Set([
  "beamer", "beamer-modern",
  "cv-french-academic", "cv-french-industry", "cv-academic-photo",
  "neurips", "icml", "acl", "nature-style",
]);

function CopySourceBtn({ source }: { source: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(source).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  }, [source]);
  return (
    <button
      onClick={handleCopy}
      title="Copy LaTeX source to clipboard"
      style={{
        flex: 1,
        padding: "0.52rem 0.6rem",
        borderRadius: 7,
        border: `1px solid ${copied ? "var(--accent)" : "var(--border)"}`,
        background: copied ? "color-mix(in srgb, var(--accent) 10%, transparent)" : "var(--surface2)",
        color: copied ? "var(--accent)" : "var(--fg-muted)",
        fontSize: "0.78rem",
        fontWeight: 600,
        cursor: "pointer",
        transition: "all 0.15s",
        whiteSpace: "nowrap",
      }}
    >
      {copied ? "✓ Copied!" : "Copy source"}
    </button>
  );
}

export default function TemplatesFilter() {
  const [active, setActive] = useState("All");
  const [query,  setQuery]  = useState("");

  // Templates matching the current query (ignoring category filter, for pill counts)
  const queryFiltered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return TEMPLATES;
    return TEMPLATES.filter(t =>
      t.title.toLowerCase().includes(q) ||
      t.desc.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q)
    );
  }, [query]);

  const filtered = useMemo(() => {
    const byCategory = active === "All" ? queryFiltered : queryFiltered.filter(t => t.category === active);
    return byCategory;
  }, [active, queryFiltered]);

  const countFor = (cat: string) =>
    cat === "All" ? queryFiltered.length : queryFiltered.filter(t => t.category === cat).length;

  return (
    <>
      {/* ── Search + Filter row ───────────────────────────────── */}
      <div className="filter-row" style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap", alignItems: "center" }}>
        {/* Search input */}
        <div style={{ position: "relative", flex: "0 0 auto" }}>
          <svg
            style={{ position: "absolute", left: "0.65rem", top: "50%", transform: "translateY(-50%)", opacity: 0.4, pointerEvents: "none" }}
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
          >
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            placeholder="Search templates…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="template-search"
            style={{
              paddingLeft: "2rem", paddingRight: "0.75rem",
              paddingTop: "0.32rem", paddingBottom: "0.32rem",
              borderRadius: 999,
              /* font-size handled by globals.css (min 16px) to prevent iOS zoom */
              background: "var(--surface)", color: "var(--fg)",
              border: "1px solid var(--border)", outline: "none",
              width: 200, transition: "border-color 0.15s, width 0.2s",
            }}
            onFocus={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.width = "240px"; }}
            onBlur={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.width = "200px"; }}
          />
        </div>

        {/* Category pills */}
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", alignItems: "center", flex: 1 }}>
          {CATEGORIES.filter(cat => countFor(cat) > 0 || cat === active).map(cat => {
            const isActive = cat === active;
            return (
              <button
                key={cat}
                onClick={() => setActive(cat)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "0.4rem",
                  padding: "0.28rem 0.8rem", borderRadius: 999,
                  fontSize: "0.8rem", fontWeight: isActive ? 600 : 400,
                  background: isActive ? "var(--accent)" : "var(--surface)",
                  border: `1px solid ${isActive ? "var(--accent)" : "var(--border)"}`,
                  color: isActive ? "#fff" : "var(--fg-muted)",
                  cursor: "pointer", transition: "all 0.15s",
                }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--fg)"; } }}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--fg-muted)"; } }}
              >
                {cat}
                <span style={{
                  fontSize: "0.65rem", padding: "0.05rem 0.38rem", borderRadius: 999, lineHeight: 1.6, fontWeight: 500,
                  background: isActive ? "rgba(255,255,255,0.22)" : "var(--surface2)",
                  color: isActive ? "#fff" : "var(--fg-muted)",
                }}>
                  {countFor(cat)}
                </span>
              </button>
            );
          })}

          {(active !== "All" || query) && (
            <button
              onClick={() => { setActive("All"); setQuery(""); }}
              style={{
                fontSize: "0.75rem", color: "var(--fg-muted)", background: "none",
                border: "none", cursor: "pointer", padding: "0.2rem 0.4rem",
                textDecoration: "underline", textUnderlineOffset: 3,
              }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Result count */}
      <p style={{ fontSize: "0.75rem", color: "var(--fg-muted)", margin: "0 0 1.25rem" }}>
        {filtered.length === TEMPLATES.length
          ? `${TEMPLATES.length} templates`
          : `${filtered.length} of ${TEMPLATES.length} templates`}
        {query && <> matching <em>&ldquo;{query}&rdquo;</em></>}
      </p>

      {/* ── Template grid ────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "4rem 1.5rem",
          border: "2px dashed var(--border)", borderRadius: 12,
          color: "var(--fg-muted)", fontSize: "0.9rem",
        }}>
          <p style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🔍</p>
          No templates match <strong>&ldquo;{query}&rdquo;</strong> in {active === "All" ? "any category" : active}.
          <br />
          <button
            onClick={() => { setActive("All"); setQuery(""); }}
            style={{
              marginTop: "1rem", padding: "0.45rem 1rem", borderRadius: 7,
              background: "var(--accent)", color: "#fff", border: "none",
              fontWeight: 600, fontSize: "0.84rem", cursor: "pointer",
            }}
          >
            Show all templates
          </button>
        </div>
      ) : (
        <div className="templates-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem" }}>
          {filtered.map(t => {
            const encoded  = LZString.compressToEncodedURIComponent(t.source);
            const href     = `/tools/preview#s=${encoded}`;
            const lines    = t.source.split("\n").length;
            const isGE     = t.category === "Grande École";
            const isNew    = NEW_TEMPLATE_IDS.has(t.id);

            return (
              <article
                key={t.id}
                className="template-card"
                style={{
                  background: "var(--surface)",
                  border: `1px solid ${isGE ? "rgba(0,56,168,0.35)" : "var(--border)"}`,
                  borderRadius: 10,
                  padding: "1.4rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                  ...(isGE ? { borderLeft: "3px solid #003BA0" } : {}),
                }}
              >
                {/* Top row: icon + badges */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "0.1rem" }}>
                  <span style={{ fontSize: "1.6rem", lineHeight: 1 }} aria-hidden="true">{t.icon}</span>
                  <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
                    {isNew && (
                      <span style={{
                        fontSize: "0.6rem", fontWeight: 700, padding: "0.17rem 0.5rem",
                        borderRadius: 999, background: "rgba(16,185,129,0.12)",
                        border: "1px solid rgba(16,185,129,0.4)", color: "#10b981",
                        letterSpacing: "0.06em", textTransform: "uppercase",
                      }}>
                        NEW
                      </span>
                    )}
                    <span style={{
                      fontSize: "0.64rem", fontWeight: 600, padding: "0.17rem 0.5rem",
                      borderRadius: 999, background: isGE ? "rgba(0,56,168,0.1)" : "var(--surface2)",
                      border: `1px solid ${isGE ? "rgba(0,56,168,0.3)" : "var(--border)"}`,
                      color: isGE ? "#003BA0" : "var(--fg-muted)", letterSpacing: "0.04em",
                    }}>
                      {t.category}
                    </span>
                    <span style={{
                      fontSize: "0.62rem", fontWeight: 500, padding: "0.17rem 0.45rem",
                      borderRadius: 999, background: "var(--surface2)",
                      border: "1px solid var(--border)", color: "var(--fg-muted)",
                      fontFamily: "var(--font-mono), monospace",
                    }}>
                      {lines}L
                    </span>
                  </div>
                </div>

                <h2 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "var(--fg)", lineHeight: 1.3 }}>
                  {t.title}
                </h2>

                <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--fg-muted)", lineHeight: 1.65, flex: 1 }}>
                  {t.desc}
                </p>

                {/* Action row: Open in editor + Copy source */}
                <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.5rem" }}>
                  <Link
                    href={href}
                    style={{
                      flex: 2,
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      gap: "0.35rem", padding: "0.52rem 0.8rem", borderRadius: 7,
                      background: "linear-gradient(135deg, var(--accent), var(--accent2))",
                      color: "#fff", fontWeight: 600, fontSize: "0.82rem",
                      textDecoration: "none", transition: "opacity 0.15s",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = "0.88")}
                    onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
                  >
                    Open in editor →
                  </Link>
                  <CopySourceBtn source={t.source} />
                </div>
              </article>
            );
          })}
        </div>
      )}

      <style>{`
        /* Template grid — 1 column on very small phones */
        @media (max-width: 380px) {
          .templates-grid { grid-template-columns: 1fr !important; }
        }
        /* Search row — stack on phones */
        @media (max-width: 480px) {
          .filter-row { flex-direction: column; align-items: stretch !important; }
          .template-search { width: 100% !important; }
        }
      `}</style>

      {/* ── Logo / image quick-guide ──────────────────────────────── */}
      <div style={{
        marginTop: "2.5rem",
        padding: "1.25rem 1.5rem",
        background: "color-mix(in srgb, var(--accent) 6%, transparent)",
        border: "1px solid color-mix(in srgb, var(--accent) 22%, transparent)",
        borderRadius: 10,
      }}>
        <h3 style={{ margin: "0 0 0.8rem", fontSize: "0.92rem", fontWeight: 700, color: "var(--fg)" }}>
          🖼️ How to add a university logo or photo to any template
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
          {[
            {
              label: "Add a logo to a title page",
              code: "\\includegraphics[height=2cm]{university-logo.png}",
              note: "Put the PNG/PDF file next to your .tex. Adjust height= to fit.",
            },
            {
              label: "Add a photo to a CV",
              code: "\\includegraphics[width=3cm,clip]{photo.jpg}",
              note: "Use clip with trim= to crop. Wrap in a minipage to float right.",
            },
            {
              label: "Logo on every Beamer slide",
              code: "\\logo{\\includegraphics[height=0.65cm]{logo.png}}",
              note: "Put in the preamble (before \\begin{document}). Scales automatically.",
            },
            {
              label: "Two logos side-by-side",
              code: "\\includegraphics[height=1.5cm]{logo-a}\\hfill\\includegraphics[height=1.5cm]{logo-b}",
              note: "\\hfill pushes them apart. Useful for institution + lab co-branding.",
            },
          ].map(item => (
            <div key={item.label} style={{
              background: "var(--surface)", border: "1px solid var(--border)",
              borderRadius: 8, padding: "0.9rem 1rem",
            }}>
              <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--fg)", marginBottom: "0.35rem" }}>
                {item.label}
              </div>
              <code style={{
                display: "block",
                background: "var(--surface2)", color: "var(--accent2)",
                padding: "0.4rem 0.6rem", borderRadius: 5,
                fontSize: "0.72rem", fontFamily: "var(--font-mono), monospace",
                lineHeight: 1.55, marginBottom: "0.35rem",
                wordBreak: "break-all",
              }}>
                {item.code}
              </code>
              <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--fg-muted)", lineHeight: 1.5 }}>
                {item.note}
              </p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
