import { NextRequest, NextResponse } from "next/server";
import { getAdmin } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";

type Params = { params: Promise<{ token: string }> };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_CONTENT_BYTES = 1_000_000; // 1 MB of LaTeX is plenty

// ── PUT /api/shared/[token] ───────────────────────────────────────────────────
// Saves edits made through a public "anyone with the link can edit" page.
// No auth: the unguessable share token is the capability; the document must
// be public AND have public_can_edit enabled.
export async function PUT(req: NextRequest, { params }: Params) {
  const rl = rateLimit(req, { limit: 60, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ error: rl.message }, { status: 429, headers: rl.headers });

  const { token } = await params;
  if (!UUID_RE.test(token))
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });

  const admin = getAdmin();
  if (!admin)
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  let content: unknown;
  try {
    ({ content } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (typeof content !== "string")
    return NextResponse.json({ error: "content must be a string" }, { status: 400 });
  if (new TextEncoder().encode(content).length > MAX_CONTENT_BYTES)
    return NextResponse.json({ error: "Document too large" }, { status: 413 });

  const { data: doc } = await admin
    .from("documents")
    .select("id, is_public, public_can_edit")
    .eq("share_token", token)
    .single();

  if (!doc || !doc.is_public)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!doc.public_can_edit)
    return NextResponse.json({ error: "This document is read-only" }, { status: 403 });

  const { error } = await admin
    .from("documents")
    .update({ content, updated_at: new Date().toISOString() })
    .eq("id", doc.id);

  if (error)
    return NextResponse.json({ error: "Save failed" }, { status: 500 });

  return NextResponse.json({ ok: true });
}
