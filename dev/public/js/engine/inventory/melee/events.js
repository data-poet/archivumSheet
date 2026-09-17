import { state } from "../../../state.js";
import {
  equipMelee,
  addStoredMelee,
  addEquippedMelee,
  moveMelee,
  removeMelee,
  findMeleeByInstanceId,
  saveMeleeCustomFields,
  addMeleeEnchantment,
  updateMeleeEnchantment,
  removeMeleeEnchantment,
} from "./model.js";
import { renderEquippedMelee, renderStoredMelee } from "./render.js";
import { renderEquippedRanged, renderStoredRanged } from "../ranged/render.js";
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

const _renderMeleeLists = createListRenderer(
  renderEquippedMelee,
  renderStoredMelee,
);

// Dual-use pairs mirror HP/equip/storage via _linkedInstanceId, so a melee-only
// render would leave the linked ranged entry showing stale data. Always renders
// ranged too, even with no link — cheaper than threading a "was anything linked"
// check through every call site.
const _renderMeleeAndRangedLists = createListRenderer(
  renderEquippedMelee,
  renderStoredMelee,
  renderEquippedRanged,
  renderStoredRanged,
);

// HP-modifier inputs mirror to the linked ranged counterpart, so this always uses the melee+ranged variant.
const _deferRender = createDeferredRender(() => _renderMeleeAndRangedLists());

function _findLinkedRanged(meleeInstance) {
  return findLinkedCounterpart(meleeInstance, selected.ranged_weapons);
}

const _handleMeleeCustomFieldsClick = createCustomFieldsClickHandler({
  findByInstanceId: findMeleeByInstanceId,
  saveCustomFields: withPreservedOpenState(saveMeleeCustomFields),
  render: _renderMeleeLists,
});

// The enchantment mutators already snapshot+restore synchronously, so runWithOpenState stays at its no-op default.
// The change-path render uses _renderMeleeAndRangedLists since a dual-use pair's ranged mirror also needs refreshing.
const _meleeEnchantments = createEnchantmentsHandlers({
  findByInstanceId: findMeleeByInstanceId,
  getItems: () => selected.melee_weapons,
  addEnchantment: addMeleeEnchantment,
  updateEnchantment: updateMeleeEnchantment,
  removeEnchantment: removeMeleeEnchantment,
  render: () => _renderMeleeAndRangedLists(state.sheet),
});

// ─── Click ────────────────────────────────────────────────────────────────────

export function handleMeleeClick(e) {
  if (e.target.classList.contains("remove-melee")) {
    removeMelee(e.target.dataset.instanceId);
    return true;
  }

  if (e.target.classList.contains("remove-equipped-melee")) {
    removeMelee(e.target.dataset.instanceId);
    return true;
  }
  if (e.target.classList.contains("equip-stored-melee")) {
    const instanceId = e.target.dataset.instanceId;
    const meleeToEquip = findMeleeByInstanceId(instanceId);
    if (!meleeToEquip) return true;
    equipMelee(
      instanceId,
      meleeToEquip.weapon_id,
      meleeToEquip.material_id || "MAT-000",
    );
    return true;
  }

  // Delegated to the shared factory — see armorEvents.js for the full rationale.
  if (_handleMeleeCustomFieldsClick(e)) return true;

  // Delegated to the shared factory, which ownership-checks the instanceId the same way as the custom-fields factory above.
  if (_meleeEnchantments.handleClick(e)) return true;

  return false;
}

// ─── Input ────────────────────────────────────────────────────────────────────

// A dual-use pair is one physical weapon, so damage taken on the melee side shows
// up on the ranged side too. (Ranged's own HP inputs do NOT mirror back — only
// equip/storage moves do, which is pre-existing app behavior.)
function _mirrorHpToLinkedRanged(meleeInstance) {
  const linked = _findLinkedRanged(meleeInstance);
  if (linked) linked.hit_points_modifier = meleeInstance.hit_points_modifier;
}

export const handleMeleeInput = createHpInputHandler({
  variants: [
    {
      cssClass: "resume-melee-hp",
      findInstance: (el) => findMeleeByInstanceId(el.dataset.instanceId),
      display: updateResumeHpDisplay,
    },
    {
      cssClass: "equipped-melee-hp",
      findInstance: (el) => findMeleeByInstanceId(el.dataset.instanceId),
      display: updateActualHpDisplay,
    },
    {
      cssClass: "stored-melee-hp",
      findInstance: (el) => findMeleeByInstanceId(el.dataset.instanceId),
      display: updateActualHpDisplay,
    },
  ],
  catalog: () => data.melee_weapons,
  catalogIdField: "weapon_id",
  baseHpField: "weapon_hit_points",
  deferRender: _deferRender,
  onApplied: _mirrorHpToLinkedRanged,
});

// ─── Change ───────────────────────────────────────────────────────────────────

const _handleMeleeWeaponChange = createWeaponChangeHandler({
  classPrefix: "melee",
  catalog: () => data.melee_weapons,
  findByInstanceId: findMeleeByInstanceId,
  move: moveMelee,
  renderAfterMaterial: () => _renderMeleeLists(),
  renderAfterMove: () => _renderMeleeAndRangedLists(),
  onMoved: (meleeInstance) => {
    const linked = _findLinkedRanged(meleeInstance);
    if (linked) {
      linked.is_equipped = meleeInstance.is_equipped;
      linked.storedAt = meleeInstance.storedAt;
    }
  },
});

export function handleMeleeChange(e) {
  if (_handleMeleeWeaponChange(e)) return true;

  // Delegated to the shared factory — see the click section above for the ownership-guard rationale.
  if (_meleeEnchantments.handleChange(e)) return true;

  return false;
}

// ─── Add-form ─────────────────────────────────────────────────────────────────

export const handleAddMelee = createWeaponAddHandler({
  idPrefix: "melee",
  catalog: () => data.melee_weapons,
  addEquipped: addEquippedMelee,
  addStored: addStoredMelee,
});
