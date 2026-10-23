// Shared localStorage primitives for the character store, for modules (e.g. persistence.js) that must not
// import characters.js, which assumes the sheet page's live DOM.

import { ENTRY_KINDS } from "../shared/constants.js";
import { STORAGE_KEYS } from "../shared/storageKeys.js";
import { showToast } from "../shared/toast.js";
import { t } from "../localization/pt-BR/index.js";

export function generateId(prefix = "c") {
  return (
    `${prefix}-` + Date.now() + "-" + Math.random().toString(36).slice(2, 7)
  );
}

// Entries saved before `kind` existed have none; they are all real characters.
export function kindOf(entry) {
  return entry?.kind === ENTRY_KINDS.ALLY
    ? ENTRY_KINDS.ALLY
    : ENTRY_KINDS.CHARACTER;
}

export function loadStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.characters);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return null;
}

export function saveStore(store) {
  try {
    localStorage.setItem(STORAGE_KEYS.characters, JSON.stringify(store));
  } catch (err) {
    console.error("[characterStoreCore] localStorage write failed:", err);
    showToast(t("characters.saveFailed"), "error");
  }
}
