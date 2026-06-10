/**
 * tabState.js
 *
 * Module-level store for the active tab per section.
 * Intentionally NOT persisted — tabs reset to their default on page load.
 * Tab state is pure view concern; it has no meaning to the engine or persistence layers.
 *
 * Usage:
 *   import { getActiveTab, setActiveTab } from "../store/tabState.js";
 *   const active = getActiveTab("section-traits"); // → "tab-advantages" | null
 *   setActiveTab("section-traits", "tab-disadvantages");
 */

/** @type {Record<string, string>} sectionId → active tabId */
const _active = {};

/**
 * Returns the currently active tab id for a section, or null if none set.
 * @param {string} sectionId
 * @returns {string|null}
 */
export function getActiveTab(sectionId) {
  return _active[sectionId] ?? null;
}

/**
 * Records the active tab id for a section.
 * @param {string} sectionId
 * @param {string} tabId
 */
export function setActiveTab(sectionId, tabId) {
  _active[sectionId] = tabId;
}
