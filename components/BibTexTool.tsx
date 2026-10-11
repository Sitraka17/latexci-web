"use client";
import { useState, useCallback, useRef } from "react";
import { cleanBibTeX } from "@/lib/bibtex";
import { normalizeDoi } from "@/lib/bib-escape";
import "@/app/tools/bibtex/bibtex.css";

export type Tab = "clean" | "doi" | "arxiv" | "pmid" | "isbn";

// ── tiny shared button ────────────────────────────────────────────────────────
function Btn({
  children, onClick, disabled, variant = "default", small = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "default" | "primary";
  small?: boolean;
}) {
  const cls = ["btn", variant === "primary" ? "btn-primary" : "", small ? "btn-sm" : ""].filter(Boolean).join(" ");
  return (
    <button type="button" className={cls} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

// ── Copy button ───────────────────────────────────────────────────────────────
function CopyBtn({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <Btn small onClick={() => {
      navigator.clipboard.writeText(text).then(() => {
        setDone(true);
        setTimeout(() => setDone(false), 2000);
      }).catch(() => {});
    }}>
      {done ? "Copied" : "Copy BibTeX"}
    </Btn>
  );
}

// ── Output pane (right-hand side of every lookup tab) ────────────────────────
function OutputBox({ value, label, placeholder }: { value: string; label?: string; placeholder?: string }) {
  return (
    <div className="bib-pane">
      <div className="bib-panehead">
        <span>{label ?? "BibTeX output"}</span>
        {value && <CopyBtn text={value} />}
      </div>
      <textarea
        readOnly value={value}
        aria-label={label ?? "BibTeX output"}
        placeholder={placeholder}
        className="codebox bib-area"
      />
    </div>
  );
}

// ── Shared layout of a lookup tab: query on the left, entry on the right ─────
function LookupLayout({
  intro, fieldId, fieldLabel, input, button, examples, error, result, resultLabel,
}: {
  intro: React.ReactNode;
  fieldId: string;
  fieldLabel: string;
  input: React.ReactNode;
  button: React.ReactNode;
  examples: React.ReactNode;
  error: string;
  result: string;
  resultLabel: string;
}) {
  return (
    <div className="bib-cols bib-lookup">
      <div className="bib-pane">
        <p className="bib-intro">{intro}</p>
        <div className="field">
          <label htmlFor={fieldId}>{fieldLabel}</label>
          <div className="bib-row">
            {input}
            {button}
          </div>
        </div>
        {examples}
        {error && (
          <p className="bib-msg is-error" role="alert"><b>Error.</b> {error}</p>
        )}
      </div>
      <OutputBox value={result} label={resultLabel} placeholder="The BibTeX entry will appear here." />
    </div>
  );
}

// ── Sample BibTeX (used as default content so Clean works on page load) ──────
const SAMPLE_BIB = `@article{smith2023,
  author   = {John Smith and Jane Doe},
  title    = {A Study of Distributed Systems},
  journal  = {Journal of Computer Science},
  year     = {2023},
  volume   = {45},
  number   = {2},
  pages    = {100--120},
  abstract = {We study distributed systems and their properties.},
  file     = {smith2023.pdf},
  doi      = {10.1234/jcs.2023.45.2.100}
}

@inproceedings{jones2022,
  author    = {Alice Jones},
  title     = {Fast Graph Algorithms},
  booktitle = {Proc. ACM STOC},
  year      = {2022},
  pages     = {500--512}
}`;

// ── Clean tab ─────────────────────────────────────────────────────────────────
function CleanTab() {
  const [input, setInput]       = useState(SAMPLE_BIB);
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
    <>
      {/* Options row */}
      <div className="bib-opts">
        <div className="field">
          <label htmlFor="bib-sort">Sort entries</label>
          <select id="bib-sort" aria-label="Sort entries" value={sort} onChange={e => setSort(e.target.value as typeof sort)}>
            <option value="key">By key</option>
            <option value="year">By year, newest first</option>
            <option value="type">By type</option>
            <option value="none">Don&rsquo;t sort</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="bib-strip">Fields to strip (comma separated)</label>
          <input
            id="bib-strip"
            className="mono"
            value={strip} onChange={e => setStrip(e.target.value)}
            aria-label="Fields to strip (comma separated)"
            placeholder="abstract, file, url"
          />
        </div>
        <label className="bib-check">
          <input type="checkbox" checked={dedup} onChange={e => setDedup(e.target.checked)} />
          Remove duplicates
        </label>
        <label className="bib-check">
          <input type="checkbox" checked={norAuth} onChange={e => setNorAuth(e.target.checked)} />
          Normalize authors
        </label>
      </div>

      <div className="bib-cols">
        {/* Input */}
        <div className="bib-pane">
          <div className="bib-panehead">
            <span>Paste your .bib file</span>
            <input ref={fileRef} type="file" accept=".bib,.txt" onChange={loadFile} style={{ display: "none" }} />
            <Btn small onClick={() => fileRef.current?.click()}>Upload .bib</Btn>
          </div>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            aria-label="BibTeX input"
            spellCheck={false}
            placeholder={"@article{smith2023,\n  author = {Smith, John},\n  title  = {My Paper},\n  year   = {2023},\n  journal= {Nature}\n}"}
            className="input mono bib-area"
          />
        </div>

        {/* Output */}
        <div className="bib-pane">
          <div className="bib-panehead">
            <span>
              {stats ? `${stats.total - stats.removed} entries` : "Cleaned output"}
            </span>
            {output && <CopyBtn text={output} />}
          </div>
          <textarea
            readOnly value={output}
            aria-label="Cleaned BibTeX output"
            placeholder="Cleaned BibTeX will appear here."
            className="codebox bib-area"
          />
        </div>
      </div>

      {/* Action + stats */}
      <div className="bib-actions">
        <Btn variant="primary" onClick={run} disabled={!input.trim()}>
          Clean BibTeX
        </Btn>
        {output && (
          <Btn onClick={() => {
            const blob = new Blob([output], { type: "text/plain" });
            const a = Object.assign(document.createElement("a"), {
              href: URL.createObjectURL(blob),
              download: "cleaned.bib",
            });
            a.click();
          }}>
            Download .bib
          </Btn>
        )}
        {stats && (
          <span className="bib-stats">
            {stats.total} parsed, {stats.removed} duplicate{stats.removed !== 1 ? "s" : ""} removed
            {stats.fieldsStripped > 0 ? `, ${stats.fieldsStripped} fields stripped` : ""}
          </span>
        )}
      </div>

      {warnings.length > 0 && (
        <div className="bib-msg" role="status">
          {warnings.map((w, i) => <div key={i}><b>Note.</b> {w}</div>)}
        </div>
      )}
    </>
  );
}

// ── DOI tab ───────────────────────────────────────────────────────────────────
function DoiTab() {
  const [doi,    setDoi]    = useState("");
  const [result, setResult] = useState("");
  const [error,  setError]  = useState("");
  const [loading, setLoading] = useState(false);

  const lookup = async () => {
    // Strip "doi:", https://doi.org/, http://dx.doi.org/ and similar wrappers.
    const d = normalizeDoi(doi);
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
    <LookupLayout
      intro={<>
        Paste a DOI and get a perfectly formatted BibTeX entry from{" "}
        <a href="https://www.crossref.org/" target="_blank" rel="noopener">CrossRef</a>.{" "}
        Works for journals, conference papers, books, and datasets.
      </>}
      fieldId="bib-doi"
      fieldLabel="DOI or doi.org link"
      input={
        <input
          id="bib-doi"
          aria-label="DOI"
          value={doi}
          onChange={e => setDoi(e.target.value)}
          onKeyDown={e => e.key === "Enter" && lookup()}
          placeholder="10.1038/s41586-021-03819-2  or  https://doi.org/10.xxxx/..."
          spellCheck={false}
          autoComplete="off"
        />
      }
      button={
        <Btn variant="primary" onClick={lookup} disabled={loading || !doi.trim()}>
          {loading ? "Looking up…" : "Get BibTeX"}
        </Btn>
      }
      examples={
        <p className="bib-examples">
          Examples:
          {["10.1038/s41586-021-03819-2", "10.1093/comjnl/27.2.97"].map(ex => (
            <button type="button" key={ex} className="bib-ex" onClick={() => setDoi(ex)}>{ex}</button>
          ))}
        </p>
      }
      error={error}
      result={result}
      resultLabel="BibTeX from CrossRef"
    />
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
    <LookupLayout
      intro={<>
        Enter an arXiv ID and get a ready-to-use BibTeX entry.
        Fetches metadata directly from{" "}
        <a href="https://arxiv.org/" target="_blank" rel="noopener">arXiv.org</a>.
      </>}
      fieldId="bib-arxiv"
      fieldLabel="arXiv ID or abstract URL"
      input={
        <input
          id="bib-arxiv"
          aria-label="arXiv ID or URL"
          value={id}
          onChange={e => setId(e.target.value)}
          onKeyDown={e => e.key === "Enter" && lookup()}
          placeholder="2301.07041  or  arxiv:2301.07041  or  https://arxiv.org/abs/2301.07041"
          spellCheck={false}
          autoComplete="off"
        />
      }
      button={
        <Btn variant="primary" onClick={lookup} disabled={loading || !id.trim()}>
          {loading ? "Looking up…" : "Get BibTeX"}
        </Btn>
      }
      examples={
        <p className="bib-examples">
          Examples:
          {["2301.07041", "1706.03762", "2005.14165"].map(ex => (
            <button type="button" key={ex} className="bib-ex" onClick={() => setId(ex)}>{ex}</button>
          ))}
        </p>
      }
      error={error}
      result={result}
      resultLabel="BibTeX from arXiv"
    />
  );
}

// ── PubMed tab ────────────────────────────────────────────────────────────────
function PmidTab() {
  const [id,      setId]      = useState("");
  const [result,  setResult]  = useState("");
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const lookup = async () => {
    const raw = id.trim();
    if (!raw) return;
    setLoading(true); setError(""); setResult("");
    try {
      const res = await fetch(`/api/pmid-to-bibtex?id=${encodeURIComponent(raw)}`);
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
    <LookupLayout
      intro={<>
        Enter a PubMed ID (PMID) and get a ready-to-use BibTeX entry.
        Fetches metadata directly from{" "}
        <a href="https://pubmed.ncbi.nlm.nih.gov/" target="_blank" rel="noopener">PubMed</a>.
        Perfect for biomedical and life-science papers.
      </>}
      fieldId="bib-pmid"
      fieldLabel="PubMed ID (PMID) or PubMed URL"
      input={
        <input
          id="bib-pmid"
          aria-label="PubMed ID (PMID)"
          value={id}
          onChange={e => setId(e.target.value)}
          onKeyDown={e => e.key === "Enter" && lookup()}
          placeholder="37652822  or  PMID:37652822  or  https://pubmed.ncbi.nlm.nih.gov/37652822/"
          spellCheck={false}
          autoComplete="off"
        />
      }
      button={
        <Btn variant="primary" onClick={lookup} disabled={loading || !id.trim()}>
          {loading ? "Looking up…" : "Get BibTeX"}
        </Btn>
      }
      examples={
        <p className="bib-examples">
          Examples:
          {["37652822", "34265844", "28498958"].map(ex => (
            <button type="button" key={ex} className="bib-ex" onClick={() => setId(ex)}>PMID {ex}</button>
          ))}
        </p>
      }
      error={error}
      result={result}
      resultLabel="BibTeX from PubMed"
    />
  );
}

// ── ISBN tab ──────────────────────────────────────────────────────────────────
function IsbnTab() {
  const [id,      setId]      = useState("");
  const [result,  setResult]  = useState("");
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const lookup = async () => {
    const raw = id.trim();
    if (!raw) return;
    setLoading(true); setError(""); setResult("");
    try {
      // Ask Open Library from the browser first: it refuses Vercel's servers
      // (403) but answers visitors. The server route is only a fallback.
      const { lookupIsbn } = await import("@/lib/isbn-lookup");
      const direct = await lookupIsbn(raw);
      if (direct.ok) { setResult(direct.bibtex); return; }
      if (direct.status === 400 || direct.status === 404) { setError(direct.error); return; }
      const res = await fetch(`/api/isbn-to-bibtex?isbn=${encodeURIComponent(raw)}`);
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
    <LookupLayout
      intro={<>
        Enter an ISBN-10 or ISBN-13 to generate a <code>@book</code> BibTeX entry.
        Fetches metadata from{" "}
        <a href="https://openlibrary.org/" target="_blank" rel="noopener">Open Library</a>{" "}
        (20M+ books). Useful for textbooks and monographs.
      </>}
      fieldId="bib-isbn"
      fieldLabel="ISBN-10 or ISBN-13"
      input={
        <input
          id="bib-isbn"
          aria-label="ISBN"
          value={id}
          onChange={e => setId(e.target.value)}
          onKeyDown={e => e.key === "Enter" && lookup()}
          placeholder="9780262033848  or  0262033844  (ISBN-10 or ISBN-13)"
          spellCheck={false}
          autoComplete="off"
        />
      }
      button={
        <Btn variant="primary" onClick={lookup} disabled={loading || !id.trim()}>
          {loading ? "Looking up…" : "Get BibTeX"}
        </Btn>
      }
      examples={
        <div className="bib-examples">
          Examples:
          <ul className="bib-ex-list">
            {[
              { isbn: "9780262033848", label: "CLRS Algorithms" },
              { isbn: "9780201633610", label: "Design Patterns" },
              { isbn: "9780262035613", label: "Goodfellow DL" },
            ].map(ex => (
              <li key={ex.isbn}>
                <button type="button" className="bib-ex" onClick={() => setId(ex.isbn)}>{ex.isbn}</button>
                <span>{ex.label}</span>
              </li>
            ))}
          </ul>
        </div>
      }
      error={error}
      result={result}
      resultLabel="BibTeX from ISBN"
    />
  );
}

// ── Main component ────────────────────────────────────────────────────────────
const TABS: { id: Tab; label: string }[] = [
  { id: "clean", label: "Clean and format" },
  { id: "doi",   label: "DOI" },
  { id: "arxiv", label: "arXiv" },
  { id: "pmid",  label: "PubMed" },
  { id: "isbn",  label: "ISBN" },
];

const CAPTIONS: Record<Tab, string> = {
  clean: "The cleaner. It runs in your browser: paste or upload a .bib file, set the options, press Clean BibTeX.",
  doi:   "DOI lookup. The entry is built from the record the publisher deposited at CrossRef.",
  arxiv: "arXiv lookup. The entry is built from the metadata of the arXiv API.",
  pmid:  "PubMed lookup. The entry is built from the NCBI record of the article.",
  isbn:  "ISBN lookup. The @book entry is built from the Open Library catalogue.",
};

export default function BibTexTool({
  initialTab = "clean",
  heading = "BibTeX Tools",
  tagline = "Clean and sort a .bib file, or build an entry from a DOI, an arXiv ID, a PubMed ID or an ISBN.",
}: {
  /** Which tab is active on load, so dedicated converter landing pages deep-link a mode. */
  initialTab?: Tab;
  /** Page H1: landing pages pass their own so each page keeps a unique heading. */
  heading?: string;
  tagline?: string;
}) {
  const [tab, setTab] = useState<Tab>(initialTab);

  return (
    <>
      <header className="tool-head">
        <h1>{heading}</h1>
        <p className="lede">{tagline}</p>
      </header>

      <div className="bib-wrap">
        <figure style={{ margin: 0 }}>
          <div className="tool-frame bib-frame">
            <div className="tabs" role="tablist" aria-label="BibTeX tools">
              {TABS.map(t => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  id={`bib-tab-${t.id}`}
                  aria-selected={tab === t.id}
                  aria-controls="bib-panel"
                  className="tab"
                  onClick={() => setTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="bib-body" role="tabpanel" id="bib-panel" aria-labelledby={`bib-tab-${tab}`}>
              {tab === "clean"  && <CleanTab />}
              {tab === "doi"    && <DoiTab />}
              {tab === "arxiv"  && <ArxivTab />}
              {tab === "pmid"   && <PmidTab />}
              {tab === "isbn"   && <IsbnTab />}
            </div>
          </div>
          <figcaption className="tool-caption"><b>Figure 1.</b> {CAPTIONS[tab]}</figcaption>
        </figure>

        <p className="note">
          <b>Tip.</b>{" "}
          Clean your .bib file here, then upload it directly to Overleaf via{" "}
          <em>New Project → Upload Project</em>, or paste it into your Overleaf bibliography file.
          The DOI, arXiv, and PubMed lookups give you correctly-formatted entries in one click.
        </p>
      </div>
    </>
  );
}
