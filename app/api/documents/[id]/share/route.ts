import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env vars not set");
  return createSupabaseAdmin<Database>(url, key);
}

type Params = { params: Promise<{ id: string }> };

// ── GET /api/documents/[id]/share ─────────────────────────────────────────────
// Returns sharing status + collaborator list for a document (owner only)
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = getAdmin();

  // Verify ownership
  const { data: doc } = await admin
    .from("documents")
    .select("id, share_token, is_public, public_can_edit, user_id")
    .eq("id", id)
    .single();

  if (!doc || doc.user_id !== user.id)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Get collaborators
  const { data: collaborators } = await admin
    .from("document_collaborators")
    .select("id, email, permission, created_at")
    .eq("document_id", id)
    .order("created_at");

  return NextResponse.json({
    share_token:     doc.share_token,
    is_public:       doc.is_public,
    public_can_edit: doc.public_can_edit,
    collaborators:   collaborators ?? [],
  });
}

// ── POST /api/documents/[id]/share ────────────────────────────────────────────
// Body shapes:
//   { action: "set_public",  is_public: bool, public_can_edit?: bool }
//   { action: "invite",      email: string,   permission: "view"|"edit" }
//   { action: "remove",      email: string }
export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const admin = getAdmin();

  // Verify ownership
  const { data: doc } = await admin
    .from("documents")
    .select("id, user_id, share_token")
    .eq("id", id)
    .single();

  if (!doc || doc.user_id !== user.id)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  // ── Toggle public link ─────────────────────────────────────────────────────
  if (body.action === "set_public") {
    const { error } = await admin
      .from("documents")
      .update({
        is_public:       Boolean(body.is_public),
        public_can_edit: Boolean(body.public_can_edit ?? false),
      })
      .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, share_token: doc.share_token });
  }

  // ── Invite collaborator ────────────────────────────────────────────────────
  if (body.action === "invite") {
    const email      = String(body.email ?? "").toLowerCase().trim();
    const permission = body.permission === "edit" ? "edit" : "view";
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

    const { error } = await admin
      .from("document_collaborators")
      .upsert({ document_id: id, invited_by: user.id, email, permission },
               { onConflict: "document_id,email" });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // ── Remove collaborator ────────────────────────────────────────────────────
  if (body.action === "remove") {
    const email = String(body.email ?? "").toLowerCase().trim();
    await admin
      .from("document_collaborators")
      .delete()
      .eq("document_id", id)
      .eq("email", email);

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
