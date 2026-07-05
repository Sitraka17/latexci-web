/**
 * POST /api/account/delete
 *
 * Permanently deletes the authenticated user's account. Deleting the auth.users
 * row cascades (schema.sql): profiles → documents → document_collaborators are
 * all removed via ON DELETE CASCADE, so a single admin deleteUser() is a
 * complete, orphan-free erasure. Backs the GDPR "right to erasure" promised in
 * the privacy policy.
 */
import { NextResponse } from "next/server";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST() {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  // Identify the caller from their own session (never trust a client-supplied id).
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = getAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  // Cascades to profile, documents, and collaborator rows.
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    console.error("[account/delete] failed:", error.message);
    return NextResponse.json({ error: "Could not delete account. Please try again." }, { status: 500 });
  }

  // Best-effort local sign-out so the now-orphaned session cookie is cleared.
  await supabase.auth.signOut().catch(() => {});

  return NextResponse.json({ ok: true });
}
