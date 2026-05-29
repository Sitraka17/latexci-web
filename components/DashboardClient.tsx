"use client";
import { useState, useMemo, useTransition, lazy, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const ShareModal = lazy(() => import("./ShareModal"));

type DocRow = {
  id: string;
  title: string;
  updated_at: string;
  is_pinned: boolean;
  tags: string[];
  is_public: boolean;
};

export type SharedDoc = {
  document_id: string;
  permission: "view" | "edit";
  documents: {
    id: string;
    title: string;
    share_token: string;
    updated_at: string;
    profiles: { display_name: string | null; email: string } | null;
  } | null;
};

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ── Simple toast component ───────────────────────────────────────────────────
function Toast({ message, type }: { message: string; type: "error" | "success" }) {
  return (
    <div style={{
      position: "fixed", bottom: "1.5rem", right: "1.5rem", zIndex: 9999,
      padding: "0.75rem 1.1rem",
      background: type === "error" ? "#ef4444" : "#10b981",
      color: "#fff", borderRadius: 10, fontSize: "0.84rem", fontWeight: 600,
      boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
      animation: "fadeIn 0.2s ease",
    }}>
      {type === "error" ? "⚠ " : "✓ "}{message}
    </div>
  );
}

export default function DashboardClient({
  userId,
  initialDocuments,
  sharedWithMe,
}: {
  userId: string;
  initialDocuments: DocRow[];
  sharedWithMe: SharedDoc[];
}) {
  const [docs, setDocs]           = useState<DocRow[]>(initialDocuments);
  const [deleting, setDeleting]   = useState<string | null>(null);
  const [sharingDoc, setSharingDoc] = useState<{ id: string; title: string } | null>(null);
  const [toast, setToast]         = useState<{ message: string; type: "error" | "success" } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [search, setSearch]       = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const router  = useRouter();
  const supabase = useMemo(() => createClient(), []);

  function showToast(message: string, type: "error" | "success" = "error") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }

  async function createDocument() {
    const { data, error } = await supabase
      .from("documents")
      .insert({ user_id: userId, title: "Untitled", content: "" })
      .select("id")
      .single();
    if (error || !data) { showToast("Failed to create document"); return; }
    router.push(`/tools/preview?doc=${data.id}`);
  }

  async function deleteDocument(id: string) {
    if (!confirm("Delete this document? This cannot be undone.")) return;
    setDeleting(id);
    const { error } = await supabase.from("documents").delete().eq("id", id);
    if (error) {
      showToast("Failed to delete document");
    } else {
      setDocs(prev => prev.filter(d => d.id !== id));
      showToast("Document deleted", "success");
    }
    setDeleting(null);
  }

  async function renameDocument(id: string, title: string) {
    const trimmed = title.trim() || "Untitled";
    const { error } = await supabase.from("documents").update({ title: trimmed }).eq("id", id);
    if (error) { showToast("Failed to rename document"); }
    else { setDocs(prev => prev.map(d => d.id === id ? { ...d, title: trimmed } : d)); }
    setEditingId(null);
  }

  async function togglePin(doc: DocRow) {
    const { error } = await supabase
      .from("documents")
      .update({ is_pinned: !doc.is_pinned })
      .eq("id", doc.id);

    if (error) { showToast("Failed to update pin"); return; }

    startTransition(() => {
      setDocs(prev => {
        const updated = prev.map(d => d.id === doc.id ? { ...d, is_pinned: !d.is_pinned } : d);
        return [...updated].sort((a, b) => {
          if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        });
      });
    });
  }

  const btnStyle: React.CSSProperties = {
    padding: "0.3rem 0.7rem", borderRadius: 6,
    fontSize: "0.78rem", fontWeight: 600,
    border: "1px solid var(--border)", cursor: "pointer",
  };

  return (
    <>
      {/* ── Toast ─────────────────────────────────────────────────────────── */}
      {toast && <Toast message={toast.message} type={toast.type} />}

      {/* ── My documents ─────────────────────────────────────────────────── */}
      <section>
        {/* Header row */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.85rem", flexWrap: "wrap" }}>
          <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, flex: 1 }}>My documents</h2>

          {/* Search */}
          {docs.length > 2 && (
            <div style={{ position: "relative" }}>
              <svg style={{ position: "absolute", left: "0.6rem", top: "50%", transform: "translateY(-50%)", opacity: 0.4, pointerEvents: "none" }}
                width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="search"
                placeholder="Filter…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  paddingLeft: "1.8rem", paddingRight: "0.65rem",
                  paddingTop: "0.3rem", paddingBottom: "0.3rem",
                  borderRadius: 7, fontSize: "0.8rem",
                  background: "var(--surface2)", color: "var(--fg)",
                  border: "1px solid var(--border)", outline: "none", width: 140,
                }}
                onFocus={e => (e.currentTarget.style.borderColor = "var(--accent)")}
                onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")}
              />
            </div>
          )}

          <button
            onClick={createDocument}
            style={{
              padding: "0.4rem 1rem", borderRadius: 8,
              background: "var(--accent)", color: "#fff",
              fontWeight: 700, fontSize: "0.82rem",
              border: "none", cursor: "pointer", flexShrink: 0,
            }}
          >
            + New
          </button>
        </div>

        {docs.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "3rem 1.5rem",
            border: "2px dashed var(--border)", borderRadius: 12,
          }}>
            <p style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📄</p>
            <p style={{ fontWeight: 700, marginBottom: "0.4rem" }}>No documents yet</p>
            <p style={{ fontSize: "0.84rem", color: "var(--fg-muted)", marginBottom: "1.5rem" }}>
              Create a document to save and sync your LaTeX across devices.
            </p>
            <button
              onClick={createDocument}
              style={{
                padding: "0.65rem 1.5rem", borderRadius: 8,
                background: "var(--accent)", color: "#fff",
                fontWeight: 700, fontSize: "0.9rem",
                border: "none", cursor: "pointer",
              }}
            >
              Create your first document
            </button>
          </div>
        ) : (() => {
          const filteredDocs = search
            ? docs.filter(d => (d.title || "Untitled").toLowerCase().includes(search.toLowerCase()))
            : docs;

          if (filteredDocs.length === 0) {
            return (
              <div style={{ textAlign: "center", padding: "2rem", color: "var(--fg-muted)", fontSize: "0.85rem" }}>
                No documents match <strong>&ldquo;{search}&rdquo;</strong>.
                <button onClick={() => setSearch("")} style={{ marginLeft: 8, color: "var(--accent)", background: "none", border: "none", cursor: "pointer", fontSize: "0.85rem" }}>
                  Clear
                </button>
              </div>
            );
          }

          return (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {filteredDocs.map(doc => (
                <div
                  key={doc.id}
                  style={{
                    display: "flex", alignItems: "center", gap: "0.75rem",
                    padding: "0.85rem 1rem",
                    background: "var(--surface)", border: "1px solid var(--border)",
                    borderRadius: 10, transition: "border-color 0.15s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--accent)")}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}
                >
                  {/* Pin */}
                  <button
                    onClick={() => togglePin(doc)}
                    title={doc.is_pinned ? "Unpin" : "Pin to top"}
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      fontSize: "0.95rem", opacity: doc.is_pinned ? 1 : 0.3,
                      flexShrink: 0, padding: "0.1rem", transition: "opacity 0.15s",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
                    onMouseLeave={e => (e.currentTarget.style.opacity = doc.is_pinned ? "1" : "0.3")}
                  >
                    📌
                  </button>

                  {/* Title + meta — click title to rename */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {editingId === doc.id ? (
                      <input
                        autoFocus
                        value={editTitle}
                        onChange={e => setEditTitle(e.target.value)}
                        onBlur={() => renameDocument(doc.id, editTitle)}
                        onKeyDown={e => {
                          if (e.key === "Enter") renameDocument(doc.id, editTitle);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        style={{
                          width: "100%", padding: "0.18rem 0.45rem",
                          fontSize: "0.9rem", fontWeight: 600,
                          border: "1px solid var(--accent)", borderRadius: 5,
                          background: "var(--surface2)", color: "var(--fg)", outline: "none",
                        }}
                      />
                    ) : (
                      <p
                        title="Click to rename"
                        onClick={() => { setEditingId(doc.id); setEditTitle(doc.title || "Untitled"); }}
                        style={{
                          fontWeight: 600, fontSize: "0.9rem", margin: 0,
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          cursor: "text",
                        }}
                      >
                        {doc.title || <span style={{ color: "var(--fg-muted)", fontStyle: "italic" }}>Untitled</span>}
                      </p>
                    )}
                    <p style={{ fontSize: "0.75rem", color: "var(--fg-muted)", margin: 0, marginTop: 2 }}>
                      {relativeTime(doc.updated_at)}
                      {doc.is_public && (
                        <span style={{ marginLeft: 8, color: "#22c55e", fontWeight: 600 }}>🔗 Shared</span>
                      )}
                      {doc.tags?.length > 0 && (
                        <> · {doc.tags.map(t => (
                          <span key={t} style={{ marginLeft: 4, padding: "0.05rem 0.35rem", background: "var(--surface2)", borderRadius: 4, fontSize: "0.7rem" }}>{t}</span>
                        ))}</>
                      )}
                    </p>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: "0.4rem", flexShrink: 0 }}>
                    <Link
                      href={`/tools/preview?doc=${doc.id}`}
                      style={{ ...btnStyle, background: "var(--accent)", color: "#fff", border: "none", textDecoration: "none" }}
                    >
                      Open
                    </Link>
                    <button
                      onClick={() => setSharingDoc({ id: doc.id, title: doc.title || "Untitled" })}
                      title="Share"
                      style={{ ...btnStyle, background: "var(--surface2)", color: "var(--fg-muted)" }}
                    >
                      🔗
                    </button>
                    <button
                      onClick={() => deleteDocument(doc.id)}
                      disabled={deleting === doc.id}
                      title="Delete"
                      style={{ ...btnStyle, background: "var(--surface2)", color: "var(--fg-muted)", cursor: deleting === doc.id ? "wait" : "pointer" }}
                    >
                      {deleting === doc.id ? "…" : "🗑"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </section>

      {/* ── Shared with me ───────────────────────────────────────────────── */}
      {sharedWithMe.length > 0 && (
        <section style={{ marginTop: "2rem" }}>
          <h2 style={{ margin: "0 0 0.75rem", fontSize: "1rem", fontWeight: 700 }}>Shared with me</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {sharedWithMe.map(item => {
              const d = item.documents;
              if (!d) return null;
              const ownerName = d.profiles?.display_name || d.profiles?.email?.split("@")[0] || "Unknown";
              return (
                <div
                  key={item.document_id}
                  style={{
                    display: "flex", alignItems: "center", gap: "0.75rem",
                    padding: "0.85rem 1rem",
                    background: "var(--surface)", border: "1px solid var(--border)",
                    borderRadius: 10,
                  }}
                >
                  <span style={{ fontSize: "1.1rem", flexShrink: 0 }}>👥</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontWeight: 600, fontSize: "0.9rem", margin: 0,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {d.title || "Untitled"}
                    </p>
                    <p style={{ fontSize: "0.75rem", color: "var(--fg-muted)", margin: 0, marginTop: 2 }}>
                      by {ownerName} · {relativeTime(d.updated_at)} ·{" "}
                      <span style={{ color: item.permission === "edit" ? "#818cf8" : "var(--fg-muted)", fontWeight: 600 }}>
                        {item.permission === "edit" ? "Can edit" : "Can view"}
                      </span>
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "0.4rem", flexShrink: 0 }}>
                    {item.permission === "edit" ? (
                      <Link
                        href={`/tools/preview?doc=${d.id}`}
                        style={{ ...btnStyle, background: "var(--accent)", color: "#fff", border: "none", textDecoration: "none" }}
                      >
                        Edit
                      </Link>
                    ) : (
                      <Link
                        href={`/shared/${d.share_token}`}
                        style={{ ...btnStyle, background: "var(--surface2)", color: "var(--fg)", textDecoration: "none" }}
                      >
                        View
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Suppress isPending lint warning */}
      {isPending && <span style={{ display: "none" }} />}

      {/* ── Share modal ───────────────────────────────────────────────────── */}
      {sharingDoc && (
        <Suspense>
          <ShareModal
            docId={sharingDoc.id}
            docTitle={sharingDoc.title}
            onClose={() => setSharingDoc(null)}
          />
        </Suspense>
      )}
    </>
  );
}
