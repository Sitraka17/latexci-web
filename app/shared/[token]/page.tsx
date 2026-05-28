import { Suspense } from "react";
import { notFound } from "next/navigation";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import SharedEditor from "@/components/SharedEditor";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false } };

function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  return createSupabaseAdmin<Database>(url, key);
}

type Props = { params: Promise<{ token: string }> };

export default async function SharedDocPage({ params }: Props) {
  const { token } = await params;
  const admin = getAdmin();

  // Fetch document + owner profile by share token
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

      {/* Editor (full remaining height) */}
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
