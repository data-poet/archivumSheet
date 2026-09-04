import { t } from "../../../localization/pt-BR/index.js";
import { STORAGE_LOCATIONS } from "../../../shared/constants.js";

export function storageOptions(currentLocation) {
  return STORAGE_LOCATIONS.map(
    (loc) =>
      `<option value="${loc}" ${currentLocation === loc ? "selected" : ""}>
        ${t(`storage.${loc}`)}
      </option>`,
  ).join("");
}

// The "Equipped" option has value="" and represents the equipped state.
export function equippedMoveSelect(cssClass, dataAttrs = "") {
  return `
    <select class="${cssClass}" ${dataAttrs}>
      <option value="">${t("storage.equipped")}</option>
      ${STORAGE_LOCATIONS.map(
        (loc) => `<option value="${loc}">${t(`storage.${loc}`)}</option>`,
      ).join("")}
    </select>
  `;
}

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

export function tierOptions(tiers, selectedTier) {
  if (!tiers.length) return `<option value="">-</option>`;
  return tiers
    .map(
      (tier) =>
        `<option value="${tier}" ${tier === selectedTier ? "selected" : ""}>${tier}</option>`,
    )
    .join("");
}
