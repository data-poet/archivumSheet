import { STORAGE_KEYS } from "../shared/storageKeys.js";

const STORAGE_KEY = STORAGE_KEYS.theme;

// Returns null when the user has never chosen — callers should then fall back to
// the OS-level prefers-color-scheme preference.
export function getTheme() {
  const value = localStorage.getItem(STORAGE_KEY);
  return value === "light" || value === "dark" ? value : null;
}

export function setTheme(value) {
  localStorage.setItem(STORAGE_KEY, value);
}

// Not currently wired to any UI control, kept for potential future use.
export function clearTheme() {
  localStorage.removeItem(STORAGE_KEY);
}
