import { describe, it, expect, vi, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "../../app/api/isbn-to-bibtex/route";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

let ip = 0;
const req = (isbn: string) =>
  new NextRequest(`https://latexci.com/api/isbn-to-bibtex?isbn=${isbn}`, {
    headers: { "x-forwarded-for": `10.0.0.${++ip}` },
  });

const GOOGLE = {
  totalItems: 1,
  items: [{
    volumeInfo: {
      title: "Reinforcement Learning",
      subtitle: "An Introduction",
      authors: ["Richard S. Sutton", "Andrew G. Barto"],
      publisher: "MIT Press & Co",
      publishedDate: "2018-11-13",
      pageCount: 549,
    },
  }],
};

afterEach(() => vi.unstubAllGlobals());

describe("GET /api/isbn-to-bibtex", () => {
  it("falls back to Google Books when Open Library answers 403", async () => {
    const calls: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
      calls.push(url);
      if (url.startsWith("https://openlibrary.org")) {
        expect((init?.headers as Record<string, string>)["User-Agent"]).toMatch(/latexci\.com/);
        return new Response("Forbidden", { status: 403 });
      }
      return json(GOOGLE);
    }));
    const res = await GET(req("9780262039246"));
    expect(res.status).toBe(200);
    const bib = await res.text();
    expect(bib).toBe([
      "@book{Sutton2018_isbn9780262039246,",
      "  author    = {Richard S. Sutton and Andrew G. Barto},",
      "  title     = {Reinforcement Learning: An Introduction},",
      "  publisher = {MIT Press \\& Co},",
      "  year      = {2018},",
      "  pages     = {549},",
      "  isbn      = {9780262039246}",
      "}",
    ].join("\n"));
    expect(calls.some(u => u.includes("googleapis.com/books/v1/volumes?q=isbn:9780262039246"))).toBe(true);
  });

  it("falls back when Open Library throws a network error", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      if (url.startsWith("https://openlibrary.org")) throw new TypeError("fetch failed");
      return json(GOOGLE);
    }));
    const res = await GET(req("9780262039246"));
    expect(res.status).toBe(200);
    expect(await res.text()).toMatch(/^@book\{Sutton2018_isbn9780262039246,/);
  });

  it("returns 502 with both reasons when both sources fail", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: string) =>
      url.startsWith("https://openlibrary.org") ? new Response("", { status: 403 }) : json({}, 429)));
    const res = await GET(req("9780262039246"));
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.error).toContain("Open Library returned 403");
    expect(body.error).toContain("Google Books returned 429");
  });

  it("returns 404 when neither source knows the ISBN", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: string) =>
      url.startsWith("https://openlibrary.org") ? new Response("", { status: 404 }) : json({ totalItems: 0 })));
    const res = await GET(req("9780262039246"));
    expect(res.status).toBe(404);
  });

  it("keeps the Open Library path when it works", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      if (url === "https://openlibrary.org/isbn/9780262039246.json") {
        return json({
          title: "Reinforcement Learning", subtitle: "An Introduction",
          publish_date: "2018", publishers: ["MIT Press"], publish_places: ["Cambridge, MA"],
          number_of_pages: 526, authors: [{ key: "/authors/OL1A" }], works: [{ key: "/works/OL2W" }],
        });
      }
      if (url === "https://openlibrary.org/authors/OL1A.json") return json({ name: "Richard S. Sutton" });
      throw new Error(`unexpected ${url}`);
    }));
    const res = await GET(req("9780262039246"));
    const bib = await res.text();
    expect(bib).toContain("@book{Sutton2018_isbn9780262039246,");
    expect(bib).toContain("  address   = {Cambridge, MA},");
    expect(bib).toContain("  note      = {Open Library: https://openlibrary.org/works/OL2W}");
  });
});
