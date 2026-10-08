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
  sendRangedToAlly,
} from "./model.js";
import { renderEquippedRanged, renderStoredRanged } from "./render.js";
import { renderEquippedMelee, renderStoredMelee } from "../melee/render.js";
import {
  createCustomFieldsClickHandler,
  withPreservedOpenState,
} from "../shared/customFieldsDispatch.js";
import { createEnchantmentsHandlers } from "../shared/enchantments/dispatch.js";
import { createSendToAllyHandler } from "../shared/sendToAllyControl.js";
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

// Also re-renders melee's lists: the equipped-ranged-move handler mirrors equip/storedAt
// onto a linked melee instance via _linkedInstanceId, and HP-modifier inputs mirror too.
const _renderRangedAndMeleeLists = createListRenderer(
  renderEquippedRanged,
  renderStoredRanged,
  renderEquippedMelee,
  renderStoredMelee,
);

// HP-modifier inputs mirror to the linked melee counterpart, so this always uses the ranged+melee variant.
const _deferRender = createDeferredRender(() => _renderRangedAndMeleeLists());

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

const _handleSendRangedToAllyClick = createSendToAllyHandler({
  sendFn: sendRangedToAlly,
  render: _renderRangedAndMeleeLists,
  canHandle: (instanceId) => selected.ranged_weapons.some((r) => r.id === instanceId),
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

  if (_handleSendRangedToAllyClick(e)) return true;

  return false;
}

// ─── Input ────────────────────────────────────────────────────────────────────

// A dual-use pair is one physical weapon, so damage taken on the ranged side shows
// up on the melee side too — mirrors melee/events.js's _mirrorHpToLinkedRanged.
function _mirrorHpToLinkedMelee(rangedInstance) {
  const linked = _findLinkedMelee(rangedInstance);
  if (linked) linked.hit_points_modifier = rangedInstance.hit_points_modifier;
}

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
  onApplied: _mirrorHpToLinkedMelee,
});

// ─── Change ───────────────────────────────────────────────────────────────────

const _handleRangedWeaponChange = createWeaponChangeHandler({
  classPrefix: "ranged",
  catalog: () => data.ranged_weapons,
  findByInstanceId: findRangedByInstanceId,
  move: moveRanged,
  renderAfterMaterial: () => _renderRangedAndMeleeLists(),
  renderAfterMove: () => _renderRangedAndMeleeLists(),
  onMoved: (rangedInstance) => {
    const linked = _findLinkedMelee(rangedInstance);
    if (linked) {
      linked.is_equipped = rangedInstance.is_equipped;
      linked.storedAt = rangedInstance.storedAt;
    }
  },
  onMaterialChanged: (rangedInstance) => {
    const linked = _findLinkedMelee(rangedInstance);
    if (linked) {
      linked.material_id = rangedInstance.material_id;
      linked.hit_points_modifier = 0;
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
