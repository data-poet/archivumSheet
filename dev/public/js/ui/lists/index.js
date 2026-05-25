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
export function renderLists(selected, data) {
  renderAdvantages(selected);
  renderDisadvantages(selected);
  renderSkills(selected);
  renderSpells(selected);
  renderArmorSlots(selected, data);
  renderStoredArmors(selected, data);
  renderEquippedShield(selected, data);
  renderStoredShields(selected, data);
  renderEquippedMelee(selected, data);
  renderStoredMelee(selected, data);
  renderEquippedRanged(selected, data);
  renderStoredRanged(selected, data);
}
