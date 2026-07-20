/**
 * themeState.js
 *
 * Persisted store for the user's manual light/dark theme choice.
 * Stored in localStorage so the choice survives page reloads and future
 * visits. When the user has never chosen, this store has nothing to say —
 * callers should fall back to the OS-level preference
 * (`prefers-color-scheme`) instead.
 *
 * Usage:
 *   import { getTheme, setTheme, clearTheme } from "../store/themeState.js";
 *   const stored = getTheme(); // "light" | "dark" | null
 *   setTheme("dark");
 *   clearTheme(); // go back to following system preference
 */

const STORAGE_KEY = "archivum:theme";

/**
 * Returns the user's manually-selected theme, or null if they've never
 * chosen one (in which case the system preference should be used).
 * @returns {"light"|"dark"|null}
 */
export function getTheme() {
  const value = localStorage.getItem(STORAGE_KEY);
  return value === "light" || value === "dark" ? value : null;
}

/**
 * Persists the user's manual theme choice.
 * @param {"light"|"dark"} value
 */
export function setTheme(value) {
  localStorage.setItem(STORAGE_KEY, value);
}

/**
 * Clears the manual choice, reverting future visits to system preference.
 * (Not currently wired to any UI control, kept for potential future use.)
 */
export function clearTheme() {
  localStorage.removeItem(STORAGE_KEY);
}
