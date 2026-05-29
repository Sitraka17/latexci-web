import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
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

  let res: Response;
  try {
    res = await fetch("https://latexonline.cc/compile", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `text=${encodeURIComponent(source)}`,
    });
  } catch {
    return NextResponse.json(
      { error: "Could not reach the LaTeX compilation service. Try again." },
      { status: 502 }
    );
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const preview = text.slice(0, 300).replace(/<[^>]+>/g, " ").trim();
    return NextResponse.json(
      { error: `LaTeX compilation failed: ${preview || `HTTP ${res.status}`}` },
      { status: 422 }
    );
  }

  const pdf = await res.arrayBuffer();
  return new NextResponse(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="document.pdf"',
      "Cache-Control": "no-store",
    },
  });
}
