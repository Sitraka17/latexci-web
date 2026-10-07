/** GET /api/admin/users[?format=csv]: signed-in users, for ADMIN_EMAILS only. */
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { isAdmin, listUsers } from "@/lib/users";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const csvCell = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || !isAdmin(session.email)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const users = await listUsers();
  if (req.nextUrl.searchParams.get("format") === "csv") {
    const rows = [["email", "name", "first_seen", "last_seen", "sign_ins", "pdf_exports", "word_conversions"]]
      .concat(users.map((u) => [u.email, u.name ?? "", u.firstSeen, u.lastSeen, String(u.counts.signin ?? 0), String(u.counts.pdf ?? 0), String(u.counts.word ?? 0)]));
    return new NextResponse(rows.map((r) => r.map(csvCell).join(",")).join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="latexci-users.csv"',
        "Cache-Control": "no-store",
      },
    });
  }
  return NextResponse.json({ users }, { headers: { "Cache-Control": "no-store" } });
}
