"use client";
import { useCallback, useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import { clearAllDocs, createDoc, deleteDoc, listDocs, updateDoc, type LocalDoc } from "@/lib/local-docs";

type Me = { configured: boolean; user: { email: string; name: string | null } | null; admin?: boolean };
type UserRow = { sub: string; email: string; name: string | null; firstSeen: string; lastSeen: string; counts: Record<string, number> };

const cell: CSSProperties = { padding: "0.6rem 0.75rem", borderBottom: "1px solid var(--border)", fontSize: "0.86rem", verticalAlign: "middle" };
const head: CSSProperties = { ...cell, fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--fg-muted)", textAlign: "left" };
const linkBtn: CSSProperties = { background: "none", border: "none", padding: 0, color: "var(--accent)", cursor: "pointer", fontSize: "0.82rem", fontWeight: 600 };
const btn: CSSProperties = { padding: "0.5rem 1rem", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--fg)", fontWeight: 600, fontSize: "0.84rem", cursor: "pointer", textDecoration: "none", display: "inline-block" };

function fmt(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

function download(doc: LocalDoc) {
  const url = URL.createObjectURL(new Blob([doc.content], { type: "application/x-tex" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: `${doc.title.replace(/[^\w.-]+/g, "-") || "document"}.tex` });
  a.click();
  URL.revokeObjectURL(url);
}

export default function DashboardClient() {
  const [docs, setDocs] = useState<LocalDoc[] | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const refresh = useCallback(() => setDocs(listDocs()), []);

  useEffect(() => {
    // localStorage only exists after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
    fetch("/api/auth/me").then((r) => r.json()).then(setMe).catch(() => setMe(null));
  }, [refresh]);

  const importTex = (file: File) => {
    file.text().then((text) => {
      if (createDoc(text)) refresh();
      else setNotice("Could not save: this browser's storage is full or blocked.");
    });
  };

  const signOut = async () => {
    await fetch("/api/auth/signout", { method: "POST" });
    window.location.href = "/";
  };

  const deleteEverything = async () => {
    if (!window.confirm("Delete every document saved in this browser and sign out? This cannot be undone.")) return;
    if (me?.user) await fetch("/api/account/delete", { method: "POST" });
    clearAllDocs();
    window.location.href = "/";
  };

  return (
    <>
      <section aria-labelledby="docs-h" style={{ marginBottom: "2.5rem" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
          <h2 id="docs-h" style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>My documents</h2>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <label style={btn}>
              Import .tex
              <input type="file" accept=".tex,text/x-tex,text/plain" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) importTex(f); e.target.value = ""; }} />
            </label>
            <Link href="/tools/preview" style={{ ...btn, background: "var(--accent)", color: "#fff", borderColor: "var(--accent)" }}>New document</Link>
          </div>
        </div>
        <p style={{ fontSize: "0.82rem", color: "var(--fg-muted)", margin: "0 0 1rem", lineHeight: 1.6 }}>
          Documents are stored in this browser only. Download the .tex to keep a copy or move it to another device;
          use Share in the editor to send a link.
        </p>

        {notice && <p role="alert" style={{ fontSize: "0.84rem", color: "#ef4444" }}>{notice}</p>}

        {docs === null ? null : docs.length === 0 ? (
          <p style={{ fontSize: "0.88rem", padding: "1.25rem", border: "1px solid var(--border)", margin: 0 }}>
            No saved documents yet. Open the <Link href="/tools/preview" style={{ color: "var(--accent)" }}>editor</Link>,
            write or paste LaTeX, then press Save.
          </p>
        ) : (
          <div style={{ overflowX: "auto", border: "1px solid var(--border)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 520 }}>
              <thead>
                <tr>
                  <th style={head}>Title</th>
                  <th style={head}>Last edited</th>
                  <th style={{ ...head, textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {docs.map((d) => (
                  <tr key={d.id}>
                    <td style={cell}>
                      {d.pinned && <span title="Pinned" style={{ color: "var(--fg-muted)", marginRight: "0.35rem" }}>&#x2605;</span>}
                      <Link href={`/tools/preview?doc=${d.id}`} style={{ color: "var(--fg)", fontWeight: 600, textDecoration: "none" }}>{d.title}</Link>
                    </td>
                    <td style={{ ...cell, color: "var(--fg-muted)", whiteSpace: "nowrap" }}>{fmt(d.updatedAt)}</td>
                    <td style={{ ...cell, textAlign: "right", whiteSpace: "nowrap" }}>
                      <span style={{ display: "inline-flex", gap: "0.9rem" }}>
                        <button style={linkBtn} onClick={() => { updateDoc(d.id, { pinned: !d.pinned }); refresh(); }}>{d.pinned ? "Unpin" : "Pin"}</button>
                        <button style={linkBtn} onClick={() => download(d)}>.tex</button>
                        {confirmId === d.id ? (
                          <button style={{ ...linkBtn, color: "#ef4444" }} onClick={() => { deleteDoc(d.id); setConfirmId(null); refresh(); }}>Confirm delete</button>
                        ) : (
                          <button style={{ ...linkBtn, color: "var(--fg-muted)" }} onClick={() => setConfirmId(d.id)}>Delete</button>
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section aria-labelledby="acct-h" style={{ borderTop: "1px solid var(--border)", paddingTop: "1.5rem" }}>
        <h2 id="acct-h" style={{ fontSize: "1.1rem", fontWeight: 700, margin: "0 0 0.75rem" }}>Account</h2>
        {me?.user ? (
          <>
            <p style={{ fontSize: "0.88rem", margin: "0 0 1rem" }}>
              Signed in with Google as <strong>{me.user.email}</strong>. PDF export and Word to LaTeX are unlocked.
            </p>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <button style={btn} onClick={signOut}>Sign out</button>
              <button style={{ ...btn, color: "#ef4444" }} onClick={deleteEverything}>Delete my data</button>
            </div>
          </>
        ) : (
          <>
            <p style={{ fontSize: "0.88rem", margin: "0 0 1rem" }}>
              {me && !me.configured
                ? "Sign-in is being set up. Your documents above work without an account."
                : "You are not signed in. Sign in with Google (free) to use PDF export and Word to LaTeX."}
            </p>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {me?.configured && <Link href="/auth?next=/dashboard" style={btn}>Sign in</Link>}
              <button style={{ ...btn, color: "#ef4444" }} onClick={deleteEverything}>Delete documents in this browser</button>
            </div>
          </>
        )}
      </section>

      {me?.admin && <AdminUsers />}
    </>
  );
}

/** Who signed in (ADMIN_EMAILS only). */
function AdminUsers() {
  const [users, setUsers] = useState<UserRow[] | null>(null);
  useEffect(() => {
    fetch("/api/admin/users").then((r) => r.json()).then((d) => setUsers(d.users ?? [])).catch(() => setUsers([]));
  }, []);
  const total = (k: string) => (users ?? []).reduce((n, u) => n + (u.counts[k] ?? 0), 0);
  return (
    <section aria-labelledby="users-h" style={{ borderTop: "1px solid var(--border)", paddingTop: "1.5rem", marginTop: "2.5rem" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
        <h2 id="users-h" style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>Users (admin)</h2>
        <a href="/api/admin/users?format=csv" style={btn}>Download CSV</a>
      </div>
      {users === null ? (
        <p style={{ fontSize: "0.86rem", color: "var(--fg-muted)" }}>Loading…</p>
      ) : (
        <>
          <p style={{ fontSize: "0.84rem", color: "var(--fg-muted)", margin: "0 0 1rem" }}>
            {users.length} account{users.length === 1 ? "" : "s"} · {total("signin")} sign-ins · {total("pdf")} PDF exports · {total("word")} Word conversions
          </p>
          <div style={{ overflowX: "auto", border: "1px solid var(--border)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
              <thead>
                <tr>
                  {["Email", "Name", "First seen", "Last seen", "Sign-ins", "PDF", "Word"].map((h) => <th key={h} style={head}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.sub}>
                    <td style={cell}>{u.email}</td>
                    <td style={cell}>{u.name ?? ""}</td>
                    <td style={{ ...cell, whiteSpace: "nowrap" }}>{fmt(u.firstSeen)}</td>
                    <td style={{ ...cell, whiteSpace: "nowrap" }}>{fmt(u.lastSeen)}</td>
                    <td style={cell}>{u.counts.signin ?? 0}</td>
                    <td style={cell}>{u.counts.pdf ?? 0}</td>
                    <td style={cell}>{u.counts.word ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
