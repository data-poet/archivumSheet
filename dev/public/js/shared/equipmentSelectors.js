import { STORAGE_LOCATIONS } from "./constants.js";

/**
 * Build an HTML <option> string for each storage location.
 *
 * @param {string|null} currentLocation - The currently selected storedAt value.
 * @returns {string} HTML string of <option> elements.
 */
export function storageOptions(currentLocation) {
  return STORAGE_LOCATIONS.map(
    (loc) =>
      `<option value="${loc}" ${currentLocation === loc ? "selected" : ""}>
        ${loc.charAt(0).toUpperCase() + loc.slice(1)}
      </option>`,
  ).join("");
}

/**
 * Build a "move equipped item" <select> HTML.
 * The "Equipped" option has value="" and represents the equipped state.
 *
 * @param {string} cssClass  - CSS class for the select element.
 * @param {string} dataAttrs - Extra data-* attribute string, e.g. data-slot="Tronco".
 * @returns {string}
 */
export function equippedMoveSelect(cssClass, dataAttrs = "") {
  return `
    <select class="${cssClass}" ${dataAttrs}>
      <option value="">Equipped</option>
      ${STORAGE_LOCATIONS.map(
        (loc) =>
          `<option value="${loc}">${loc.charAt(0).toUpperCase() + loc.slice(1)}</option>`,
      ).join("")}
    </select>
  `;
}

/**
 * Build material <option> elements for a <select>.
 *
 * @param {Array}       materials        - Full materials array from state.data.
 * @param {string|null} selectedMaterialId
 * @returns {string}
 */
export function materialOptions(materials, selectedMaterialId) {
  return materials
    .map(
      (m) =>
        `<option value="${m.material_id}" ${
          m.material_id === selectedMaterialId ? "selected" : ""
        }>${m.material_name}</option>`,
    )
    .join("");
}

/**
 * Build tier <option> elements for a <select>.
 *
 * @param {string[]} tiers
 * @param {string|null} selectedTier
 * @returns {string}
 */
export function tierOptions(tiers, selectedTier) {
  if (!tiers.length) return `<option value="">-</option>`;
  return tiers
    .map(
      (t) =>
        `<option value="${t}" ${t === selectedTier ? "selected" : ""}>${t}</option>`,
    )
    .join("");
}
