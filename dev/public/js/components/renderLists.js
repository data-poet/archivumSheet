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

/**
 * Universal safety wrapper around renderLists().
 *
 * renderLists() is a full-page destructive re-render (innerHTML on all 21
 * managed sections). Calling it bare from anywhere on the page collapses
 * every open <details> panel and resets every .table-wrapper scroll
 * position everywhere, not just in whatever section triggered the render.
 *
 * This wrapper snapshots ALL managed containers (via snapshotAll(), see
 * shared/openState.js) immediately before the render and restores them
 * immediately after, synchronously — no new async behavior, no deferral.
 * Callers that already need a requestAnimationFrame defer (e.g. because
 * they're firing from a native <select> "change" handler) still own that
 * defer themselves and should call this wrapper from inside it, same as
 * they would have called renderLists() directly.
 *
 * Use this instead of renderLists() at every call site. A handful of
 * call sites (e.g. armorEvents.js, accessoriesEvents.js) re-render only
 * their own narrow slice of the DOM via dedicated render<Type>Slots /
 * renderStored<Type> functions instead of calling renderLists() at all —
 * those are unaffected by and don't need this wrapper.
 *
 * @param {Object} selected - state.selected
 * @param {Object} data     - state.data
 * @param {Object} [sheet]  - state.sheet
 */
export function renderListsPreserving(selected, data, sheet) {
  const snapshots = snapshotAll();
  renderLists(selected, data, sheet);
  restoreAll(snapshots);
}
