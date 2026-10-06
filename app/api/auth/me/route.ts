/** GET /api/auth/me: { configured, user: { email, name } | null } */
import { NextResponse } from "next/server";
import { getSession, isAuthConfigured } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  return NextResponse.json(
    { configured: isAuthConfigured, user: session ? { email: session.email, name: session.name ?? null } : null },
    { headers: { "Cache-Control": "no-store" } },
  );
}
