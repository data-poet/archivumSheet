import { state } from "../../../state.js";
import {
  equipRanged,
  addStoredRanged,
  addEquippedRanged,
  moveRanged,
  removeRanged,
  findRangedByInstanceId,
  saveRangedCustomFields,
  addRangedEnchantment,
  updateRangedEnchantment,
  removeRangedEnchantment,
} from "./model.js";
import { renderEquippedRanged, renderStoredRanged } from "./render.js";
import { renderEquippedMelee, renderStoredMelee } from "../melee/render.js";
import {
  createCustomFieldsClickHandler,
  withPreservedOpenState,
} from "../shared/customFieldsDispatch.js";
import { createEnchantmentsHandlers } from "../shared/enchantments/dispatch.js";
import {
  createListRenderer,
  createDeferredRender,
} from "../shared/renderScheduling.js";
import {
  createHpInputHandler,
  updateResumeHpDisplay,
  updateActualHpDisplay,
} from "../shared/durabilityDispatch.js";
import { findLinkedCounterpart } from "../shared/dualUseWeapons.js";
import { createWeaponChangeHandler } from "../shared/weaponChangeDispatch.js";
import { createWeaponAddHandler } from "../shared/weaponAddForm.js";

const data = state.data;
const selected = state.selected;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const _renderRangedLists = createListRenderer(
  renderEquippedRanged,
  renderStoredRanged,
);

// Also re-renders melee's lists, for the equipped-ranged-move handler that mirrors
// equip/storedAt onto a linked melee instance via _linkedInstanceId.
const _renderRangedAndMeleeLists = createListRenderer(
  renderEquippedRanged,
  renderStoredRanged,
  renderEquippedMelee,
  renderStoredMelee,
);

const _deferRender = createDeferredRender(() => _renderRangedLists());

function _findLinkedMelee(rangedInstance) {
  return findLinkedCounterpart(rangedInstance, selected.melee_weapons);
}

const _handleRangedCustomFieldsClick = createCustomFieldsClickHandler({
  findByInstanceId: findRangedByInstanceId,
  saveCustomFields: withPreservedOpenState(saveRangedCustomFields),
  render: _renderRangedLists,
});

// The enchantment mutators already snapshot+restore synchronously, so runWithOpenState stays at its no-op default.
// The change-path render uses _renderRangedAndMeleeLists so a dual-use pair's linked melee enchantments list also refreshes.
const _rangedEnchantments = createEnchantmentsHandlers({
  findByInstanceId: findRangedByInstanceId,
  getItems: () => selected.ranged_weapons,
  addEnchantment: addRangedEnchantment,
  updateEnchantment: updateRangedEnchantment,
  removeEnchantment: removeRangedEnchantment,
  render: () => _renderRangedAndMeleeLists(state.sheet),
});

// ─── Click ────────────────────────────────────────────────────────────────────

export function handleRangedClick(e) {
  if (e.target.classList.contains("remove-ranged")) {
    removeRanged(e.target.dataset.instanceId);
    return true;
  }

  if (e.target.classList.contains("remove-equipped-ranged")) {
    removeRanged(e.target.dataset.instanceId);
    return true;
  }
  if (e.target.classList.contains("equip-stored-ranged")) {
    const instanceId = e.target.dataset.instanceId;
    const rangedToEquip = findRangedByInstanceId(instanceId);
    if (!rangedToEquip) return true;
    equipRanged(
      instanceId,
      rangedToEquip.weapon_id,
      rangedToEquip.material_id || "MAT-000",
    );
    return true;
  }

  // Delegated to the shared factory — see armorEvents.js for the full rationale.
  if (_handleRangedCustomFieldsClick(e)) return true;

  if (_rangedEnchantments.handleClick(e)) return true;

  return false;
}

// ─── Input ────────────────────────────────────────────────────────────────────

// Unlike melee's HP inputs (which mirror onto a linked ranged counterpart), ranged's
// do NOT mirror back onto a linked melee — only equip/storage moves do. Pre-existing
// app behavior, hence no onApplied here.
export const handleRangedInput = createHpInputHandler({
  variants: [
    {
      cssClass: "resume-ranged-hp",
      findInstance: (el) => findRangedByInstanceId(el.dataset.instanceId),
      display: updateResumeHpDisplay,
    },
    {
      cssClass: "equipped-ranged-hp",
      findInstance: (el) => findRangedByInstanceId(el.dataset.instanceId),
      display: updateActualHpDisplay,
    },
    {
      cssClass: "stored-ranged-hp",
      findInstance: (el) => findRangedByInstanceId(el.dataset.instanceId),
      display: updateActualHpDisplay,
    },
  ],
  catalog: () => data.ranged_weapons,
  catalogIdField: "weapon_id",
  baseHpField: "weapon_hit_points",
  deferRender: _deferRender,
});

// ─── Change ───────────────────────────────────────────────────────────────────

const _handleRangedWeaponChange = createWeaponChangeHandler({
  classPrefix: "ranged",
  catalog: () => data.ranged_weapons,
  findByInstanceId: findRangedByInstanceId,
  move: moveRanged,
  renderAfterMaterial: () => _renderRangedLists(),
  renderAfterMove: () => _renderRangedAndMeleeLists(),
  onMoved: (rangedInstance) => {
    const linked = _findLinkedMelee(rangedInstance);
    if (linked) {
      linked.is_equipped = rangedInstance.is_equipped;
      linked.storedAt = rangedInstance.storedAt;
    }
  },
});

export function handleRangedChange(e) {
  if (_handleRangedWeaponChange(e)) return true;

  if (_rangedEnchantments.handleChange(e)) return true;

  return false;
}

// ─── Add-form ─────────────────────────────────────────────────────────────────

export const handleAddRanged = createWeaponAddHandler({
  idPrefix: "ranged",
  catalog: () => data.ranged_weapons,
  addEquipped: addEquippedRanged,
  addStored: addStoredRanged,
});
