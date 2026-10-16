/**
 * GET  /api/account/newsletter          -> { optIn: boolean }
 * POST /api/account/newsletter {optIn}  -> { optIn: boolean }
 * Product-news emails for signed-in users; off unless they tick the box.
 */
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";
import { getUser, setNewsletter } from "@/lib/users";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rec = await getUser(session.sub).catch(() => null);
  return NextResponse.json({ optIn: rec?.newsletter?.optIn === true }, { headers: noStore });
}

export async function POST(req: NextRequest) {
  const rl = rateLimit(req, { limit: 10, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ error: rl.message }, { status: 429, headers: rl.headers });
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (typeof body?.optIn !== "boolean") return NextResponse.json({ error: "optIn must be a boolean" }, { status: 400 });
  await setNewsletter(session, body.optIn);
  return NextResponse.json({ optIn: body.optIn }, { headers: noStore });
}
