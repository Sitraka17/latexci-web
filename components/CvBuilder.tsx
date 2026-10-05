"use client";
import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import CopyButton from "@/components/CopyButton";
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
const input: CSSProperties = {
  width: "100%", boxSizing: "border-box", background: "var(--surface)", color: "var(--fg)",
  border: "1px solid var(--border)", borderRadius: 6, padding: "0.45rem 0.6rem", fontSize: "0.86rem",
  fontFamily: "inherit",
};
const labelStyle: CSSProperties = { display: "block", fontSize: "0.75rem", color: "var(--fg-muted)", marginBottom: "0.25rem" };
const btn: CSSProperties = {
  background: "var(--surface2)", color: "var(--fg)", border: "1px solid var(--border)", borderRadius: 6,
  padding: "0.4rem 0.8rem", fontSize: "0.82rem", cursor: "pointer", fontFamily: "inherit",
};
const btnPrimary: CSSProperties = { ...btn, background: "var(--accent)", color: "#fff", border: "1px solid transparent", fontWeight: 600 };

function Field({ label, value, onChange, placeholder, multiline, rows = 3 }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; multiline?: boolean; rows?: number;
}) {
  return (
    <label style={{ display: "block" }}>
      <span style={labelStyle}>{label}</span>
      {multiline ? (
        <textarea value={value} rows={rows} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} style={{ ...input, resize: "vertical", lineHeight: 1.5 }} />
      ) : (
        <input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} style={input} />
      )}
    </label>
  );
}

function Section({ title, children, n }: { title: string; children: ReactNode; n: number }) {
  return (
    <fieldset style={{ border: "none", borderTop: "1px solid var(--border)", padding: "1rem 0 0.5rem", margin: 0 }}>
      <legend style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--fg)", padding: "0 0.5rem 0 0" }}>
        <span style={{ color: "var(--fg-muted)", fontWeight: 400, marginRight: "0.4rem" }}>{n}.</span>{title}
      </legend>
      <div style={{ display: "grid", gap: "0.7rem" }}>{children}</div>
    </fieldset>
  );
}

const grid2: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "0.7rem" };

function EntryList({ items, onChange, kind }: { items: CvEntry[]; onChange: (v: CvEntry[]) => void; kind: "education" | "experience" }) {
  const set = (i: number, patch: Partial<CvEntry>) => onChange(items.map((e, j) => (j === i ? { ...e, ...patch } : e)));
  return (
    <>
      {items.map((e, i) => (
        <div key={i} style={{ border: "1px solid var(--border)", borderRadius: 8, padding: "0.75rem", display: "grid", gap: "0.6rem" }}>
          <div style={grid2}>
            <Field label={kind === "education" ? "Degree" : "Job title"} value={e.title} onChange={(v) => set(i, { title: v })} />
            <Field label="Dates" value={e.dates} onChange={(v) => set(i, { dates: v })} placeholder="2021--2024" />
            <Field label={kind === "education" ? "Institution" : "Organisation"} value={e.org} onChange={(v) => set(i, { org: v })} />
            <Field label="Location" value={e.location} onChange={(v) => set(i, { location: v })} />
          </div>
          <Field label="Details (one line per bullet)" value={e.details} onChange={(v) => set(i, { details: v })} multiline rows={2} />
          <div><button type="button" style={btn} onClick={() => onChange(items.filter((_, j) => j !== i))}>Remove</button></div>
        </div>
      ))}
      <div><button type="button" style={btn} onClick={() => onChange([...items, { ...EMPTY_ENTRY }])}>+ Add {kind === "education" ? "a degree" : "a position"}</button></div>
    </>
  );
}

function PubList({ items, onChange }: { items: CvPublication[]; onChange: (v: CvPublication[]) => void }) {
  const set = (i: number, patch: Partial<CvPublication>) => onChange(items.map((p, j) => (j === i ? { ...p, ...patch } : p)));
  return (
    <>
      {items.map((p, i) => (
        <div key={i} style={{ border: "1px solid var(--border)", borderRadius: 8, padding: "0.75rem", display: "grid", gap: "0.6rem" }}>
          <Field label="Title" value={p.title} onChange={(v) => set(i, { title: v })} />
          <div style={grid2}>
            <Field label="Authors" value={p.authors} onChange={(v) => set(i, { authors: v })} placeholder="Smith, J. & Doe, A." />
            <Field label="Journal or venue" value={p.venue} onChange={(v) => set(i, { venue: v })} />
            <Field label="Year" value={p.year} onChange={(v) => set(i, { year: v })} />
            <Field label="DOI" value={p.doi} onChange={(v) => set(i, { doi: v })} placeholder="10.1234/abcd" />
          </div>
          <div><button type="button" style={btn} onClick={() => onChange(items.filter((_, j) => j !== i))}>Remove</button></div>
        </div>
      ))}
      <div><button type="button" style={btn} onClick={() => onChange([...items, { ...EMPTY_PUB }])}>+ Add a publication</button></div>
    </>
  );
}

