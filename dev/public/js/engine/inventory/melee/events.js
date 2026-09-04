import { state } from "../../../state.js";
import { triggerAutoRun } from "../../../compute/autorun.js";
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
import { clampHpModifier } from "../shared/durabilityUtils.js";
import { resolveHp } from "../shared/inventoryRenderUtils.js";
import { renderEquippedMelee, renderStoredMelee } from "./render.js";
import { renderEquippedRanged, renderStoredRanged } from "../ranged/render.js";
import { snapshotAll, restoreAll } from "../../../shared/openState.js";
import { createCustomFieldsClickHandler } from "../shared/customFieldsDispatch.js";
import { createEnchantmentsHandlers } from "../shared/enchantments/dispatch.js";

const data = state.data;
const selected = state.selected;

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Re-renders only melee lists, not the full renderLists() sweep — same shape as shield's _renderShieldLists.
function _renderMeleeLists(sheet) {
  const snapshots = snapshotAll();

  requestAnimationFrame(() => {
    renderEquippedMelee(selected, data, sheet);
    renderStoredMelee(selected, data, sheet);
    restoreAll(snapshots);
  });
}

// Same as _renderMeleeLists but also re-renders ranged's lists, since dual-use pairs mirror HP/equip/storage
// via _linkedInstanceId and a melee-only render would leave the linked ranged entry showing stale data.
// Always renders ranged too, even with no link — cheaper than threading a "was anything linked" check everywhere.
function _renderMeleeAndRangedLists(sheet) {
  const snapshots = snapshotAll();

  requestAnimationFrame(() => {
    renderEquippedMelee(selected, data, sheet);
    renderStoredMelee(selected, data, sheet);
    renderEquippedRanged(selected, data, sheet);
    renderStoredRanged(selected, data, sheet);
    restoreAll(snapshots);
  });
}

// HP-modifier inputs mirror to the linked ranged counterpart, so this always uses the melee+ranged variant.
let _deferTimer = null;
function _deferRender() {
  clearTimeout(_deferTimer);
  _deferTimer = setTimeout(() => {
    _renderMeleeAndRangedLists();
  }, 300);
}

function _updateResumeHpDisplay(inputEl, maxHp, modifier) {
  const cell = inputEl.closest("td");
  if (!cell) return;
  const actual = cell.querySelector(".resume-hp-actual");
  if (actual) actual.textContent = maxHp + (modifier || 0);
}

function _updateActualHpDisplay(inputEl, maxHp, modifier) {
  const block = inputEl.closest(".hp-modifier");
  if (!block) return;
  const strongs = block.querySelectorAll("strong");
  if (strongs.length >= 2) strongs[1].textContent = maxHp + (modifier || 0);
}

// saveMeleeCustomFields renders internally (unwrapped); snapshot/restore around it here.
function _saveMeleeCustomFieldsWrapped(instanceId, values) {
  const snapshots = snapshotAll();
  saveMeleeCustomFields(instanceId, values);
  restoreAll(snapshots);
}

