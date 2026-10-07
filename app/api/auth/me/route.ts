/** GET /api/auth/me: { configured, user: { email, name } | null, admin } */
import { NextResponse } from "next/server";
import { getSession, isAuthConfigured } from "@/lib/session";
import { isAdmin } from "@/lib/users";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  return NextResponse.json(
    { configured: isAuthConfigured, user: session ? { email: session.email, name: session.name ?? null } : null, admin: isAdmin(session?.email) },
    { headers: { "Cache-Control": "no-store" } },
  );
}
