/**
 * sectionCollapseState.js
 *
 * Module-level store for the collapsed/expanded state of each section box.
 * Intentionally NOT persisted — sections start collapsed on every page load,
 * then preserve their state for the rest of the session.
 *
 * Usage:
 *   import { isCollapsed, setCollapsed } from "../store/sectionCollapseState.js";
 *   const collapsed = isCollapsed("section-traits"); // → true | false
 *   setCollapsed("section-traits", true);
 */

/** @type {Record<string, boolean>} sectionId → collapsed */
const _state = {};

/**
 * Returns whether a section is currently collapsed.
 * Sections that have never been toggled return true (start closed).
 * @param {string} sectionId
 * @returns {boolean}
 */
export function isCollapsed(sectionId) {
  return _state[sectionId] ?? true;
}

/**
 * Records the collapsed state for a section.
 * @param {string} sectionId
 * @param {boolean} collapsed
 */
export function setCollapsed(sectionId, collapsed) {
  _state[sectionId] = collapsed;
}
