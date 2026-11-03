"use client";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { STYLES, styleById, type StyleId } from "@/lib/csl-styles";
import { toHtmlDocument, toPlainText, toRichHtml, type FormatResult } from "@/lib/bib-output";
import type { BibFormatter } from "@/lib/bib-format";
import "@/app/tools/bibtex/bibtex.css";

// The formatter, citeproc-js (about 190 kB gzipped, served unminified from
// public/vendor/, see lib/citeproc-load.ts) and the CSL files are loaded on
// demand on this page only, so the other pages never download them.
async function fetchText(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`could not load ${url} (HTTP ${res.status})`);
  return res.text();
}

let formatterPromise: Promise<BibFormatter> | null = null;
function getFormatter(): Promise<BibFormatter> {
  formatterPromise ??= Promise.all([import("@/lib/bib-format"), import("@/lib/citeproc-load")]).then(
    ([{ BibFormatter }, { evalCiteproc, CITEPROC_FILE }]) => {
      let csl: Promise<ReturnType<typeof evalCiteproc>> | null = null;
      return new BibFormatter({
        citeproc: () => (csl ??= fetchText(`/vendor/citeproc/${CITEPROC_FILE}`).then(evalCiteproc)),
        file: (name) => fetchText(`/csl/${name}`),
      });
    },
  );
  formatterPromise.catch(() => { formatterPromise = null; });
  return formatterPromise;
}

/** Copy HTML and plain text together; Word and Google Docs take the HTML. */
async function copyRich(html: string, text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && typeof ClipboardItem !== "undefined") {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([text], { type: "text/plain" }),
        }),
      ]);
      return true;
    }
  } catch { /* fall through to the copy event */ }
  const onCopy = (e: ClipboardEvent) => {
    e.clipboardData?.setData("text/html", html);
    e.clipboardData?.setData("text/plain", text);
    e.preventDefault();
  };
  document.addEventListener("copy", onCopy);
  try { return document.execCommand("copy"); } finally { document.removeEventListener("copy", onCopy); }
}

async function copyPlain(text: string): Promise<boolean> {
  try { await navigator.clipboard.writeText(text); return true; } catch { return copyRich("", text); }
}

