/**
 * viewModeState.js
 *
 * Persisted store for the current app mode: edit (false) or view (true).
 * Stored in localStorage so the chosen mode survives page reloads.
 *
 * Usage:
 *   import { isViewMode, setViewMode } from "../store/viewModeState.js";
 *   if (isViewMode()) { ... }
 *   setViewMode(true);
 */

const STORAGE_KEY = "archivum:viewMode";

/**
 * Returns true when the app is in view mode (📃), false for edit mode (📝).
 * @returns {boolean}
 */
export function isViewMode() {
  return localStorage.getItem(STORAGE_KEY) === "true";
}

/**
 * Persists the current mode.
 * @param {boolean} value
 */
export function setViewMode(value) {
  localStorage.setItem(STORAGE_KEY, String(value));
}
