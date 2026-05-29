"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import LZString from "lz-string";
import { TEMPLATES, CATEGORIES } from "@/lib/templates";

export default function TemplatesFilter() {
  const [active, setActive] = useState("All");
  const [query,  setQuery]  = useState("");

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    const byCategory = active === "All" ? TEMPLATES : TEMPLATES.filter(t => t.category === active);
    if (!q) return byCategory;
    return byCategory.filter(t =>
      t.title.toLowerCase().includes(q) ||
      t.desc.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q)
    );
  }, [active, query]);

  const countFor = (cat: string) =>
    cat === "All" ? TEMPLATES.length : TEMPLATES.filter(t => t.category === cat).length;

  return (
    <>
      {/* ── Search + Filter row ───────────────────────────────── */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap", alignItems: "center" }}>
        {/* Search input */}
        <div style={{ position: "relative", flexShrink: 0 }}>
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
            style={{
              paddingLeft: "2rem", paddingRight: "0.75rem",
              paddingTop: "0.32rem", paddingBottom: "0.32rem",
              borderRadius: 999, fontSize: "0.82rem",
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
          {CATEGORIES.map(cat => {
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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
          {filtered.map(t => {
            const encoded  = LZString.compressToEncodedURIComponent(t.source);
            const href     = `/tools/preview#s=${encoded}`;
            const lines    = t.source.split("\n").length;
            const isGE     = t.category === "Grande École";

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
                      fontFamily: "JetBrains Mono, monospace",
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

                <Link
                  href={href}
                  style={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    gap: "0.35rem", padding: "0.52rem 1rem", borderRadius: 7,
                    background: "linear-gradient(135deg, var(--accent), var(--accent2))",
                    color: "#fff", fontWeight: 600, fontSize: "0.82rem",
                    textDecoration: "none", marginTop: "0.5rem", transition: "opacity 0.15s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = "0.88")}
                  onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
                >
                  Open in editor →
                </Link>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
