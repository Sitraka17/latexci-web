import { NextResponse } from "next/server";
import { isAuthConfigured } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Uptime probe. No database: Google sign-in, documents kept in the browser. */
export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      auth: isAuthConfigured ? "google" : "off",
      ts: new Date().toISOString(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
