/**
 * Saved documents, kept in this browser (localStorage). Replaces the old
 * cloud storage: nothing leaves the device, and share links carry the source
 * in the URL fragment instead.
 */
export type LocalDoc = {
  id: string;
  title: string;
  content: string;
  updatedAt: string; // ISO
  pinned?: boolean;
};

const KEY = "latexci_docs";

export function listDocs(): LocalDoc[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    if (!Array.isArray(raw)) return [];
    return (raw as LocalDoc[])
      .filter((d) => d && typeof d.id === "string" && typeof d.content === "string")
      .sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned) || b.updatedAt.localeCompare(a.updatedAt));
  } catch {
    return [];
  }
}

function write(docs: LocalDoc[]): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(docs));
    return true;
  } catch {
    return false; // quota exceeded or storage blocked
  }
}

export function getDoc(id: string): LocalDoc | null {
  return listDocs().find((d) => d.id === id) ?? null;
}

export function titleFrom(source: string): string {
  return source.match(/\\title\{([^}]*)\}/)?.[1]?.trim() || "Untitled";
}

export function createDoc(content: string): LocalDoc | null {
  const doc: LocalDoc = {
    id: crypto.randomUUID().slice(0, 8),
    title: titleFrom(content),
    content,
    updatedAt: new Date().toISOString(),
  };
  return write([doc, ...listDocs()]) ? doc : null;
}

export function updateDoc(id: string, patch: Partial<Omit<LocalDoc, "id">>): boolean {
  const docs = listDocs();
  const i = docs.findIndex((d) => d.id === id);
  if (i < 0) return false;
  docs[i] = { ...docs[i], ...patch, updatedAt: patch.content !== undefined ? new Date().toISOString() : docs[i].updatedAt };
  return write(docs);
}

export function deleteDoc(id: string): boolean {
  return write(listDocs().filter((d) => d.id !== id));
}

export function clearAllDocs(): void {
  try {
    localStorage.removeItem(KEY);
    localStorage.removeItem("latexci_source");
  } catch { /* storage blocked */ }
}
