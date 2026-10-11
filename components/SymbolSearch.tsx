"use client";
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { CATEGORIES, searchSymbols, type SymbolEntry } from "@/lib/symbols";

// ── KaTeX lazy loader ────────────────────────────────────────────────────────
let katexLoaded = false;
let katexRender: ((tex: string, opts: object) => string) | null = null;

function renderKaTeX(tex: string): string {
  if (!katexRender) return tex;
  try {
    return katexRender(tex, {
      throwOnError: false,
      displayMode: false,
      trust: false,
    });
  } catch {
    return tex;
  }
}

// ── Package badge colors — HSL + alpha, works on both dark and light bg ──────
// Using hsl(h s% l% / alpha) avoids SSR/DOM access and adapts to any theme.
const PKG_HSL: Record<string, [number, string, string]> = {
  base:      [122, "39%", "44%"],  // green
  amsmath:   [213, "79%", "52%"],  // blue
  amssymb:   [271, "68%", "55%"],  // purple
  mathtools: [ 25, "90%", "50%"],  // orange
  textcomp:  [  0, "72%", "51%"],  // red
};

function pkgStyle(pkg: string): React.CSSProperties {
  const hsl = PKG_HSL[pkg];
  if (!hsl) return { background: "var(--surface2)", color: "var(--fg-muted)" };
  const [h, s, l] = hsl;
  return {
    background: `hsl(${h} ${s} ${l} / 0.14)`,
    color:      `hsl(${h} ${s} ${l})`,
  };
}