// ── Builder ───────────────────────────────────────────────────────────────────
export default function CvBuilder() {
  const [data, setData] = useState<CvData>(EXAMPLE_CV);
  const [loaded, setLoaded] = useState(false);
  const [orcidStatus, setOrcidStatus] = useState<string>("");

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
      <form onSubmit={(e) => e.preventDefault()} aria-label="CV details" style={{ display: "grid", gap: "0.6rem", minWidth: 0 }}>
        <Section n={1} title="Layout">
          <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap", fontSize: "0.86rem", color: "var(--fg)" }}>
            <span role="radiogroup" aria-label="Layout" style={{ display: "flex", gap: "0.9rem" }}>
              {(["academic", "industry"] as const).map((l) => (
                <label key={l} style={{ display: "flex", gap: "0.35rem", alignItems: "center", cursor: "pointer" }}>
                  <input type="radio" name="layout" checked={data.layout === l} onChange={() => set({ layout: l })} />
                  {l === "academic" ? "Academic" : "Industry"}
                </label>
              ))}
            </span>
            <span role="radiogroup" aria-label="Language" style={{ display: "flex", gap: "0.9rem" }}>
              {(["en", "fr"] as const).map((l) => (
                <label key={l} style={{ display: "flex", gap: "0.35rem", alignItems: "center", cursor: "pointer" }}>
                  <input type="radio" name="lang" checked={data.lang === l} onChange={() => set({ lang: l })} />
                  {l === "en" ? "English" : "Français"}
                </label>
              ))}
            </span>
            {data.layout === "industry" && (
              <label style={{ display: "flex", gap: "0.35rem", alignItems: "center", cursor: "pointer" }}>
                <input type="checkbox" checked={data.photo} onChange={(e) => set({ photo: e.target.checked })} />
                Photo slot
              </label>
            )}
          </div>
        </Section>

        <Section n={2} title="Identity">
          <div style={grid2}>
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
          <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", flexWrap: "wrap" }}>
            <button type="button" style={btn} onClick={importOrcid}>Import from ORCID</button>
            <span aria-live="polite" style={{ fontSize: "0.8rem", color: "var(--fg-muted)" }}>
              {orcidStatus || "Uses the ORCID iD from section 2. Only that iD is sent to ORCID."}
            </span>
          </div>
          <PubList items={data.publications} onChange={(v) => set({ publications: v })} />
        </Section>

        <Section n={6} title="Skills and languages">
          <Field label='Skills, one group per line ("Group: item, item")' value={data.skills} onChange={(v) => set({ skills: v })} multiline />
          <Field label="Languages" value={data.languages} onChange={(v) => set({ languages: v })} placeholder="English (native), French (B2)" />
        </Section>

        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", paddingTop: "0.5rem" }}>
          <button type="button" style={btn} onClick={() => setData(EXAMPLE_CV)}>Load the example</button>
          <button type="button" style={btn} onClick={() => setData(EMPTY_CV)}>Start from blank</button>
        </div>
      </form>

      {/* ── Output ───────────────────────────────────────── */}
      <div className="cvb-out">
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center", marginBottom: "0.6rem" }}>
          <button type="button" style={btnPrimary} onClick={openInOverleaf}>Open in Overleaf</button>
          <button type="button" style={btn} onClick={openInEditor}>Open in latexci editor</button>
          <button type="button" style={btn} onClick={download}>Download cv.tex</button>
          <CopyButton text={texSource} label="Copy LaTeX" />
        </div>
        <p style={{ fontSize: "0.78rem", color: "var(--fg-muted)", margin: "0 0 0.6rem", lineHeight: 1.6 }}>
          Your draft is saved in this browser only. Overleaf compiles the PDF for free; the latexci editor shows a live preview.
        </p>
        {unsupported.length > 0 && (
          <p role="alert" style={{ fontSize: "0.8rem", lineHeight: 1.6, margin: "0 0 0.6rem", padding: "0.6rem 0.8rem", borderLeft: "3px solid #d97706", background: "var(--surface)", color: "var(--fg)" }}>
            pdfLaTeX cannot typeset {unsupported.map((ch) => `“${ch}”`).join(" ")}; they appear as “?” in the source.
            Use Latin characters, or edit the source in Overleaf and switch the compiler to XeLaTeX.
          </p>
        )}
        <pre aria-label="Generated LaTeX source" style={{
          margin: 0, padding: "0.9rem 1rem", background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: 8, overflow: "auto", fontSize: "0.74rem", lineHeight: 1.55, maxHeight: "75vh",
        }}>
          <code style={{ fontFamily: "var(--font-mono), monospace", color: "var(--fg)", whiteSpace: "pre" }}>{texSource}</code>
        </pre>
      </div>
    </div>
  );
}
