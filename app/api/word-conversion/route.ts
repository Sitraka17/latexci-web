/**
 * POST /api/word-conversion
 *
 * Gate check + counter increment for Word → LaTeX conversions.
 *
 * Free tier: 3 conversions/month, tracked in profiles.word_conversions_this_month.
 * Monthly reset: checked against profiles.word_conversions_reset_at (ISO date string).
 *   → Requires a one-time DB migration to add the column (see below).
 *   → Without the column the counter never resets — run the migration!
 *
 * Migration SQL (run once in Supabase SQL editor):
 *   ALTER TABLE profiles
 *     ADD COLUMN IF NOT EXISTS word_conversions_reset_at timestamptz
 *       DEFAULT now() NOT NULL;
 *
 * Pro / Lab / Institution: unlimited — counter is incremented but not checked.
 *
 * Returns:
 *   200 { allowed: true,  used: N, limit: 3, remaining: R }   — proceed
 *   200 { allowed: true,  used: N, limit: null, remaining: null } — paid user
 *   403 { allowed: false, used: N, limit: 3, remaining: 0,
 *          error: "upgrade_required", feature: "word_conversion" }
 *   403 { allowed: false, error: "sign_in_required", feature: "word_conversion" }
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const FREE_LIMIT = 3;

function currentPeriod(): string {
  // "YYYY-MM" in UTC — avoids month-boundary drift across timezones
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export async function POST(_req: NextRequest) {
  // ── Dev / unconfigured → always allow ─────────────────────────────────────
  if (!isSupabaseConfigured) {
    return NextResponse.json({ allowed: true, used: 0, limit: null, remaining: null });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ── Not signed in → block with sign-in prompt ──────────────────────────────
  if (!user) {
    return NextResponse.json(
      { allowed: false, error: "sign_in_required", feature: "word_conversion" },
      { status: 403 }
    );
  }

  // ── Fetch profile ──────────────────────────────────────────────────────────
  const { data: profile, error: fetchErr } = await supabase
    .from("profiles")
    .select(
      "subscription_tier, subscription_status, word_conversions_this_month, word_conversions_reset_at"
    )
    .eq("id", user.id)
    .single();

  if (fetchErr || !profile) {
    // Profile missing — treat as free, allow (onboarding edge case)
    return NextResponse.json({ allowed: true, used: 0, limit: FREE_LIMIT, remaining: FREE_LIMIT });
  }

  const tier = profile.subscription_tier;
  const status = profile.subscription_status;
  const paid =
    (tier === "pro" || tier === "lab" || tier === "institution") &&
    (status === "active" || status === "trialing");

  // Counter writes MUST go through the service-role client: the profile
  // sensitive-field trigger (2026-07-04-profile-write-restriction) reverts
  // word_conversions_* for non-service_role callers, which would otherwise make
  // every increment a silent no-op (free quota unenforceable). Falls back to the
  // anon client only when the service-role key is unconfigured (dev).
  const writer = getAdmin() ?? supabase;

  // ── Paid users: increment and allow ───────────────────────────────────────
  if (paid) {
    await writer
      .from("profiles")
      .update({
        word_conversions_this_month: profile.word_conversions_this_month + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    return NextResponse.json({ allowed: true, used: null, limit: null, remaining: null });
  }

  // ── Free users: check monthly counter ─────────────────────────────────────
  // The DB trigger (trg_reset_word_conversions) auto-resets on the next UPDATE
  // after a new month starts. Here we just check the column directly.
  const resetAt = profile.word_conversions_reset_at ?? null;
  const needsReset = resetAt
    ? resetAt.slice(0, 7) !== currentPeriod()   // "YYYY-MM" comparison
    : true;                                       // null → treat as needing reset

  // If a new month has started, treat count as 0
  const used = needsReset ? 0 : (profile.word_conversions_this_month ?? 0);

  if (used >= FREE_LIMIT) {
    return NextResponse.json(
      {
        allowed: false,
        used,
        limit: FREE_LIMIT,
        remaining: 0,
        error: "upgrade_required",
        feature: "word_conversion",
      },
      { status: 403 }
    );
  }

  // Increment counter with optimistic locking:
  // Only update if the DB value still matches what we read (prevents TOCTOU race).
  // If a concurrent request already incremented, count won't match and we return 0 rows.
  const currentCount = profile.word_conversions_this_month ?? 0;
  const { data: updatedRows } = await writer
    .from("profiles")
    .update({
      word_conversions_this_month: needsReset ? 1 : used + 1,
      word_conversions_reset_at: needsReset ? new Date().toISOString() : undefined,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id)
    // Optimistic lock: only write if the row hasn't changed since we read it
    .eq("word_conversions_this_month", currentCount)
    .select("id");

  if (!updatedRows || updatedRows.length === 0) {
    // Optimistic lock failed — a concurrent request already incremented the counter.
    // Return 429 (transient) instead of 403 (permanent) so the client can retry.
    return NextResponse.json(
      { allowed: false, error: "concurrent_request", feature: "word_conversion",
        message: "Too many simultaneous requests. Please try again." },
      { status: 429 }
    );
  }

  return NextResponse.json({
    allowed: true,
    used: used + 1,
    limit: FREE_LIMIT,
    remaining: FREE_LIMIT - used - 1,
  });
}