// ── Symbol Card ───────────────────────────────────────────────────────────────
function SymbolCard({ sym, onCopy, katexReady }: { sym: SymbolEntry; onCopy: (cmd: string) => void; katexReady: boolean }) {
  const [copied, setCopied] = useState(false);

  // Derived, not state — recomputes when the symbol changes or when KaTeX
  // finishes loading (katexReady flips exactly once per page load).
  const html = useMemo(
    () => (katexReady && katexRender ? renderKaTeX(sym.render ?? sym.command) : ""),
    [sym.command, sym.render, katexReady],
  );

  function copy() {
    // Only confirm once the clipboard write actually succeeded (it rejects on
    // insecure origins or when permission is denied).
    navigator.clipboard?.writeText(sym.command).then(() => {
      setCopied(true);
      onCopy(sym.command);
      setTimeout(() => setCopied(false), 1500);
    }).catch(() => {});
  }

  return (
    <button
      onClick={copy}
      title={`Copy: ${sym.command}${sym.description ? ` (${sym.description})` : ""}`}
      className="symbol-card"
    >
      {/* KaTeX preview */}
      <span
        className="symbol-card-glyph"
        dangerouslySetInnerHTML={{ __html: html || sym.unicode }}
      />

      {/* Command */}
      <code className="symbol-card-cmd">
        {sym.command}
      </code>

      {/* Package badge */}
      <span className="symbol-card-pkg" style={pkgStyle(sym.package)}>
        {sym.package}
      </span>

      {/* Copied overlay */}
      {copied && (
        <span style={{
          position: "absolute", inset: 0, display: "flex", alignItems: "center",
          justifyContent: "center", borderRadius: 10,
          background: "color-mix(in srgb, var(--accent) 90%, transparent)",
          color: "#fff", fontSize: "0.8rem", fontWeight: 700,
          pointerEvents: "none",
        }}>
          Copied!
        </span>
      )}
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function SymbolSearch() {
  const [inputValue, setInputValue] = useState(""); // raw keystroke value
  const [query, setQuery]           = useState(""); // debounced search query
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [katexReady, setKatexReady] = useState(() => katexLoaded);
  const [lastCopied, setLastCopied] = useState<string | null>(null);
  const inputRef  = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce search: only run the O(n) filter 120 ms after the user stops typing
  const handleQueryChange = useCallback((value: string) => {
    setInputValue(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setQuery(value), 120);
  }, []);

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  // Load KaTeX on mount
  useEffect(() => {
    if (katexReady) return; // already loaded (lazy initial state caught it)
    let alive = true;
    import("katex").then((mod) => {
      const k = (mod.default ?? mod) as { renderToString: (tex: string, opts: object) => string };
      katexRender = k.renderToString.bind(k);
      katexLoaded = true;
      if (alive) setKatexReady(true);
    });
    return () => { alive = false; };
  }, [katexReady]);

  // Force re-render all cards once KaTeX is ready
  const results = useMemo(() => {
    const searched = searchSymbols(query);
    if (activeCategory === "All") return searched;
    return searched.filter((s) => s.category === activeCategory);
  }, [query, activeCategory]);


  const catCounts = useMemo(() => {
    const searched = searchSymbols(query);
    const counts: Record<string, number> = { All: searched.length };
    for (const sym of searched) {
      counts[sym.category] = (counts[sym.category] ?? 0) + 1;
    }
    return counts;
  }, [query]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Search bar */}
      <div style={{ position: "relative" }}>
        <span style={{
          position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)",
          color: "var(--fg-muted)", fontSize: "1rem", pointerEvents: "none",
        }}>
          <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true" style={{ display: "block" }}><circle cx="6.5" cy="6.5" r="5" fill="none" stroke="currentColor" strokeWidth="1.4" /><path d="M10.2 10.2 15 15" stroke="currentColor" strokeWidth="1.4" /></svg>
        </span>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => handleQueryChange(e.target.value)}
          aria-label="Search LaTeX symbols"
          placeholder='Search by name ("integral"), command ("\\sum"), or Unicode ("∑")'
          autoFocus
          style={{
            width: "100%",
            padding: "0.8rem 1rem 0.8rem 2.75rem",
            fontSize: "0.92rem",
            background: "var(--surface)",
            border: "1.5px solid var(--border)",
            borderRadius: 10,
            color: "var(--fg)",
            outline: "none",
            boxSizing: "border-box",
            transition: "border-color 0.15s",
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
        />
        {query && (
          <button
            onClick={() => { setInputValue(""); setQuery(""); inputRef.current?.focus(); }}
            style={{
              position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none", color: "var(--fg-muted)", cursor: "pointer",
              fontSize: "1.1rem", padding: "0.2rem", lineHeight: 1,
            }}
          >
            ×
          </button>
        )}
      </div>

      {/* Last copied banner */}
      {lastCopied && (
        <div style={{
          padding: "0.5rem 1rem",
          background: "color-mix(in srgb, var(--accent) 8%, transparent)",
          border: "1px solid color-mix(in srgb, var(--accent) 25%, transparent)",
          borderRadius: 8,
          fontSize: "0.85rem",
          color: "var(--fg-muted)",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
        }}>
          <span style={{ color: "var(--accent)", fontWeight: 700 }}>✓ Copied</span>
          <code style={{ color: "var(--fg)", fontFamily: "var(--font-mono, monospace)" }}>{lastCopied}</code>
          <span style={{ marginLeft: "auto", fontSize: "0.75rem" }}>Click any symbol to copy its command</span>
        </div>
      )}

      {/* Category filter pills */}
      <div style={{
        display: "flex", gap: "0.4rem", flexWrap: "wrap",
        padding: "0.25rem 0",
      }}>
        {["All", ...CATEGORIES].map((cat) => {
          const count = catCounts[cat] ?? 0;
          const active = cat === activeCategory;
          if (count === 0 && cat !== "All") return null;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: "0.3rem 0.75rem",
                borderRadius: 20,
                fontSize: "0.78rem",
                fontWeight: active ? 700 : 400,
                cursor: "pointer",
                border: active
                  ? "1.5px solid var(--accent)"
                  : "1px solid var(--border)",
                background: active
                  ? "color-mix(in srgb, var(--accent) 12%, transparent)"
                  : "var(--surface)",
                color: active ? "var(--accent2)" : "var(--fg-muted)",
                transition: "all 0.12s",
                whiteSpace: "nowrap",
              }}
            >
              {cat} <span style={{ opacity: 0.65, marginLeft: "0.2rem" }}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Results grid */}
      {results.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "3rem 1rem",
          color: "var(--fg-muted)", fontSize: "0.9rem",
        }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>∅</div>
          <div>No symbols found for <strong>&ldquo;{query}&rdquo;</strong></div>
          <button
            onClick={() => { setInputValue(""); setQuery(""); setActiveCategory("All"); }}
            style={{
              marginTop: "0.75rem", padding: "0.4rem 1rem",
              borderRadius: 6, border: "1px solid var(--border)",
              background: "var(--surface2)", color: "var(--fg)",
              cursor: "pointer", fontSize: "0.82rem",
            }}
          >
            Clear search
          </button>
        </div>
      ) : (
        <>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
            gap: "0.6rem",
          }}>
            {results.map((sym, i) => (
              <SymbolCard
                key={`${sym.command}-${i}`}
                sym={sym}
                onCopy={setLastCopied}
                katexReady={katexReady}
              />
            ))}
          </div>
          <p style={{ fontSize: "0.78rem", color: "var(--fg-muted)", textAlign: "right", margin: 0 }}>
            {results.length} symbol{results.length !== 1 ? "s" : ""}
            {activeCategory !== "All" ? ` in ${activeCategory}` : ""}
            {!katexReady && <span style={{ marginLeft: "0.5rem" }}>(loading preview…)</span>}
          </p>
        </>
      )}

      {/* Package legend */}
      <details style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
        <summary style={{ cursor: "pointer", fontSize: "0.82rem", color: "var(--fg-muted)", fontWeight: 600 }}>
          Package guide, what to add to your preamble
        </summary>
        <div style={{ marginTop: "0.75rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {[
            { pkg: "base",      cmd: "% built-in, no \\usepackage needed" },
            { pkg: "amsmath",   cmd: "\\usepackage{amsmath}" },
            { pkg: "amssymb",   cmd: "\\usepackage{amssymb}" },
            { pkg: "mathtools", cmd: "\\usepackage{mathtools}" },
            { pkg: "textcomp",  cmd: "\\usepackage{textcomp}" },
          ].map(({ pkg, cmd }) => (
            <div key={pkg} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span style={{
                fontSize: "0.7rem", fontWeight: 700, padding: "0.15rem 0.5rem",
                borderRadius: 4, ...pkgStyle(pkg), minWidth: 70, textAlign: "center",
              }}>
                {pkg}
              </span>
              <code style={{ fontSize: "0.82rem", color: "var(--fg-muted)", fontFamily: "var(--font-mono, monospace)" }}>
                {cmd}
              </code>
            </div>
          ))}
        </div>
      </details>

      <style>{`
        /* Classes, not inline styles: ~380 cards are server-rendered, and the
           repeated style attributes alone weighed ~320 KB of HTML. No
           all: unset either, so the global :focus-visible ring still applies. */
        .symbol-card {
          appearance: none; margin: 0; font: inherit; color: inherit; text-align: inherit;
          cursor: pointer; display: flex; flex-direction: column; align-items: center;
          justify-content: space-between; gap: 0.5rem; padding: 0.85rem 0.6rem 0.7rem;
          background: var(--surface); border: 1px solid var(--border); border-radius: 10px;
          transition: border-color 0.15s, transform 0.12s, box-shadow 0.12s;
          position: relative; min-height: 96px; width: 100%; box-sizing: border-box;
        }
        .symbol-card-glyph { font-size: 1.35rem; line-height: 1.2; min-height: 32px; display: flex; align-items: center; }
        .symbol-card-cmd {
          font-size: 0.65rem; font-family: var(--font-mono, monospace); color: var(--fg-muted);
          word-break: break-all; text-align: center; line-height: 1.3;
        }
        .symbol-card-pkg { font-size: 0.58rem; font-weight: 700; padding: 0.1rem 0.4rem; border-radius: 4px; letter-spacing: 0.04em; }
        .symbol-card:hover {
          border-color: var(--accent) !important;
          transform: translateY(-2px);
          box-shadow: 0 4px 16px color-mix(in srgb, var(--accent) 15%, transparent);
        }
        .symbol-card:active { transform: translateY(0); }
        .symbol-card:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: 2px;
          border-color: var(--accent);
        }
      `}</style>
    </div>
  );
}
