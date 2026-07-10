/**
 * POST /api/account/delete
 *
 * Permanently deletes the authenticated user's account. Deleting the auth.users
 * row cascades (schema.sql): profiles → documents → document_collaborators are
 * all removed via ON DELETE CASCADE, so a single admin deleteUser() is a
 * complete, orphan-free erasure. Backs the GDPR "right to erasure" promised in
 * the privacy policy.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getAdmin } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  // Defense-in-depth on the most destructive action in the app.
  const rl = rateLimit(req, { limit: 3, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ error: rl.message }, { status: 429, headers: rl.headers });

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

  // The cascade removes rows tied to the user's OWN documents, but their email
  // also sits (as plain text, not an FK) in collaborator rows on OTHER people's
  // documents they were invited to. Erase those first for a complete PII wipe.
  if (user.email) {
    await admin.from("document_collaborators").delete().eq("email", user.email);
  }

  // Cascades to profile, documents, and the user's own collaborator rows.
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    console.error("[account/delete] failed:", error.message);
    return NextResponse.json({ error: "Could not delete account. Please try again." }, { status: 500 });
  }

  // Best-effort local sign-out so the now-orphaned session cookie is cleared.
  await supabase.auth.signOut().catch(() => {});

  return NextResponse.json({ ok: true });
}
