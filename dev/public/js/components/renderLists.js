import {
  renderAdvantages,
  renderDisadvantages,
} from "../engine/character/traits/render.js";
import { renderSkills } from "../engine/character/skills/render.js";
import { renderSpells } from "../engine/magic/spells/render.js";
import { renderArmorSlots, renderStoredArmors } from "../engine/inventory/armor/render.js";
import { renderEquippedShield, renderStoredShields } from "../engine/inventory/shield/render.js";
import { renderEquippedMelee, renderStoredMelee } from "../engine/inventory/melee/render.js";
import { renderEquippedRanged, renderStoredRanged } from "../engine/inventory/ranged/render.js";
import { renderEquippedFirearms, renderStoredFirearms } from "../engine/inventory/firearms/render.js";
import { renderAmmoContainers, renderLooseAmmo } from "../engine/inventory/ammo/render.js";
import { renderAlchemy } from "../engine/inventory/alchemy/render.js";
import { renderSurvivalGear } from "../engine/inventory/survivalGear/render.js";
import { renderEquippedAccessories, renderStoredAccessories } from "../engine/inventory/accessories/render.js";
import { renderEquippedMagicGear, renderStoredMagicGear } from "../engine/inventory/magicGear/render.js";
import { renderCustomInventory } from "../engine/inventory/customInventory/render.js";
import { renderCoinPurse } from "../engine/inventory/coinPurse/render.js";
import { snapshotAll, restoreAll } from "../shared/openState.js";

export function renderLists(selected, data, sheet) {
  renderAdvantages(selected, data, sheet);
  renderDisadvantages(selected, data, sheet);
  renderSkills(selected, data, sheet);
  renderSpells(selected, data, sheet);
  renderArmorSlots(selected, data, sheet);
  renderStoredArmors(selected, data, sheet);
  renderEquippedShield(selected, data, sheet);
  renderStoredShields(selected, data, sheet);
  renderEquippedMelee(selected, data, sheet);
  renderStoredMelee(selected, data, sheet);
  renderEquippedRanged(selected, data, sheet);
  renderStoredRanged(selected, data, sheet);
  renderEquippedFirearms(selected, data, sheet);
  renderStoredFirearms(selected, data, sheet);
  renderAmmoContainers(selected, data, sheet);
  renderLooseAmmo(selected, data, sheet);
  renderAlchemy(selected, data, sheet);
  renderSurvivalGear(selected, data, sheet);
  renderEquippedAccessories(selected, data, sheet);
  renderStoredAccessories(selected, data, sheet);
  renderEquippedMagicGear(selected, data, sheet);
  renderStoredMagicGear(selected, data, sheet);
  renderCoinPurse(selected, data, sheet);
  renderCustomInventory(selected, data, sheet);
}

// renderLists() innerHTMLs every managed section, collapsing all open <details> and scroll
// positions app-wide; this snapshots/restores open state around it. Use instead of renderLists()
// everywhere except call sites that already re-render only their own narrow DOM slice.
export function renderListsPreserving(selected, data, sheet) {
  const snapshots = snapshotAll();
  renderLists(selected, data, sheet);
  restoreAll(snapshots);
}
