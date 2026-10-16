import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  FAVOURITES_KEY,
  MAX_FAVOURITES,
  getFavourites,
  getServerFavourites,
  isFavourite,
  parseFavourites,
  removeFavourite,
  subscribeFavourites,
  toggleFavourite,
  type FavouriteSymbol,
} from "@/lib/favourites";

// The test environment is node (no jsdom): stand in a Map-backed localStorage
// and an EventTarget for window, which is all lib/favourites touches.
class MemoryStorage {
  private m = new Map<string, string>();
  throwOnSet = false;
  getItem(k: string) { return this.m.has(k) ? this.m.get(k)! : null; }
  setItem(k: string, v: string) {
    if (this.throwOnSet) throw new Error("QuotaExceededError");
    this.m.set(k, String(v));
  }
  removeItem(k: string) { this.m.delete(k); }
  clear() { this.m.clear(); }
}

let storage: MemoryStorage;
let win: EventTarget;

const alpha: FavouriteSymbol = { slug: "alpha", command: "\\alpha", name: "alpha" };
const beta: FavouriteSymbol = { slug: "beta", command: "\\beta", name: "beta" };
const one: FavouriteSymbol = { slug: "indicator", command: "\\mathds{1}", name: "indicator", render: "\\mathbb{1}" };

beforeEach(() => {
  storage = new MemoryStorage();
  win = new EventTarget();
  vi.stubGlobal("localStorage", storage);
  vi.stubGlobal("window", win);
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe("parseFavourites", () => {
  it("returns an empty list for null, empty or malformed JSON", () => {
    expect(parseFavourites(null)).toEqual([]);
    expect(parseFavourites("")).toEqual([]);
    expect(parseFavourites("{not json")).toEqual([]);
    expect(parseFavourites('{"slug":"alpha"}')).toEqual([]);
    expect(parseFavourites("42")).toEqual([]);
  });

  it("drops malformed entries and duplicates, keeps valid ones in order", () => {
    const raw = JSON.stringify([
      alpha,
      null,
      "beta",
      { slug: "", command: "\\x", name: "x" },
      { slug: "gamma", command: 3, name: "gamma" },
      { slug: "delta", command: "\\delta", name: "delta", render: 7 },
      beta,
      { ...alpha, name: "duplicate" },
    ]);
    expect(parseFavourites(raw)).toEqual([alpha, beta]);
  });

  it("strips unknown fields", () => {
    const raw = JSON.stringify([{ ...one, extra: "<script>" }]);
    expect(parseFavourites(raw)).toEqual([one]);
  });

  it("caps at MAX_FAVOURITES", () => {
    const many = Array.from({ length: MAX_FAVOURITES + 50 }, (_, i) => ({ slug: `s${i}`, command: `\\c${i}`, name: `n${i}` }));
    const out = parseFavourites(JSON.stringify(many));
    expect(out).toHaveLength(MAX_FAVOURITES);
    expect(out[0].slug).toBe("s0");
  });
});

describe("getFavourites / toggleFavourite", () => {
  it("starts empty and the server snapshot is always empty", () => {
    expect(getFavourites()).toEqual([]);
    expect(getServerFavourites()).toEqual([]);
  });

  it("adds newest first, then removes on a second toggle", () => {
    expect(toggleFavourite(alpha)).toBe(true);
    expect(toggleFavourite(beta)).toBe(true);
    expect(getFavourites().map((f) => f.slug)).toEqual(["beta", "alpha"]);
    expect(isFavourite("alpha")).toBe(true);

    expect(toggleFavourite(alpha)).toBe(false);
    expect(isFavourite("alpha")).toBe(false);
    expect(JSON.parse(storage.getItem(FAVOURITES_KEY)!)).toEqual([beta]);
  });

  it("keeps the KaTeX stand-in", () => {
    toggleFavourite(one);
    expect(getFavourites()[0]).toEqual(one);
  });

  it("returns the same array reference until the stored value changes", () => {
    toggleFavourite(alpha);
    const a = getFavourites();
    expect(getFavourites()).toBe(a);
    toggleFavourite(beta);
    expect(getFavourites()).not.toBe(a);
  });

  it("recovers from a corrupted stored value", () => {
    storage.setItem(FAVOURITES_KEY, "[{oops");
    expect(getFavourites()).toEqual([]);
    expect(toggleFavourite(alpha)).toBe(true);
    expect(getFavourites()).toEqual([alpha]);
  });

  it("drops the oldest entry past the cap", () => {
    const many = Array.from({ length: MAX_FAVOURITES }, (_, i) => ({ slug: `s${i}`, command: `\\c${i}`, name: `n${i}` }));
    storage.setItem(FAVOURITES_KEY, JSON.stringify(many));
    toggleFavourite(alpha);
    const list = getFavourites();
    expect(list).toHaveLength(MAX_FAVOURITES);
    expect(list[0]).toEqual(alpha);
    expect(list.some((f) => f.slug === `s${MAX_FAVOURITES - 1}`)).toBe(false);
  });

  it("refuses an invalid entry", () => {
    expect(toggleFavourite({ slug: "", command: "\\x", name: "x" })).toBe(false);
    expect(getFavourites()).toEqual([]);
  });

  it("reports the unchanged state when storage throws", () => {
    toggleFavourite(alpha);
    storage.throwOnSet = true;
    expect(toggleFavourite(beta)).toBe(false);
    expect(toggleFavourite(alpha)).toBe(true);
    expect(getFavourites()).toEqual([alpha]);
  });

  it("works when localStorage access itself throws", () => {
    vi.stubGlobal("localStorage", {
      getItem() { throw new Error("SecurityError"); },
      setItem() { throw new Error("SecurityError"); },
    });
    expect(getFavourites()).toEqual([]);
    expect(toggleFavourite(alpha)).toBe(false);
  });

  it("removeFavourite removes only that slug", () => {
    toggleFavourite(alpha);
    toggleFavourite(beta);
    removeFavourite("alpha");
    expect(getFavourites()).toEqual([beta]);
    removeFavourite("missing");
    expect(getFavourites()).toEqual([beta]);
  });
});

describe("subscribeFavourites", () => {
  function storageEvent(key: string | null): Event {
    const e = new Event("storage");
    Object.defineProperty(e, "key", { value: key });
    return e;
  }

  it("fires on same-tab changes", () => {
    const cb = vi.fn();
    const off = subscribeFavourites(cb);
    toggleFavourite(alpha);
    toggleFavourite(alpha);
    expect(cb).toHaveBeenCalledTimes(2);
    off();
    toggleFavourite(beta);
    expect(cb).toHaveBeenCalledTimes(2);
  });

  it("fires on storage events for its key (other tabs), ignores other keys", () => {
    const cb = vi.fn();
    const off = subscribeFavourites(cb);
    win.dispatchEvent(storageEvent("latexci_docs"));
    expect(cb).not.toHaveBeenCalled();
    win.dispatchEvent(storageEvent(FAVOURITES_KEY));
    win.dispatchEvent(storageEvent(null)); // localStorage.clear() elsewhere
    expect(cb).toHaveBeenCalledTimes(2);
    off();
    win.dispatchEvent(storageEvent(FAVOURITES_KEY));
    expect(cb).toHaveBeenCalledTimes(2);
  });

  it("picks up a value written by another tab", () => {
    storage.setItem(FAVOURITES_KEY, JSON.stringify([beta]));
    expect(getFavourites()).toEqual([beta]);
  });

  it("is a no-op without window (server)", () => {
    vi.stubGlobal("window", undefined);
    const off = subscribeFavourites(() => {});
    expect(typeof off).toBe("function");
    off();
  });
});
