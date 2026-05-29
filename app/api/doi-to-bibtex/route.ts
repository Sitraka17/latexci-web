import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const doi = req.nextUrl.searchParams.get("doi")?.trim();
  if (!doi) return NextResponse.json({ error: "Missing doi param" }, { status: 400 });

  // CrossRef returns BibTeX directly when you request this content type
  const url = `https://api.crossref.org/works/${encodeURIComponent(doi)}/transform/application/x-bibtex`;
  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/x-bibtex",
        "User-Agent": "latexci/1.0 (https://latexci-web.vercel.app; mailto:contact@latexci.com)",
      },
    });

    if (!res.ok) {
      if (res.status === 404) {
        return NextResponse.json({ error: "DOI not found. Check the format (e.g. 10.1038/nature12373)" }, { status: 404 });
      }
      return NextResponse.json({ error: `CrossRef returned ${res.status}` }, { status: res.status });
    }

    const bibtex = await res.text();
    if (!bibtex.startsWith("@")) {
      return NextResponse.json({ error: "CrossRef returned unexpected content" }, { status: 502 });
    }

    return new NextResponse(bibtex, {
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=86400" },
    });
  } catch {
    return NextResponse.json({ error: "Network error reaching CrossRef" }, { status: 502 });
  }
}
