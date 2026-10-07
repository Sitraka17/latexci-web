/**
 * Who uses latexci: one private JSON blob per signed-in user (Vercel Blob,
 * store "latexci-users", region cdg1). Written on sign-in and when a
 * sign-in-only feature is used; read only by admins (ADMIN_EMAILS).
 *
 * Every write is best-effort: a storage hiccup must never block a sign-in or
 * an export, so callers schedule these with after() and errors are logged.
 */
import { BlobPreconditionFailedError, del, get, list, put } from "@vercel/blob";
import type { Session } from "@/lib/session";

export type UsageEvent = "signin" | "pdf" | "word";

export type UserRecord = {
  sub: string;
  email: string;
  name: string | null;
  firstSeen: string;
  lastSeen: string;
  counts: Partial<Record<UsageEvent, number>>;
};

const enabled = () => !!process.env.BLOB_READ_WRITE_TOKEN;
const pathOf = (sub: string) => `users/${sub.replace(/[^\w-]/g, "")}.json`;

async function readWithTag(pathname: string): Promise<{ rec: UserRecord; etag: string } | null> {
  const res = await get(pathname, { access: "private", useCache: false });
  if (!res || !res.stream) return null;
  return { rec: JSON.parse(await new Response(res.stream).text()) as UserRecord, etag: res.blob.etag };
}

async function read(pathname: string): Promise<UserRecord | null> {
  return (await readWithTag(pathname))?.rec ?? null;
}

export async function recordUsage(session: Session, event: UsageEvent): Promise<void> {
  if (!enabled()) return;
  const path = pathOf(session.sub);
  // Read-modify-write guarded by the blob's ETag, so two requests landing
  // together (an export right after a sign-in) cannot overwrite each other.
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const now = new Date().toISOString();
      const prev = await readWithTag(path);
      const p = prev?.rec;
      const rec: UserRecord = {
        sub: session.sub,
        email: session.email,
        name: session.name ?? p?.name ?? null,
        firstSeen: p?.firstSeen ?? now,
        lastSeen: now,
        counts: { ...p?.counts, [event]: (p?.counts?.[event] ?? 0) + 1 },
      };
      await put(path, JSON.stringify(rec), {
        access: "private", addRandomSuffix: false, allowOverwrite: true, contentType: "application/json",
        ...(prev ? { ifMatch: prev.etag } : {}),
      });
      return;
    } catch (err) {
      if (err instanceof BlobPreconditionFailedError) {
        await new Promise((r) => setTimeout(r, 150 * (attempt + 1)));
        continue;
      }
      console.error("[users] could not record", event, err instanceof Error ? err.message : err);
      return;
    }
  }
  console.error("[users] gave up recording", event, "after concurrent updates");
}

export async function deleteUser(sub: string): Promise<void> {
  if (!enabled()) return;
  await del(pathOf(sub));
}

export async function listUsers(limit = 500): Promise<UserRecord[]> {
  if (!enabled()) return [];
  const out: UserRecord[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ prefix: "users/", cursor, limit: 1000 });
    const recs = await Promise.all(page.blobs.map((b) => read(b.pathname).catch(() => null)));
    for (const r of recs) if (r) out.push(r);
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor && out.length < limit);
  return out.sort((a, b) => b.lastSeen.localeCompare(a.lastSeen)).slice(0, limit);
}

export function isAdmin(email: string | undefined): boolean {
  if (!email) return false;
  const admins = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  return admins.includes(email.toLowerCase());
}
