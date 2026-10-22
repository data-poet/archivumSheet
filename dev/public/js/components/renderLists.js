import {
  renderAdvantages,
  renderDisadvantages,
} from "../engine/character/traits/render.js";
import { renderMetaRaces } from "../engine/character/metaRaces/render.js";
import { renderSkills } from "../engine/character/skills/render.js";
import { renderSpells } from "../engine/magic/spells/render.js";
import {
  renderArmorSlots,
  renderStoredArmors,
} from "../engine/inventory/armor/render.js";
import {
  renderEquippedShield,
  renderStoredShields,
} from "../engine/inventory/shield/render.js";
import {
  renderEquippedMelee,
  renderStoredMelee,
} from "../engine/inventory/melee/render.js";
import {
  renderEquippedRanged,
  renderStoredRanged,
} from "../engine/inventory/ranged/render.js";
import {
  renderEquippedFirearms,
  renderStoredFirearms,
} from "../engine/inventory/firearms/render.js";
import {
  renderAmmoContainers,
  renderLooseAmmo,
} from "../engine/inventory/ammo/render.js";
import { renderAlchemy } from "../engine/inventory/alchemy/render.js";
import { renderSurvivalGear } from "../engine/inventory/survivalGear/render.js";
import {
  renderEquippedAccessories,
  renderStoredAccessories,
} from "../engine/inventory/accessories/render.js";
import {
  renderEquippedMagicGear,
  renderStoredMagicGear,
} from "../engine/inventory/magicGear/render.js";
import { renderCustomInventory } from "../engine/inventory/customInventory/render.js";
import { renderCoinPurse } from "../engine/inventory/coinPurse/render.js";
import { fireInventoryRendered } from "../shared/renderSignal.js";

export function renderLists(selected, data, sheet) {
  renderMetaRaces(selected, data, sheet);
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
  fireInventoryRendered();
}

// Every list renderLists() calls now writes through morphHTML (shared/morph.js), which
// preserves open <details>/card-expand/scroll state on its own — renderListsPreserving used to
// snapshot/restore that state around a full sweep, but there's nothing left for it to do.
// Kept as its own name (not inlined at each call site) only because every caller already
// imports it by this name.
export function renderListsPreserving(selected, data, sheet) {
  renderLists(selected, data, sheet);
}
