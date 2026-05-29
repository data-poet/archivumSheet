import {
  renderAdvantages,
  renderDisadvantages,
  renderSkills,
  renderSpells,
} from "./renderTraits.js";
import { renderArmorSlots, renderStoredArmors } from "./renderArmor.js";
import { renderEquippedShield, renderStoredShields } from "./renderShield.js";
import { renderEquippedMelee, renderStoredMelee } from "./renderMelee.js";
import { renderEquippedRanged, renderStoredRanged } from "./renderRanged.js";

/**
 * Re-render all list UI sections.
 * Called whenever selected state changes.
 *
 * @param {Object} selected - state.selected
 * @param {Object} data     - state.data
 */
export function renderLists(selected, data, sheet) {
  renderAdvantages(selected, data);
  renderDisadvantages(selected, data);
  renderSkills(selected, data);
  renderSpells(selected, data);
  renderArmorSlots(selected, data, sheet);
  renderStoredArmors(selected, data, sheet);
  renderEquippedShield(selected, data, sheet);
  renderStoredShields(selected, data, sheet);
  renderEquippedMelee(selected, data, sheet);
  renderStoredMelee(selected, data, sheet);
  renderEquippedRanged(selected, data, sheet);
  renderStoredRanged(selected, data, sheet);
}
