"use client";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  generateCv, unsupportedChars, EXAMPLE_CV, EMPTY_ENTRY, EMPTY_PUB,
  type CvData, type CvEntry, type CvPublication,
} from "@/lib/cv";

const STORAGE_KEY = "latexci_cv";

const EMPTY_CV: CvData = {
  ...EXAMPLE_CV,
  name: "", headline: "", email: "", phone: "", location: "", website: "", linkedin: "", orcid: "",
  summary: "", education: [{ ...EMPTY_ENTRY }], experience: [{ ...EMPTY_ENTRY }], publications: [],
  skills: "", languages: "",
};

// ── Small form primitives ─────────────────────────────────────────────────────
function Field({ label, value, onChange, placeholder, multiline, rows = 3 }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; multiline?: boolean; rows?: number;
}) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {multiline ? (
        <textarea value={value} rows={rows} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      )}
    </label>
  );
}

// A form section set like a LaTeX \section: number, then title.
function Section({ title, children, n }: { title: string; children: ReactNode; n: number }) {
  return (
    <fieldset className="cvb-sec">
      <legend><span className="secnum">{n}</span>{title}</legend>
      <div className="cvb-sec-body">{children}</div>
    </fieldset>
  );
}

function EntryList({ items, onChange, kind }: { items: CvEntry[]; onChange: (v: CvEntry[]) => void; kind: "education" | "experience" }) {
  const set = (i: number, patch: Partial<CvEntry>) => onChange(items.map((e, j) => (j === i ? { ...e, ...patch } : e)));
  return (
    <>
      {items.map((e, i) => (
        <div key={i} className="cvb-item">
          <div className="cvb-item-head">
            <span className="cvb-item-title">{kind === "education" ? "Degree" : "Position"} {i + 1}</span>
            <button type="button" className="btn btn-sm" onClick={() => onChange(items.filter((_, j) => j !== i))}>Remove</button>
          </div>
          <div className="cvb-cols">
            <Field label={kind === "education" ? "Degree" : "Job title"} value={e.title} onChange={(v) => set(i, { title: v })} />
            <Field label="Dates" value={e.dates} onChange={(v) => set(i, { dates: v })} placeholder="2021--2024" />
            <Field label={kind === "education" ? "Institution" : "Organisation"} value={e.org} onChange={(v) => set(i, { org: v })} />
            <Field label="Location" value={e.location} onChange={(v) => set(i, { location: v })} />
          </div>
          <Field label="Details (one line per bullet)" value={e.details} onChange={(v) => set(i, { details: v })} multiline rows={2} />
        </div>
      ))}
      <div className="cvb-add"><button type="button" className="btn btn-sm" onClick={() => onChange([...items, { ...EMPTY_ENTRY }])}>Add {kind === "education" ? "a degree" : "a position"}</button></div>
    </>
  );
}

function PubList({ items, onChange }: { items: CvPublication[]; onChange: (v: CvPublication[]) => void }) {
  const set = (i: number, patch: Partial<CvPublication>) => onChange(items.map((p, j) => (j === i ? { ...p, ...patch } : p)));
  return (
    <>
      {items.map((p, i) => (
        <div key={i} className="cvb-item">
          <div className="cvb-item-head">
            <span className="cvb-item-title">Publication {i + 1}</span>
            <button type="button" className="btn btn-sm" onClick={() => onChange(items.filter((_, j) => j !== i))}>Remove</button>
          </div>
          <Field label="Title" value={p.title} onChange={(v) => set(i, { title: v })} />
          <div className="cvb-cols">
            <Field label="Authors" value={p.authors} onChange={(v) => set(i, { authors: v })} placeholder="Smith, J. & Doe, A." />
            <Field label="Journal or venue" value={p.venue} onChange={(v) => set(i, { venue: v })} />
            <Field label="Year" value={p.year} onChange={(v) => set(i, { year: v })} />
            <Field label="DOI" value={p.doi} onChange={(v) => set(i, { doi: v })} placeholder="10.1234/abcd" />
          </div>
        </div>
      ))}
      <div className="cvb-add"><button type="button" className="btn btn-sm" onClick={() => onChange([...items, { ...EMPTY_PUB }])}>Add a publication</button></div>
    </>
  );
}

