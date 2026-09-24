// Shared localStorage primitives for the character store. Extracted out of characters.js so that
// allies-page code can read/write the same store without importing characters.js itself — the
// allies import graph is guarded (tests/dev/allies/catalogBuild.test.js) against ever reaching
// compute/* or store/characters.js, since both are built around the sheet page's single live DOM.

export const STORAGE_KEY = "archivum_characters";

export function generateId(prefix = "c") {
  return `${prefix}-` + Date.now() + "-" + Math.random().toString(36).slice(2, 7);
}

export function loadStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return null;
}

export function saveStore(store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (err) {
    console.error("[characterStoreCore] localStorage write failed:", err);
  }
}

// Raw reads/writes only — no store-initialization fallback. Callers that need a guaranteed store
// (the sheet page, on first run) go through characters.js's getStore() instead.
export function getActiveCharacterId() {
  return loadStore()?.activeId ?? null;
}

export function setActiveCharacterId(id) {
  const store = loadStore();
  if (!store) return;
  store.activeId = id;
  saveStore(store);
}
