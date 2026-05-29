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

  // Primary: latex.ytotech.com  (returns 201 + application/pdf on success)
  let pdf: ArrayBuffer | null = null;
  let lastError = "";

  try {
    const r = await fetch("https://latex.ytotech.com/builds/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        compiler: "pdflatex",
        resources: [{ main: true, content: source }],
      }),
    });
    if (r.ok) {
      pdf = await r.arrayBuffer();
    } else {
      const txt = await r.text().catch(() => "");
      lastError = txt.slice(0, 300).replace(/<[^>]+>/g, " ").trim() || `HTTP ${r.status}`;
    }
  } catch {
    lastError = "Compilation service unreachable. Check your internet connection.";
  }

  // Fallback: latex.ytotech.com async endpoint (different path)
  if (!pdf) {
    try {
      const r = await fetch("https://latex.ytotech.com/builds/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          compiler: "xelatex",
          resources: [{ main: true, content: source }],
        }),
      });
      if (r.ok) pdf = await r.arrayBuffer();
    } catch { /* ignore */ }
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