// ── Builder ───────────────────────────────────────────────────────────────────
export default function CvBuilder() {
  const [data, setData] = useState<CvData>(EXAMPLE_CV);
  const [loaded, setLoaded] = useState(false);
  const [orcidStatus, setOrcidStatus] = useState<string>("");
  const [copyState, setCopyState] = useState<"idle" | "copied" | "err">("idle");

  // One-time restore of the saved draft. localStorage only exists after
  // hydration, so this deliberately sets state from an effect.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved) setData({ ...EXAMPLE_CV, ...JSON.parse(saved) });
    } catch { /* corrupt or blocked storage: keep the example */ }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* storage blocked */ }
  }, [data, loaded]);

  const texSource = useMemo(() => generateCv(data), [data]);
  const unsupported = useMemo(() => unsupportedChars(data), [data]);
  const set = (patch: Partial<CvData>) => setData((d) => ({ ...d, ...patch }));

  async function importOrcid() {
    if (!data.orcid.trim()) { setOrcidStatus("Enter your ORCID iD first."); return; }
    setOrcidStatus("Fetching your works from ORCID…");
    try {
      const res = await fetch(`/api/orcid-works?id=${encodeURIComponent(data.orcid)}`);
      const json = await res.json();
      if (!res.ok) { setOrcidStatus(json.error ?? "ORCID lookup failed."); return; }
      const works = json.works as { title: string; venue: string; year: string; doi: string }[];
      setData((d) => {
        const known = new Set(d.publications.map((p) => p.title.trim().toLowerCase()));
        const added = works
          .filter((w) => !known.has(w.title.trim().toLowerCase()))
          .map((w) => ({ authors: "", title: w.title, venue: w.venue, year: w.year, doi: w.doi }));
        setOrcidStatus(added.length
          ? `Imported ${added.length} publication${added.length > 1 ? "s" : ""}. ORCID does not list co-authors: add them below.`
          : "No new publications found on this ORCID record.");
        return { ...d, publications: [...d.publications.filter((p) => p.title.trim() || p.venue.trim() || p.doi.trim()), ...added] };
      });
    } catch {
      setOrcidStatus("Network error reaching ORCID.");
    }
  }

  function download() {
    const blob = new Blob([texSource], { type: "application/x-tex;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "cv.tex";
    a.click();
    // Revoking synchronously can cancel the download in Safari and Firefox.
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(texSource);
      setCopyState("copied");
    } catch {
      setCopyState("err");
    }
    setTimeout(() => setCopyState("idle"), 2000);
  }

  async function openInEditor() {
    const LZString = (await import("lz-string")).default;
    window.open(`/tools/preview#s=${LZString.compressToEncodedURIComponent(texSource)}`, "_blank", "noopener");
  }

  function openInOverleaf() {
    // Overleaf's documented "open a snippet" endpoint: a form POST with `snip`.
    const form = document.createElement("form");
    form.action = "https://www.overleaf.com/docs";
    form.method = "POST";
    form.target = "_blank";
    const field = document.createElement("input");
    field.type = "hidden"; field.name = "snip"; field.value = texSource;
    form.appendChild(field);
    document.body.appendChild(form);
    form.submit();
    form.remove();
  }

  return (
    <div className="cvb-grid">
      {/* ── Form ─────────────────────────────────────────── */}
      <form onSubmit={(e) => e.preventDefault()} aria-label="CV details" className="cvb-form">
        <Section n={1} title="Layout">
          <div className="cvb-choices">
            <div className="cvb-choice">
              <span className="field-label">Layout</span>
              <span role="radiogroup" aria-label="Layout" className="cvb-options">
                {(["academic", "industry"] as const).map((l) => (
                  <label key={l}>
                    <input type="radio" name="layout" checked={data.layout === l} onChange={() => set({ layout: l })} />
                    {l === "academic" ? "Academic" : "Industry"}
                  </label>
                ))}
              </span>
            </div>
            <div className="cvb-choice">
              <span className="field-label">Language</span>
              <span role="radiogroup" aria-label="Language" className="cvb-options">
                {(["en", "fr"] as const).map((l) => (
                  <label key={l}>
                    <input type="radio" name="lang" checked={data.lang === l} onChange={() => set({ lang: l })} />
                    {l === "en" ? "English" : "Français"}
                  </label>
                ))}
              </span>
            </div>
            {data.layout === "industry" && (
              <div className="cvb-choice">
                <span className="field-label">Photo</span>
                <span className="cvb-options">
                  <label>
                    <input type="checkbox" checked={data.photo} onChange={(e) => set({ photo: e.target.checked })} />
                    Photo slot
                  </label>
                </span>
              </div>
            )}
          </div>
        </Section>

        <Section n={2} title="Identity">
          <div className="cvb-cols">
            <Field label="Full name" value={data.name} onChange={(v) => set({ name: v })} />
            <Field label="Headline" value={data.headline} onChange={(v) => set({ headline: v })} placeholder="PhD candidate, Economics" />
            <Field label="Email" value={data.email} onChange={(v) => set({ email: v })} />
            <Field label="Phone" value={data.phone} onChange={(v) => set({ phone: v })} />
            <Field label="Location" value={data.location} onChange={(v) => set({ location: v })} />
            <Field label="Website" value={data.website} onChange={(v) => set({ website: v })} />
            <Field label="LinkedIn" value={data.linkedin} onChange={(v) => set({ linkedin: v })} placeholder="linkedin.com/in/…" />
            <Field label="ORCID iD" value={data.orcid} onChange={(v) => set({ orcid: v })} placeholder="0000-0002-1825-0097" />
          </div>
          <Field label={data.layout === "academic" ? "Research interests or profile" : "Profile"} value={data.summary} onChange={(v) => set({ summary: v })} multiline />
        </Section>

        <Section n={3} title="Education">
          <EntryList kind="education" items={data.education} onChange={(v) => set({ education: v })} />
        </Section>

        <Section n={4} title="Experience">
          <EntryList kind="experience" items={data.experience} onChange={(v) => set({ experience: v })} />
        </Section>

        <Section n={5} title="Publications">
          <div className="cvb-orcid">
            <button type="button" className="btn btn-sm" onClick={importOrcid}>Import from ORCID</button>
            <span aria-live="polite" className="cvb-hint">
              {orcidStatus || "Uses the ORCID iD from section 2. Only that iD is sent to ORCID."}
            </span>
          </div>
          <PubList items={data.publications} onChange={(v) => set({ publications: v })} />
        </Section>

        <Section n={6} title="Skills and languages">
          <Field label='Skills, one group per line ("Group: item, item")' value={data.skills} onChange={(v) => set({ skills: v })} multiline />
          <Field label="Languages" value={data.languages} onChange={(v) => set({ languages: v })} placeholder="English (native), French (B2)" />
        </Section>

        <div className="cvb-reset">
          <button type="button" className="btn btn-sm" onClick={() => setData(EXAMPLE_CV)}>Load the example</button>
          <button type="button" className="btn btn-sm" onClick={() => setData(EMPTY_CV)}>Start from blank</button>
        </div>
      </form>

      {/* ── Output ───────────────────────────────────────── */}
      <div className="cvb-out">
        <div className="cvb-actions">
          <button type="button" className="btn btn-sm btn-primary" onClick={openInOverleaf}>Open in Overleaf</button>
          <button type="button" className="btn btn-sm" onClick={openInEditor}>Open in latexci editor</button>
          <button type="button" className="btn btn-sm" onClick={download}>Download cv.tex</button>
          <button type="button" className="btn btn-sm" onClick={copy} title="Copy LaTeX">
            <span aria-live="polite">{copyState === "copied" ? "Copied" : copyState === "err" ? "Failed" : "Copy LaTeX"}</span>
          </button>
        </div>
        {unsupported.length > 0 && (
          <p role="alert" className="note cvb-note">
            <b>Note.</b> pdfLaTeX cannot typeset {unsupported.map((ch) => `“${ch}”`).join(" ")}; they appear as “?” in the source.
            Use Latin characters, or edit the source in Overleaf and switch the compiler to XeLaTeX.
          </p>
        )}
        <figure className="cvb-fig">
          <pre aria-label="Generated LaTeX source" className="codebox cvb-code"><code>{texSource}</code></pre>
          <figcaption className="tool-caption">
            <b>Figure 1.</b> The generated source, cv.tex, rewritten as you type. Your draft is saved in this
            browser only. Overleaf compiles the PDF for free; the latexci editor shows a live preview.
          </figcaption>
        </figure>
      </div>
    </div>
  );
}
