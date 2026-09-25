// Shared localStorage primitives for the character store. Extracted out of characters.js so
// that other store modules (e.g. persistence.js) can read/write the same store without
// importing characters.js itself, which assumes the sheet page's live DOM.

import { ENTRY_KINDS } from "../shared/constants.js";

export const STORAGE_KEY = "archivum_characters";

export function generateId(prefix = "c") {
  return `${prefix}-` + Date.now() + "-" + Math.random().toString(36).slice(2, 7);
}

// Entries saved before `kind` existed have none; they are all real characters.
export function kindOf(entry) {
  return entry?.kind === ENTRY_KINDS.ALLY
    ? ENTRY_KINDS.ALLY
    : ENTRY_KINDS.CHARACTER;
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
