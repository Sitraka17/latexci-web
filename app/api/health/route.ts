import { NextResponse } from "next/server";
import { isAuthConfigured } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Uptime probe. No database since the move to Google sign-in + Stripe. */
export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      auth: isAuthConfigured ? "google" : "off",
      billing: process.env.STRIPE_SECRET_KEY ? "stripe" : "off",
      ts: new Date().toISOString(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
