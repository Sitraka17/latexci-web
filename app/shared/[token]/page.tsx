import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAdmin } from "@/lib/supabase/admin";
import SharedEditor from "@/components/SharedEditor";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ token: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const admin = getAdmin();
  if (!admin) return { title: "Shared document — latexci" };

  const { data: doc } = await admin
    .from("documents")
    .select("title")
    .eq("share_token", token)
    .single();

  const title = doc?.title ? `${doc.title} — latexci` : "Shared document — latexci";
  return {
    title,
    robots: { index: false, follow: false },
  };
}

export default async function SharedDocPage({ params }: Props) {
  const { token } = await params;
  const admin = getAdmin();

  // Service role key not configured → fail gracefully
  if (!admin) notFound();

  const { data: doc } = await admin
    .from("documents")
    .select("id, title, content, is_public, public_can_edit, user_id")
    .eq("share_token", token)
    .single();

  if (!doc || !doc.is_public) notFound();

  const { data: owner } = await admin
    .from("profiles")
    .select("display_name, email")
    .eq("id", doc.user_id)
    .single();

  const ownerName = owner?.display_name || owner?.email?.split("@")[0] || "Someone";

  return (
    <main style={{ display: "flex", flexDirection: "column", height: "100dvh" }}>
      {/* Shared-by banner */}
      <div style={{
        background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
        padding: "0.55rem 1.25rem",
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        fontSize: "0.82rem",
        color: "var(--fg-muted)",
        flexShrink: 0,
      }}>
        <span style={{ fontSize: "1rem" }}>🔗</span>
        <span>
          Shared by <strong style={{ color: "var(--fg)" }}>{ownerName}</strong>
          {" · "}
          <em>{doc.title}</em>
        </span>
        {!doc.public_can_edit && (
          <span style={{
            marginLeft: "auto",
            padding: "0.2rem 0.6rem",
            background: "var(--surface2)",
            borderRadius: 6,
            fontWeight: 600,
            color: "var(--fg-muted)",
            fontSize: "0.75rem",
          }}>
            Read-only
          </span>
        )}
      </div>

      {/* Editor */}
      <div style={{ flex: 1, overflow: "hidden" }}>
        <Suspense>
          <SharedEditor
            initialContent={doc.content}
            title={doc.title}
            readOnly={!doc.public_can_edit}
          />
        </Suspense>
      </div>
    </main>
  );
}
