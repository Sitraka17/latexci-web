import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return NextResponse.next({ request });

  // ── Anonymous short-circuit ────────────────────────────────────────────────
  // This middleware exists ONLY to refresh a signed-in user's Supabase session
  // cookie. A request that carries no "sb-*" auth cookie has no session to
  // refresh, so we skip creating a client and the getUser() network round-trip
  // entirely and return immediately.
  //
  // That is ~100% of this site's traffic — search-engine crawlers and logged-out
  // visitors — so it turns a per-request Supabase call on every (static) page
  // into a no-op. Before this, a Googlebot crawl of the 400+ symbol/template
  // pages fired one doomed auth request per page, which was the main driver of
  // Fluid CPU usage (and pure waste while the backend is paused).
  const hasAuthCookie = request.cookies.getAll().some((c) => c.name.startsWith("sb-"));
  if (!hasAuthCookie) return NextResponse.next({ request });

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  // Refresh session — MUST await getUser() to keep the session alive.
  await supabase.auth.getUser();

  return supabaseResponse;
}

export const config = {
  matcher: [
    // Run on all routes except Next.js internals, static assets, and the static
    // metadata files crawlers hit constantly (sitemap, robots, manifest, icons).
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|manifest.webmanifest|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|json|webmanifest)$).*)",
  ],
};
