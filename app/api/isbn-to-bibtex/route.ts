import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { lookupIsbn } from "@/lib/isbn-lookup";

export const runtime = "edge";

/** Descriptive User-Agent: Open Library asks clients to identify themselves. */
const UA = { "User-Agent": "latexci.com ISBN lookup (+https://latexci.com; mailto:contact@latexci.com)" };

/**
 * Server fallback for the ISBN tool, which normally queries Open Library from
 * the browser (lib/isbn-lookup.ts): Open Library answers 403 to Vercel.
 */
export async function GET(req: NextRequest) {
  const rl = rateLimit(req, { limit: 20, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ error: rl.message }, { status: 429, headers: rl.headers });

  const raw = req.nextUrl.searchParams.get("isbn")?.trim() ?? "";
  if (!raw) return NextResponse.json({ error: "Missing isbn param" }, { status: 400 });

  const r = await lookupIsbn(raw, UA);
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status });
  return new NextResponse(r.bibtex, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=86400" },
  });
}
