import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 30;

/** Returns true when this user's tier allows PDF export. */
async function checkPdfAccess(): Promise<{ allowed: boolean; reason?: string }> {
  // Dev / unconfigured: open access so local development works.
  if (!isSupabaseConfigured) return { allowed: true };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { allowed: false, reason: "sign_in_required" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_tier, subscription_status")
    .eq("id", user.id)
    .single();

  const tier = profile?.subscription_tier ?? "free";
  const status = profile?.subscription_status;

  // Active paid subscription → allow
  const paid =
    (tier === "pro" || tier === "lab" || tier === "institution") &&
    (status === "active" || status === "trialing");

  if (!paid) {
    return { allowed: false, reason: "upgrade_required" };
  }

  return { allowed: true };
}

export async function POST(req: NextRequest) {
  // ── Rate limit: 5 compilations/min per IP (pro feature but still protect YToTech) ──
  const rl = rateLimit(req, { limit: 5, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ error: rl.message, feature: "pdf_export" }, { status: 429, headers: rl.headers });

  // ── Auth gate ──────────────────────────────────────────────────────────────
  const access = await checkPdfAccess();
  if (!access.allowed) {
    return NextResponse.json(
      { error: "upgrade_required", reason: access.reason, feature: "pdf_export" },
      { status: 403 }
    );
  }

  // ── Validate body ──────────────────────────────────────────────────────────
  let source: string;
  try {
    const body = await req.json();
    source = body?.source ?? "";
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!source || typeof source !== "string") {
    return NextResponse.json({ error: "Missing LaTeX source" }, { status: 400 });
  }

  if (source.length > 80_000) {
    return NextResponse.json(
      { error: "Document too large (max 80 KB). Try removing unused content." },
      { status: 413 }
    );
  }

  // ── Compile ────────────────────────────────────────────────────────────────
  let pdf: ArrayBuffer | null = null;
  let lastError = "";

  // Primary: pdflatex (25 s timeout — YToTech can be slow on first compile)
  try {
    const r = await fetch("https://latex.ytotech.com/builds/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        compiler: "pdflatex",
        resources: [{ main: true, content: source }],
      }),
      signal: AbortSignal.timeout(25_000),
    });
    if (r.ok) {
      const buf = await r.arrayBuffer();
      if (buf.byteLength > 0) pdf = buf; // guard: reject empty-body 200
    } else {
      const txt = await r.text().catch(() => "");
      lastError =
        txt.slice(0, 300).replace(/<[^>]+>/g, " ").trim() || `HTTP ${r.status}`;
    }
  } catch (err) {
    lastError = err instanceof Error && err.name === "TimeoutError"
      ? "Compilation timed out (>25 s). Try simplifying your document."
      : "Compilation service unreachable. Check your internet connection.";
  }

  // Fallback: xelatex (handles Unicode / fontspec)
  if (!pdf) {
    try {
      const r = await fetch("https://latex.ytotech.com/builds/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          compiler: "xelatex",
          resources: [{ main: true, content: source }],
        }),
        signal: AbortSignal.timeout(25_000),
      });
      if (r.ok) {
        const buf = await r.arrayBuffer();
        if (buf.byteLength > 0) pdf = buf;
      }
    } catch { /* ignore xelatex fallback errors */ }
  }

  if (!pdf) {
    return NextResponse.json(
      { error: `LaTeX compilation failed: ${lastError}` },
      { status: 422 }
    );
  }

  return new NextResponse(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="document.pdf"',
      "Cache-Control": "no-store",
    },
  });
}