const _handleMeleeCustomFieldsClick = createCustomFieldsClickHandler({
  findByInstanceId: findMeleeByInstanceId,
  saveCustomFields: _saveMeleeCustomFieldsWrapped,
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

export function handleMeleeInput(e) {
  if (e.target.classList.contains("resume-melee-hp")) {
    const instanceId = e.target.dataset.instanceId;
    const meleeInstance = findMeleeByInstanceId(instanceId);
    if (!meleeInstance) return true;
    if (/^-$/.test(e.target.value)) return true;
    const weaponData = data.melee_weapons.find(
      (w) => w.weapon_id === meleeInstance.weapon_id,
    );
    const { maxHp } = resolveHp(
      meleeInstance,
      weaponData?.weapon_hit_points ?? 0,
      data.materials,
    );
    meleeInstance.hit_points_modifier = clampHpModifier(e.target.value, maxHp);
    _updateResumeHpDisplay(e.target, maxHp, meleeInstance.hit_points_modifier);
    // Mirror HP modifier to ranged counterpart (bidirectional lookup).
    const linkedRanged =
      state.selected.ranged_weapons?.find(
        (r) => r._linkedInstanceId === instanceId,
      ) ??
      (meleeInstance._linkedInstanceId
        ? state.selected.ranged_weapons?.find(
            (r) => r._instanceId === meleeInstance._linkedInstanceId,
          )
        : null);
    if (linkedRanged)
      linkedRanged.hit_points_modifier = meleeInstance.hit_points_modifier;
    _deferRender();
    triggerAutoRun();
    return true;
  }

  if (e.target.classList.contains("equipped-melee-hp")) {
    const instanceId = e.target.dataset.instanceId;
    const meleeInstance = findMeleeByInstanceId(instanceId);
    if (!meleeInstance) return true;
    if (/^-$/.test(e.target.value)) return true; // allow '-' mid-type
    const weaponData = data.melee_weapons.find(
      (w) => w.weapon_id === meleeInstance.weapon_id,
    );
    const { maxHp } = resolveHp(
      meleeInstance,
      weaponData?.weapon_hit_points ?? 0,
      data.materials,
    );
    meleeInstance.hit_points_modifier = clampHpModifier(e.target.value, maxHp);
    _updateActualHpDisplay(e.target, maxHp, meleeInstance.hit_points_modifier);
    // Mirror HP modifier to ranged counterpart (bidirectional lookup).
    const linkedRanged =
      state.selected.ranged_weapons?.find(
        (r) => r._linkedInstanceId === instanceId,
      ) ??
      (meleeInstance._linkedInstanceId
        ? state.selected.ranged_weapons?.find(
            (r) => r._instanceId === meleeInstance._linkedInstanceId,
          )
        : null);
    if (linkedRanged)
      linkedRanged.hit_points_modifier = meleeInstance.hit_points_modifier;
    _deferRender();
    triggerAutoRun();
    return true;
  }

  if (e.target.classList.contains("stored-melee-hp")) {
    const instanceId = e.target.dataset.instanceId;
    const meleeInstance = findMeleeByInstanceId(instanceId);
    if (!meleeInstance) return true;
    if (/^-$/.test(e.target.value)) return true; // allow '-' mid-type
    const weaponData = data.melee_weapons.find(
      (w) => w.weapon_id === meleeInstance.weapon_id,
    );
    const { maxHp } = resolveHp(
      meleeInstance,
      weaponData?.weapon_hit_points ?? 0,
      data.materials,
    );
    meleeInstance.hit_points_modifier = clampHpModifier(e.target.value, maxHp);
    _updateActualHpDisplay(e.target, maxHp, meleeInstance.hit_points_modifier);
    // Mirror HP modifier to ranged counterpart (bidirectional lookup).
    const linkedRanged =
      state.selected.ranged_weapons?.find(
        (r) => r._linkedInstanceId === instanceId,
      ) ??
      (meleeInstance._linkedInstanceId
        ? state.selected.ranged_weapons?.find(
            (r) => r._instanceId === meleeInstance._linkedInstanceId,
          )
        : null);
    if (linkedRanged)
      linkedRanged.hit_points_modifier = meleeInstance.hit_points_modifier;
    _deferRender();
    triggerAutoRun();
    return true;
  }

  return false;
}

// ─── Change ───────────────────────────────────────────────────────────────────

export function handleMeleeChange(e) {
  if (e.target.classList.contains("equipped-melee-name")) {
    const instanceId = e.target.dataset.instanceId;
    const name = e.target.value;
    const meleeInstance = findMeleeByInstanceId(instanceId);
    if (!meleeInstance) return true;
    const availableWeapons = data.melee_weapons.filter(
      (w) => w.weapon_name === name,
    );
    const firstWeapon = availableWeapons[0];
    if (!firstWeapon) return true;
    const tierSelect = document.querySelector(
      `.equipped-melee-tier[data-instance-id="${instanceId}"]`,
    );
    if (tierSelect) {
      tierSelect.innerHTML = availableWeapons
        .map(
          (w) => `<option value="${w.weapon_tier}">${w.weapon_tier}</option>`,
        )
        .join("");
    }
    meleeInstance.weapon_id = firstWeapon.weapon_id;
    meleeInstance.hit_points_modifier = 0;
    triggerAutoRun();
    return true;
  }

  if (e.target.classList.contains("equipped-melee-tier")) {
    const instanceId = e.target.dataset.instanceId;
    const tier = e.target.value;
    const meleeInstance = findMeleeByInstanceId(instanceId);
    if (!meleeInstance) return true;
    const nameEl = document.querySelector(
      `.equipped-melee-name[data-instance-id="${instanceId}"]`,
    );
    if (!nameEl) return true;
    const weapon = data.melee_weapons.find(
      (w) => w.weapon_name === nameEl.value && w.weapon_tier === tier,
    );
    if (!weapon) return true;
    meleeInstance.weapon_id = weapon.weapon_id;
    meleeInstance.hit_points_modifier = 0;
    triggerAutoRun();
    return true;
  }

  if (e.target.classList.contains("equipped-melee-material")) {
    const instanceId = e.target.dataset.instanceId;
    const meleeInstance = findMeleeByInstanceId(instanceId);
    if (!meleeInstance) return true;
    meleeInstance.material_id = e.target.value;
    meleeInstance.hit_points_modifier = 0;
    _renderMeleeLists();
    triggerAutoRun();
    return true;
  }

  if (e.target.classList.contains("melee-storage-select")) {
    moveMelee(e.target.dataset.instanceId, e.target.value);
    return true;
  }

  if (e.target.classList.contains("equipped-melee-move")) {
    const instanceId = e.target.dataset.instanceId;
    const destination = e.target.value;
    const meleeInstance = findMeleeByInstanceId(instanceId);
    if (!meleeInstance) return true;
    if (!destination) {
      meleeInstance.is_equipped = true;
      meleeInstance.storedAt = null;
    } else {
      meleeInstance.is_equipped = false;
      meleeInstance.storedAt = destination;
    }
    // Mirror to ranged counterpart (bidirectional: ranged may point at us, or we may point at ranged).
    const linked =
      state.selected.ranged_weapons?.find(
        (r) => r._linkedInstanceId === instanceId,
      ) ??
      (meleeInstance._linkedInstanceId
        ? state.selected.ranged_weapons?.find(
            (r) => r._instanceId === meleeInstance._linkedInstanceId,
          )
        : null);
    if (linked) {
      linked.is_equipped = meleeInstance.is_equipped;
      linked.storedAt = meleeInstance.storedAt;
    }
    _renderMeleeAndRangedLists();
    triggerAutoRun();
    return true;
  }

  // Delegated to the shared factory — see the click section above for the ownership-guard rationale.
  if (_meleeEnchantments.handleChange(e)) return true;

  return false;
}

// ─── Add-form ─────────────────────────────────────────────────────────────────

export function handleAddMelee() {
  const nameEl = document.getElementById("meleeNameSelect");
  const tierEl = document.getElementById("meleeTierSelect");
  const materialEl = document.getElementById("meleeMaterialSelect");
  const storageEl = document.getElementById("meleeStorage");
  if (!nameEl || !tierEl || !materialEl || !storageEl) return;
  const melee = data.melee_weapons.find(
    (w) => w.weapon_name === nameEl.value && w.weapon_tier === tierEl.value,
  );
  if (!melee) return;
  const material = data.materials.find(
    (m) => m.material_name === materialEl.value,
  );
  const materialId = material?.material_id ?? null;
  if (storageEl.value === "equipped")
    addEquippedMelee(melee.weapon_id, materialId);
  else addStoredMelee(melee.weapon_id, materialId, storageEl.value);
}