function download(name: string, type: string, body: string) {
  const url = URL.createObjectURL(new Blob([body], { type }));
  const a = Object.assign(document.createElement("a"), { href: url, download: name });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function BibFormatTool({
  defaultStyle,
  sample,
  initial,
  heading,
  tagline,
}: {
  defaultStyle: StyleId;
  /** .bib text shown on load. */
  sample: string;
  /** Formatted `sample` in `defaultStyle`, computed at build time. */
  initial: FormatResult;
  heading: string;
  tagline: string;
}) {
  const uid = useId();
  const [input, setInput] = useState(sample);
  const [styleId, setStyleId] = useState<StyleId>(defaultStyle);
  const [sentence, setSentence] = useState<boolean | null>(null);
  const [result, setResult] = useState<FormatResult>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const firstRun = useRef(true);
  const runId = useRef(0);

  const style = styleById(styleId);
  const sentenceCase = sentence ?? style.sentenceCase;

  const run = useCallback(async (src: string, id: StyleId, sc: boolean) => {
    const mine = ++runId.current;
    setBusy(true);
    try {
      const f = await getFormatter();
      const r = await f.format(src, id, { sentenceCase: sc });
      if (mine !== runId.current) return;
      setResult(r);
      setError("");
    } catch (e) {
      if (mine !== runId.current) return;
      setError(e instanceof Error ? e.message : "the formatter could not run");
    } finally {
      if (mine === runId.current) setBusy(false);
    }
  }, []);

  // Reformat after an edit (debounced) or a change of style.
  useEffect(() => {
    if (firstRun.current) { firstRun.current = false; return; }
    const t = setTimeout(() => { void run(input, styleId, sentenceCase); }, 250);
    return () => clearTimeout(t);
  }, [input, styleId, sentenceCase, run]);

  // Load the formatter once the page is idle, so the first change is quick.
  useEffect(() => {
    const t = setTimeout(() => { getFormatter().then((f) => f.prepare(defaultStyle)).catch(() => {}); }, 1200);
    return () => clearTimeout(t);
  }, [defaultStyle]);

  const flash = (msg: string) => {
    setStatus(msg);
    setTimeout(() => setStatus((s) => (s === msg ? "" : s)), 4000);
  };

  const n = result.entries.length;
  const shown = result.style === styleId ? result : null;
  const fileBase = `references-${style.short.toLowerCase().replace(/\s+/g, "-")}`;
  const plural = (k: number, one: string, many = `${one}s`) => `${k} ${k === 1 ? one : many}`;

  const loadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    f.text().then(setInput);
    e.target.value = "";
  };

  const citationsShown = result.citations.slice(0, 8);
  // One column per citation form (parenthetical, with a page, narrative...).
  const formLabels = [...new Set(citationsShown.flatMap((c) => c.forms.map((f) => f.label)))];

  return (
    <>
      <header className="tool-head">
        <h1>{heading}</h1>
        <p className="lede">{tagline}</p>
      </header>

      <div className="bib-wrap">
        <figure style={{ margin: 0 }}>
          <div className="tool-frame bib-frame">
            <div className="bib-body">
              <div className="fmt-opts">
                <div className="field">
                  <label htmlFor={`${uid}-style`}>Citation style</label>
                  <select id={`${uid}-style`} value={styleId} onChange={(e) => { setStyleId(e.target.value as StyleId); setSentence(null); }}>
                    {STYLES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </div>
                <label className="bib-check">
                  <input type="checkbox" checked={sentenceCase} onChange={(e) => setSentence(e.target.checked)} />
                  Sentence case for titles{style.sentenceCase ? " (APA)" : ""}
                </label>
              </div>

              <div className="bib-cols">
                <div className="bib-pane">
                  <div className="bib-panehead">
                    <label htmlFor={`${uid}-bib`}>Your .bib file</label>
                    <input ref={fileRef} type="file" accept=".bib,.txt,text/plain" onChange={loadFile} hidden />
                    <span className="fmt-headbtns">
                      <button type="button" className="btn btn-sm" onClick={() => setInput("")}>Clear</button>
                      <button type="button" className="btn btn-sm" onClick={() => fileRef.current?.click()}>Upload .bib</button>
                    </span>
                  </div>
                  <textarea
                    id={`${uid}-bib`}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    spellCheck={false}
                    placeholder={"@article{key,\n  author  = {Last, First},\n  title   = {Title},\n  journal = {Journal},\n  year    = {2024}\n}"}
                    className="input mono bib-area"
                  />
                </div>

                <div className="bib-pane">
                  <div className="bib-panehead">
                    <span id={`${uid}-out`}>
                      {style.listName}, {style.label}
                    </span>
                    <span className="fmt-count" aria-hidden="true">{busy ? "Formatting…" : plural(n, "entry", "entries")}</span>
                  </div>
                  <div
                    className={`fmt-out${result.layout.hangingIndent ? " is-hanging" : ""}${busy ? " is-busy" : ""}`}
                    role="region"
                    aria-labelledby={`${uid}-out`}
                    aria-live="polite"
                    aria-busy={busy}
                    tabIndex={0}
                  >
                    {shown && n > 0 ? (
                      <ol className={result.entries.some((e) => e.label) ? "fmt-list is-numbered" : "fmt-list"}>
                        {result.entries.map((e) => (
                          <li key={e.id}>
                            {e.label && <span className="fmt-label">{e.label}</span>}
                            <span dangerouslySetInnerHTML={{ __html: e.html }} />
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <p className="fmt-empty">
                        {busy ? `Loading the ${style.short} style…` : "Paste BibTeX entries on the left to see them formatted here."}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="bib-actions">
                <button
                  type="button" className="btn btn-primary" disabled={!shown || n === 0 || busy}
                  onClick={async () => {
                    const ok = await copyRich(toRichHtml(result), toPlainText(result));
                    flash(ok ? `Copied ${plural(n, "reference")} with italics and indent. Paste into Word or Google Docs.` : "Copy failed: select the list and copy it by hand.");
                  }}
                >
                  Copy for Word / Docs
                </button>
                <button
                  type="button" className="btn" disabled={!shown || n === 0 || busy}
                  onClick={async () => {
                    const ok = await copyPlain(toPlainText(result));
                    flash(ok ? `Copied ${plural(n, "reference")} as plain text.` : "Copy failed.");
                  }}
                >
                  Copy plain text
                </button>
                <button type="button" className="btn" disabled={!shown || n === 0 || busy}
                  onClick={() => download(`${fileBase}.txt`, "text/plain;charset=utf-8", toPlainText(result))}>
                  Download .txt
                </button>
                <button type="button" className="btn" disabled={!shown || n === 0 || busy}
                  onClick={() => download(`${fileBase}.html`, "text/html;charset=utf-8", toHtmlDocument(result))}>
                  Download .html
                </button>
                <span className="bib-stats" role="status">{status}</span>
              </div>

              {error && <p className="bib-msg is-error" role="alert"><b>Error.</b> {error}</p>}

              {result.warnings.length > 0 && (
                <div className="bib-msg fmt-warn">
                  <b>Check {plural(new Set(result.warnings.map((w) => w.key)).size, "entry", "entries")}.</b>
                  <ul>
                    {result.warnings.map((w, i) => (
                      <li key={i}><code>{w.key}</code>: {w.message}</li>
                    ))}
                  </ul>
                </div>
              )}

              {citationsShown.length > 0 && (
                <div className="fmt-cites">
                  <table className="booktabs">
                    <caption>
                      In-text citations, {style.label}{style.note ? " (footnotes)" : ""}
                      {result.citations.length > citationsShown.length ? `, first ${citationsShown.length} entries` : ""}
                    </caption>
                    <thead>
                      <tr>
                        <th scope="col">Key</th>
                        {formLabels.map((l) => <th scope="col" key={l}>{l}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {citationsShown.map((c) => (
                        <tr key={c.id}>
                          <th scope="row"><code>{c.id}</code></th>
                          {formLabels.map((l) => {
                            const f = c.forms.find((x) => x.label === l);
                            return f
                              ? <td key={l} dangerouslySetInnerHTML={{ __html: f.html }} />
                              : <td key={l} className="muted" aria-label="none">&ndash;</td>;
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
          <figcaption className="tool-caption">
            <b>Figure 1.</b> The formatter. It runs in your browser: the list is {style.order}, as {style.short} requires.
          </figcaption>
        </figure>
      </div>
    </>
  );
}
