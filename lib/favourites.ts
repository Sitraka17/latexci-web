/**
 * Favourite symbols, kept in this browser (localStorage). No account, no
 * server: the list never leaves the device.
 *
 * Each entry carries enough to render it on the hub without loading the slug
 * tables (lib/seo-pages pulls the templates into the bundle): the page slug,
 * the command, the display name and the KaTeX-safe stand-in when there is one.
 * Newest first, capped at MAX_FAVOURITES.
 */
export type FavouriteSymbol = {
  slug: string;
  command: string;
  name: string;
  render?: string;
};

export const FAVOURITES_KEY = "latexci_fav_symbols";
export const MAX_FAVOURITES = 200;
// Same-tab notification: the storage event only fires in the *other* tabs.
const CHANGE_EVENT = "latexci:fav-symbols";

const EMPTY: FavouriteSymbol[] = [];

function valid(e: unknown): e is FavouriteSymbol {
  if (!e || typeof e !== "object") return false;
  const o = e as Record<string, unknown>;
  return (
    typeof o.slug === "string" && o.slug.length > 0 && o.slug.length <= 200 &&
    typeof o.command === "string" && o.command.length > 0 && o.command.length <= 200 &&
    typeof o.name === "string" &&
    (o.render === undefined || typeof o.render === "string")
  );
}

/** Parses the stored value; anything malformed is dropped, never thrown. */
export function parseFavourites(raw: string | null): FavouriteSymbol[] {
  if (!raw) return EMPTY;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return EMPTY;
  }
  if (!Array.isArray(data)) return EMPTY;
  const seen = new Set<string>();
  const out: FavouriteSymbol[] = [];
  for (const e of data) {
    if (!valid(e) || seen.has(e.slug)) continue;
    seen.add(e.slug);
    out.push(e.render === undefined
      ? { slug: e.slug, command: e.command, name: e.name }
      : { slug: e.slug, command: e.command, name: e.name, render: e.render });
    if (out.length >= MAX_FAVOURITES) break;
  }
  return out;
}

function readRaw(): string | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage.getItem(FAVOURITES_KEY);
  } catch {
    return null; // storage blocked (privacy mode, sandboxed iframe)
  }
}

// Snapshot cache keyed by the raw string, so useSyncExternalStore receives the
// same array reference until the stored value actually changes.
let cacheRaw: string | null | undefined;
let cacheList: FavouriteSymbol[] = EMPTY;

/** The saved symbols, newest first. Stable reference between changes. */
export function getFavourites(): FavouriteSymbol[] {
  const raw = readRaw();
  if (raw !== cacheRaw) {
    cacheRaw = raw;
    cacheList = parseFavourites(raw);
  }
  return cacheList;
}

/** Server snapshot: nothing is known before the browser has mounted. */
export function getServerFavourites(): FavouriteSymbol[] {
  return EMPTY;
}

export function isFavourite(slug: string): boolean {
  return getFavourites().some((f) => f.slug === slug);
}

function write(list: FavouriteSymbol[]): boolean {
  try {
    localStorage.setItem(FAVOURITES_KEY, JSON.stringify(list));
  } catch {
    return false; // quota exceeded or storage blocked
  }
  if (typeof window !== "undefined") window.dispatchEvent(new Event(CHANGE_EVENT));
  return true;
}

/**
 * Adds the symbol if absent, removes it if present. Returns the new state
 * (true = saved), or the unchanged state when storage is unavailable.
 */
export function toggleFavourite(entry: FavouriteSymbol): boolean {
  const list = getFavourites();
  const present = list.some((f) => f.slug === entry.slug);
  if (present) {
    return !write(list.filter((f) => f.slug !== entry.slug));
  }
  if (!valid(entry)) return false;
  const fresh: FavouriteSymbol = entry.render === undefined
    ? { slug: entry.slug, command: entry.command, name: entry.name }
    : { slug: entry.slug, command: entry.command, name: entry.name, render: entry.render };
  return write([fresh, ...list].slice(0, MAX_FAVOURITES));
}

export function removeFavourite(slug: string): void {
  const list = getFavourites();
  if (list.some((f) => f.slug === slug)) write(list.filter((f) => f.slug !== slug));
}

/** Calls `cb` when the list changes in this tab or in another one. */
export function subscribeFavourites(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const onStorage = (e: StorageEvent) => {
    // key is null when another tab calls localStorage.clear()
    if (e.key === FAVOURITES_KEY || e.key === null) cb();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(CHANGE_EVENT, cb);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(CHANGE_EVENT, cb);
  };
}
