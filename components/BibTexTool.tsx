"use client";
import { useState, useCallback, useRef } from "react";
import { cleanBibTeX } from "@/lib/bibtex";

type Tab = "clean" | "doi" | "arxiv";

// ── tiny shared button ────────────────────────────────────────────────────────
function Btn({
  children, onClick, disabled, variant = "default",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "default" | "primary" | "danger";
}) {
  const bg = variant === "primary" ? "var(--accent)"
           : variant === "danger"  ? "#dc2626"
           : "var(--surface2)";
  const col = variant !== "default" ? "#fff" : "var(--fg-muted)";
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: bg, color: col, border: `1px solid ${variant === "default" ? "var(--border)" : "transparent"}`,
      borderRadius: 6, padding: "0.35rem 0.85rem", fontSize: "0.82rem",
      fontWeight: variant !== "default" ? 600 : 400,
      cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1,
      transition: "opacity 0.15s",
    }}>
      {children}
    </button>
  );
}

// ── Copy button ───────────────────────────────────────────────────────────────
function CopyBtn({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <Btn onClick={() => {
      navigator.clipboard.writeText(text).then(() => {
        setDone(true);
        setTimeout(() => setDone(false), 2000);
      });
    }}>
      {done ? "✓ Copied!" : "Copy BibTeX"}
    </Btn>
  );
}

// ── Output box ────────────────────────────────────────────────────────────────
function OutputBox({ value, label }: { value: string; label?: string }) {
  return (
    <div>
      {label && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
          <span style={{ fontSize: "0.82rem", color: "var(--fg-muted)", fontWeight: 500 }}>{label}</span>
          <CopyBtn text={value} />
        </div>
      )}
      <textarea
        readOnly value={value}
        style={{
          width: "100%", minHeight: 240, background: "var(--surface)", color: "var(--fg)",
          border: "1px solid var(--border)", borderRadius: 8, padding: "0.9rem 1rem",
          fontFamily: "JetBrains Mono, monospace", fontSize: "12.5px",
          lineHeight: 1.7, resize: "vertical", boxSizing: "border-box",
          outline: "none",
        }}
      />
    </div>
  );
}

