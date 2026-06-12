import {
  renderAdvantages,
  renderDisadvantages,
} from "./renderTraits.js";
import { renderSkills, renderSpells } from "./renderSkills.js";
import { renderArmorSlots, renderStoredArmors } from "./renderArmor.js";
import { renderEquippedShield, renderStoredShields } from "./renderShield.js";
import { renderEquippedMelee, renderStoredMelee } from "./renderMelee.js";
import { renderEquippedRanged, renderStoredRanged } from "./renderRanged.js";
import { renderAmmoContainers, renderLooseAmmo } from "./renderAmmo.js";
import { renderAlchemy } from "./renderAlchemy.js";
import { renderSurvivalGear } from "./renderSurvivalGear.js";
import { renderCustomInventory } from "./renderCustomInventory.js";
import { renderCoinPurse } from "./renderCoinPurse.js";

/**
 * Re-render all list UI sections.
 * Called whenever selected state changes.
 *
 * @param {Object} selected - state.selected
 * @param {Object} data     - state.data
 */
export function renderLists(selected, data, sheet) {
  renderAdvantages(selected, data, sheet);
  renderDisadvantages(selected, data, sheet);
  renderSkills(selected, data, sheet);
  renderSpells(selected, data);
  renderArmorSlots(selected, data, sheet);
  renderStoredArmors(selected, data, sheet);
  renderEquippedShield(selected, data, sheet);
  renderStoredShields(selected, data, sheet);
  renderEquippedMelee(selected, data, sheet);
  renderStoredMelee(selected, data, sheet);
  renderEquippedRanged(selected, data, sheet);
  renderStoredRanged(selected, data, sheet);
  renderAmmoContainers(selected, data, sheet);
  renderLooseAmmo(selected, data, sheet);
  renderAlchemy(selected, data, sheet);
  renderSurvivalGear(selected, data, sheet);
  renderCoinPurse(selected, data, sheet);
  renderCustomInventory(selected, data, sheet);
}
