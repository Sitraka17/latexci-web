"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type DocRow = {
  id: string;
  title: string;
  updated_at: string;
  is_pinned: boolean;
  tags: string[];
};

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export default function DashboardClient({
  userId,
  initialDocuments,
}: {
  userId: string;
  initialDocuments: DocRow[];
}) {
  const [docs, setDocs] = useState<DocRow[]>(initialDocuments);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const supabase = createClient();

  async function createDocument() {
    const { data, error } = await supabase
      .from("documents")
      .insert({ user_id: userId, title: "Untitled", content: "" })
      .select("id")
      .single();
    if (error || !data) return;
    router.push(`/tools/preview?doc=${data.id}`);
  }

  async function deleteDocument(id: string) {
    if (!confirm("Delete this document? This cannot be undone.")) return;
    setDeleting(id);
    await supabase.from("documents").delete().eq("id", id);
    setDocs(prev => prev.filter(d => d.id !== id));
    setDeleting(null);
  }

  async function togglePin(doc: DocRow) {
    await supabase.from("documents").update({ is_pinned: !doc.is_pinned }).eq("id", doc.id);
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

  if (docs.length === 0) {
    return (
      <div style={{
        textAlign: "center",
        padding: "4rem 1.5rem",
        border: "2px dashed var(--border)",
        borderRadius: 12,
      }}>
        <p style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>📄</p>
        <p style={{ fontWeight: 700, marginBottom: "0.4rem" }}>No documents yet</p>
        <p style={{ fontSize: "0.84rem", color: "var(--fg-muted)", marginBottom: "1.5rem" }}>
          Open any tool to start editing — your work will be saved here automatically.
        </p>
        <button
          onClick={createDocument}
          style={{
            padding: "0.65rem 1.5rem",
            borderRadius: 8,
            background: "var(--accent)",
            color: "#fff",
            fontWeight: 700,
            fontSize: "0.9rem",
            border: "none",
            cursor: "pointer",
          }}
        >
          Create your first document
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      {docs.map(doc => (
        <div
          key={doc.id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            padding: "0.85rem 1rem",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            transition: "border-color 0.15s",
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
              flexShrink: 0, padding: "0.1rem",
              transition: "opacity 0.15s",
            }}
          >
            📌
          </button>

          {/* Title + meta */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              fontWeight: 600, fontSize: "0.9rem", margin: 0,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {doc.title || "Untitled"}
            </p>
            <p style={{ fontSize: "0.75rem", color: "var(--fg-muted)", margin: 0, marginTop: 2 }}>
              {relativeTime(doc.updated_at)}
              {doc.tags.length > 0 && (
                <> · {doc.tags.map(t => <span key={t} style={{ marginLeft: 4, padding: "0.05rem 0.35rem", background: "var(--surface2)", borderRadius: 4, fontSize: "0.7rem" }}>{t}</span>)}</>
              )}
            </p>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: "0.4rem", flexShrink: 0 }}>
            <Link
              href={`/tools/preview?doc=${doc.id}`}
              style={{
                padding: "0.3rem 0.7rem", borderRadius: 6,
                background: "var(--accent)", color: "#fff",
                fontSize: "0.78rem", fontWeight: 600, textDecoration: "none",
              }}
            >
              Open
            </Link>
            <button
              onClick={() => deleteDocument(doc.id)}
              disabled={deleting === doc.id}
              title="Delete"
              style={{
                padding: "0.3rem 0.55rem", borderRadius: 6,
                background: "var(--surface2)", border: "1px solid var(--border)",
                fontSize: "0.78rem", color: "var(--fg-muted)",
                cursor: deleting === doc.id ? "wait" : "pointer",
              }}
            >
              {deleting === doc.id ? "…" : "🗑"}
            </button>
          </div>
        </div>
      ))}
      {/* Void isPending warning */}
      {isPending && <span style={{ display: "none" }} />}
    </div>
  );
}