// ── Clean tab ─────────────────────────────────────────────────────────────────
function CleanTab() {
  const [input, setInput]       = useState("");
  const [output, setOutput]     = useState("");
  const [stats, setStats]       = useState<{ total: number; removed: number; fieldsStripped: number } | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [sort, setSort]         = useState<"key" | "year" | "type" | "none">("key");
  const [dedup, setDedup]       = useState(true);
  const [norAuth, setNorAuth]   = useState(true);
  const [strip, setStrip]       = useState("abstract,file,mendeley-tags");
  const fileRef = useRef<HTMLInputElement>(null);

  const run = useCallback(() => {
    const result = cleanBibTeX(input, {
      sort,
      removeDuplicates: dedup,
      normalizeAuthors: norAuth,
      stripFields: strip.split(",").map(s => s.trim()).filter(Boolean),
      uppercaseTypes: true,
    });
    setOutput(result.output);
    setStats(result.stats);
    setWarnings(result.warnings);
  }, [input, sort, dedup, norAuth, strip]);

  const loadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    f.text().then(setInput);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Options row */}
      <div style={{
        display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center",
        padding: "0.85rem 1rem", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <label style={{ fontSize: "0.8rem", color: "var(--fg-muted)" }}>Sort:</label>
          <select value={sort} onChange={e => setSort(e.target.value as typeof sort)} style={{
            background: "var(--surface2)", color: "var(--fg)", border: "1px solid var(--border)",
            borderRadius: 5, padding: "0.2rem 0.5rem", fontSize: "0.8rem",
          }}>
            <option value="key">By key</option>
            <option value="year">By year ↓</option>
            <option value="type">By type</option>
            <option value="none">Don't sort</option>
          </select>
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem", color: "var(--fg-muted)", cursor: "pointer" }}>
          <input type="checkbox" checked={dedup} onChange={e => setDedup(e.target.checked)} />
          Remove duplicates
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem", color: "var(--fg-muted)", cursor: "pointer" }}>
          <input type="checkbox" checked={norAuth} onChange={e => setNorAuth(e.target.checked)} />
          Normalize authors
        </label>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flex: 1, minWidth: 180 }}>
          <label style={{ fontSize: "0.8rem", color: "var(--fg-muted)", whiteSpace: "nowrap" }}>Strip fields:</label>
          <input
            value={strip} onChange={e => setStrip(e.target.value)}
            placeholder="abstract, file, url"
            style={{
              flex: 1, background: "var(--surface2)", color: "var(--fg)", border: "1px solid var(--border)",
              borderRadius: 5, padding: "0.2rem 0.5rem", fontSize: "0.8rem",
            }}
          />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        {/* Input */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.82rem", color: "var(--fg-muted)", fontWeight: 500 }}>Paste your .bib file</span>
            <div style={{ display: "flex", gap: "0.4rem" }}>
              <input ref={fileRef} type="file" accept=".bib,.txt" onChange={loadFile} style={{ display: "none" }} />
              <Btn onClick={() => fileRef.current?.click()}>Upload .bib</Btn>
            </div>
          </div>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={"@article{smith2023,\n  author = {Smith, John},\n  title  = {My Paper},\n  year   = {2023},\n  journal= {Nature}\n}"}
            style={{
              width: "100%", minHeight: 280, background: "var(--surface)", color: "var(--fg)",
              border: "1px solid var(--border)", borderRadius: 8, padding: "0.9rem 1rem",
              fontFamily: "JetBrains Mono, monospace", fontSize: "12.5px",
              lineHeight: 1.7, resize: "vertical", boxSizing: "border-box", outline: "none",
            }}
          />
        </div>

        {/* Output */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.82rem", color: "var(--fg-muted)", fontWeight: 500 }}>
              {stats ? `${stats.total - stats.removed} entries` : "Cleaned output"}
            </span>
            {output && <CopyBtn text={output} />}
          </div>
          <textarea
            readOnly value={output}
            placeholder="Cleaned BibTeX will appear here…"
            style={{
              width: "100%", minHeight: 280, background: "var(--surface)", color: "var(--fg)",
              border: "1px solid var(--border)", borderRadius: 8, padding: "0.9rem 1rem",
              fontFamily: "JetBrains Mono, monospace", fontSize: "12.5px",
              lineHeight: 1.7, resize: "vertical", boxSizing: "border-box", outline: "none",
            }}
          />
        </div>
      </div>

      {/* Action + stats */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
        <Btn variant="primary" onClick={run} disabled={!input.trim()}>
          ✦ Clean BibTeX
        </Btn>
        {stats && (
          <span style={{ fontSize: "0.82rem", color: "var(--fg-muted)" }}>
            {stats.total} parsed · {stats.removed} duplicate{stats.removed !== 1 ? "s" : ""} removed
            {stats.fieldsStripped > 0 ? ` · ${stats.fieldsStripped} fields stripped` : ""}
          </span>
        )}
        {output && (
          <Btn onClick={() => {
            const blob = new Blob([output], { type: "text/plain" });
            const a = Object.assign(document.createElement("a"), {
              href: URL.createObjectURL(blob),
              download: "cleaned.bib",
            });
            a.click();
          }}>
            ↓ Download .bib
          </Btn>
        )}
      </div>

      {warnings.length > 0 && (
        <div style={{
          padding: "0.75rem 1rem", background: "rgba(234,179,8,0.08)",
          border: "1px solid rgba(234,179,8,0.3)", borderRadius: 8,
          fontSize: "0.82rem", color: "#ca8a04",
        }}>
          {warnings.map((w, i) => <div key={i}>⚠ {w}</div>)}
        </div>
      )}
    </div>
  );
}

// ── DOI tab ───────────────────────────────────────────────────────────────────
function DoiTab() {
  const [doi,    setDoi]    = useState("");
  const [result, setResult] = useState("");
  const [error,  setError]  = useState("");
  const [loading, setLoading] = useState(false);

  const lookup = async () => {
    const d = doi.trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, "");
    if (!d) return;
    setLoading(true); setError(""); setResult("");
    try {
      const res = await fetch(`/api/doi-to-bibtex?doi=${encodeURIComponent(d)}`);
      if (!res.ok) {
        const j = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        setError(j.error ?? "Unknown error");
      } else {
        setResult(await res.text());
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", maxWidth: 680 }}>
      <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--fg-muted)", lineHeight: 1.7 }}>
        Paste a DOI and get a perfectly formatted BibTeX entry from{" "}
        <a href="https://www.crossref.org/" target="_blank" rel="noopener" style={{ color: "var(--accent)" }}>CrossRef</a>.{" "}
        Works for journals, conference papers, books, and datasets.
      </p>
      <div style={{ display: "flex", gap: "0.65rem" }}>
        <input
          value={doi}
          onChange={e => setDoi(e.target.value)}
          onKeyDown={e => e.key === "Enter" && lookup()}
          placeholder="10.1038/s41586-021-03819-2  or  https://doi.org/10.xxxx/..."
          style={{
            flex: 1, background: "var(--surface)", color: "var(--fg)",
            border: "1px solid var(--border)", borderRadius: 7,
            padding: "0.55rem 0.9rem", fontSize: "0.9rem", outline: "none",
          }}
        />
        <Btn variant="primary" onClick={lookup} disabled={loading || !doi.trim()}>
          {loading ? "Looking up…" : "Get BibTeX"}
        </Btn>
      </div>

      {error && (
        <div style={{ padding: "0.75rem 1rem", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, color: "#f87171", fontSize: "0.85rem" }}>
          {error}
        </div>
      )}
      {result && <OutputBox value={result} label="BibTeX from CrossRef" />}
    </div>
  );
}

// ── arXiv tab ─────────────────────────────────────────────────────────────────
function ArxivTab() {
  const [id,     setId]     = useState("");
  const [result, setResult] = useState("");
  const [error,  setError]  = useState("");
  const [loading, setLoading] = useState(false);

  const lookup = async () => {
    const raw = id.trim();
    if (!raw) return;
    setLoading(true); setError(""); setResult("");
    try {
      const res = await fetch(`/api/arxiv-to-bibtex?id=${encodeURIComponent(raw)}`);
      if (!res.ok) {
        const j = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        setError(j.error ?? "Unknown error");
      } else {
        setResult(await res.text());
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", maxWidth: 680 }}>
      <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--fg-muted)", lineHeight: 1.7 }}>
        Enter an arXiv ID and get a ready-to-use BibTeX entry.
        Fetches metadata directly from{" "}
        <a href="https://arxiv.org/" target="_blank" rel="noopener" style={{ color: "var(--accent)" }}>arXiv.org</a>.
      </p>
      <div style={{ display: "flex", gap: "0.65rem" }}>
        <input
          value={id}
          onChange={e => setId(e.target.value)}
          onKeyDown={e => e.key === "Enter" && lookup()}
          placeholder="2301.07041  or  arxiv:2301.07041  or  https://arxiv.org/abs/2301.07041"
          style={{
            flex: 1, background: "var(--surface)", color: "var(--fg)",
            border: "1px solid var(--border)", borderRadius: 7,
            padding: "0.55rem 0.9rem", fontSize: "0.9rem", outline: "none",
          }}
        />
        <Btn variant="primary" onClick={lookup} disabled={loading || !id.trim()}>
          {loading ? "Looking up…" : "Get BibTeX"}
        </Btn>
      </div>

      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem",
        fontSize: "0.78rem", color: "var(--fg-muted)",
      }}>
        {["2301.07041", "1706.03762", "2005.14165"].map(ex => (
          <button key={ex} onClick={() => setId(ex)} style={{
            background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 5,
            padding: "0.25rem 0.5rem", cursor: "pointer", color: "var(--fg-muted)", fontSize: "0.78rem",
          }}>
            {ex}
          </button>
        ))}
      </div>

      {error && (
        <div style={{ padding: "0.75rem 1rem", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, color: "#f87171", fontSize: "0.85rem" }}>
          {error}
        </div>
      )}
      {result && <OutputBox value={result} label="BibTeX from arXiv" />}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function BibTexTool() {
  const [tab, setTab] = useState<Tab>("clean");

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "clean",  label: "Clean & Format",  icon: "✦" },
    { id: "doi",    label: "DOI → BibTeX",    icon: "🔗" },
    { id: "arxiv",  label: "arXiv → BibTeX",  icon: "📄" },
  ];

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "3rem 1.5rem" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
        <h1 style={{
          fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.03em",
          background: "linear-gradient(135deg, var(--accent), var(--accent2))",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          marginBottom: "0.5rem",
        }}>
          BibTeX Tools
        </h1>
        <p style={{ color: "var(--fg-muted)", fontSize: "1rem", lineHeight: 1.65, maxWidth: 580, margin: "0 auto" }}>
          Clean messy .bib files, look up DOIs, and fetch arXiv citations — all in one place,
          zero signup required.
        </p>
      </div>

      {/* Tab bar */}
      <div style={{
        display: "flex", gap: "0.3rem", marginBottom: "2rem",
        borderBottom: "1px solid var(--border)", paddingBottom: 0,
      }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: "0.55rem 1.1rem",
            background: "transparent",
            border: "none",
            borderBottom: `2px solid ${tab === t.id ? "var(--accent)" : "transparent"}`,
            color: tab === t.id ? "var(--accent2)" : "var(--fg-muted)",
            fontSize: "0.88rem", fontWeight: tab === t.id ? 700 : 400,
            cursor: "pointer", marginBottom: -1, transition: "all 0.15s",
          }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "clean"  && <CleanTab />}
      {tab === "doi"    && <DoiTab />}
      {tab === "arxiv"  && <ArxivTab />}

      {/* Pro tip */}
      <div style={{
        marginTop: "2.5rem", padding: "1rem 1.25rem",
        background: "color-mix(in srgb, var(--accent) 6%, transparent)",
        border: "1px solid color-mix(in srgb, var(--accent) 20%, transparent)",
        borderRadius: 8, fontSize: "0.83rem", color: "var(--fg-muted)", lineHeight: 1.7,
      }}>
        <strong style={{ color: "var(--accent2)" }}>💡 Pro tip:</strong>{" "}
        Clean your .bib file here, then upload it directly to Overleaf via{" "}
        <em>New Project → Upload Project</em>, or paste it into your Overleaf bibliography file.
        The DOI and arXiv lookups give you correctly-formatted entries in one click.
      </div>
    </div>
  );
}
