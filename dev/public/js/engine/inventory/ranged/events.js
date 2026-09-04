import { state } from "../../../state.js";
import { triggerAutoRun } from "../../../compute/autorun.js";
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
import { clampHpModifier } from "../shared/durabilityUtils.js";
import { resolveHp } from "../shared/inventoryRenderUtils.js";
import { renderEquippedRanged, renderStoredRanged } from "./render.js";
import { renderEquippedMelee, renderStoredMelee } from "../melee/render.js";
import { snapshotAll, restoreAll } from "../../../shared/openState.js";
import { createCustomFieldsClickHandler } from "../shared/customFieldsDispatch.js";
import { createEnchantmentsHandlers } from "../shared/enchantments/dispatch.js";

const data = state.data;
const selected = state.selected;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Re-renders ONLY the ranged lists (equipped slots + storage), not a full
 * renderLists() sweep of all 21 sections — same reasoning/shape as
 * shield's _renderShieldLists.
 *
 * NOTE: ranged's HP-modifier inputs do NOT mirror to a linked melee
 * counterpart (unlike melee's HP-modifier inputs, which do mirror to
 * ranged — see meleeEvents.js). Only equip/storage moves mirror
 * bidirectionally, which is what _renderRangedAndMeleeLists below is for.
 * This asymmetry is pre-existing app behavior, not something introduced
 * by this narrowing pass.
 */
function _renderRangedLists(sheet) {
  const snapshots = snapshotAll();

  requestAnimationFrame(() => {
    renderEquippedRanged(selected, data, sheet);
    renderStoredRanged(selected, data, sheet);
    restoreAll(snapshots);
  });
}

/**
 * Same as _renderRangedLists but also re-renders melee's lists, for the
 * one handler below (equipped-ranged-move) that mirrors equip/storedAt
 * onto a linked melee instance via _linkedInstanceId.
 */
function _renderRangedAndMeleeLists(sheet) {
  const snapshots = snapshotAll();

  requestAnimationFrame(() => {
    renderEquippedRanged(selected, data, sheet);
    renderStoredRanged(selected, data, sheet);
    renderEquippedMelee(selected, data, sheet);
    renderStoredMelee(selected, data, sheet);
    restoreAll(snapshots);
  });
}

let _deferTimer = null;
function _deferRender() {
  clearTimeout(_deferTimer);
  _deferTimer = setTimeout(() => {
    _renderRangedLists();
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

/**
 * saveRangedCustomFields mutates + calls its own renderListsPreserving()
 * internally (unwrapped) — snapshot right before it and restore right
 * after it returns, matching this file's pre-factory behavior.
 */
function _saveRangedCustomFieldsWrapped(instanceId, values) {
  const snapshots = snapshotAll();
  saveRangedCustomFields(instanceId, values);
  restoreAll(snapshots);
}

const _handleRangedCustomFieldsClick = createCustomFieldsClickHandler({
  findByInstanceId: findRangedByInstanceId,
  saveCustomFields: _saveRangedCustomFieldsWrapped,
  render: _renderRangedLists, // already self-wraps via snapshotAll/restoreAll above
});

/**
 * Click-path mutators (addRangedEnchantment/update/remove) already
 * self-wrap render+snapshot/restore synchronously, so runWithOpenState is
 * left at its no-op default. The change-path render is explicit and uses
 * _renderRangedAndMeleeLists (not the ranged-only _renderRangedLists) so a
 * dual-use pair's linked melee enchantments list also refreshes on
 * cascading-filter changes — same reasoning as melee/events.js's
 * _meleeEnchantments wiring.
 */
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

  // ── Custom fields: edit / save / cancel ───────────────────────────────────
  // Delegated to the shared factory — see armorEvents.js's usage for the
  // full rationale.

  if (_handleRangedCustomFieldsClick(e)) return true;

  if (_rangedEnchantments.handleClick(e)) return true;

  return false;
}

// ─── Input ────────────────────────────────────────────────────────────────────

export function handleRangedInput(e) {
  if (e.target.classList.contains("resume-ranged-hp")) {
    const instanceId = e.target.dataset.instanceId;
    const rangedInstance = findRangedByInstanceId(instanceId);
    if (!rangedInstance) return true;
    if (/^-$/.test(e.target.value)) return true;
    const weaponData = data.ranged_weapons.find(
      (w) => w.weapon_id === rangedInstance.weapon_id,
    );
    const { maxHp } = resolveHp(
      rangedInstance,
      weaponData?.weapon_hit_points ?? 0,
      data.materials,
    );
    rangedInstance.hit_points_modifier = clampHpModifier(e.target.value, maxHp);
    _updateResumeHpDisplay(e.target, maxHp, rangedInstance.hit_points_modifier);
    _deferRender();
    triggerAutoRun();
    return true;
  }

  if (e.target.classList.contains("equipped-ranged-hp")) {
    const instanceId = e.target.dataset.instanceId;
    const rangedInstance = findRangedByInstanceId(instanceId);
    if (!rangedInstance) return true;
    if (/^-$/.test(e.target.value)) return true; // allow '-' mid-type
    const weaponData = data.ranged_weapons.find(
      (w) => w.weapon_id === rangedInstance.weapon_id,
    );
    const { maxHp } = resolveHp(
      rangedInstance,
      weaponData?.weapon_hit_points ?? 0,
      data.materials,
    );
    rangedInstance.hit_points_modifier = clampHpModifier(e.target.value, maxHp);
    _updateActualHpDisplay(e.target, maxHp, rangedInstance.hit_points_modifier);
    _deferRender();
    triggerAutoRun();
    return true;
  }

  if (e.target.classList.contains("stored-ranged-hp")) {
    const instanceId = e.target.dataset.instanceId;
    const rangedInstance = findRangedByInstanceId(instanceId);
    if (!rangedInstance) return true;
    if (/^-$/.test(e.target.value)) return true; // allow '-' mid-type
    const weaponData = data.ranged_weapons.find(
      (w) => w.weapon_id === rangedInstance.weapon_id,
    );
    const { maxHp } = resolveHp(
      rangedInstance,
      weaponData?.weapon_hit_points ?? 0,
      data.materials,
    );
    rangedInstance.hit_points_modifier = clampHpModifier(e.target.value, maxHp);
    _updateActualHpDisplay(e.target, maxHp, rangedInstance.hit_points_modifier);
    _deferRender();
    triggerAutoRun();
    return true;
  }

  return false;
}

// ─── Change ───────────────────────────────────────────────────────────────────

export function handleRangedChange(e) {
  if (e.target.classList.contains("equipped-ranged-name")) {
    const instanceId = e.target.dataset.instanceId;
    const name = e.target.value;
    const rangedInstance = findRangedByInstanceId(instanceId);
    if (!rangedInstance) return true;
    const availableWeapons = data.ranged_weapons.filter(
      (w) => w.weapon_name === name,
    );
    const firstWeapon = availableWeapons[0];
    if (!firstWeapon) return true;
    const tierSelect = document.querySelector(
      `.equipped-ranged-tier[data-instance-id="${instanceId}"]`,
    );
    if (tierSelect) {
      tierSelect.innerHTML = availableWeapons
        .map(
          (w) => `<option value="${w.weapon_tier}">${w.weapon_tier}</option>`,
        )
        .join("");
    }
    rangedInstance.weapon_id = firstWeapon.weapon_id;
    rangedInstance.hit_points_modifier = 0;
    triggerAutoRun();
    return true;
  }

  if (e.target.classList.contains("equipped-ranged-tier")) {
    const instanceId = e.target.dataset.instanceId;
    const tier = e.target.value;
    const rangedInstance = findRangedByInstanceId(instanceId);
    if (!rangedInstance) return true;
    const nameEl = document.querySelector(
      `.equipped-ranged-name[data-instance-id="${instanceId}"]`,
    );
    if (!nameEl) return true;
    const weapon = data.ranged_weapons.find(
      (w) => w.weapon_name === nameEl.value && w.weapon_tier === tier,
    );
    if (!weapon) return true;
    rangedInstance.weapon_id = weapon.weapon_id;
    rangedInstance.hit_points_modifier = 0;
    triggerAutoRun();
    return true;
  }

  if (e.target.classList.contains("equipped-ranged-material")) {
    const instanceId = e.target.dataset.instanceId;
    const rangedInstance = findRangedByInstanceId(instanceId);
    if (!rangedInstance) return true;
    rangedInstance.material_id = e.target.value;
    rangedInstance.hit_points_modifier = 0;
    _renderRangedLists();
    triggerAutoRun();
    return true;
  }

  if (e.target.classList.contains("ranged-storage-select")) {
    moveRanged(e.target.dataset.instanceId, e.target.value);
    return true;
  }

  if (e.target.classList.contains("equipped-ranged-move")) {
    const instanceId = e.target.dataset.instanceId;
    const destination = e.target.value;
    const rangedInstance = findRangedByInstanceId(instanceId);
    if (!rangedInstance) return true;
    if (!destination) {
      rangedInstance.is_equipped = true;
      rangedInstance.storedAt = null;
    } else {
      rangedInstance.is_equipped = false;
      rangedInstance.storedAt = destination;
    }
    // Mirror to melee counterpart (bidirectional: melee may point at us, or we may point at melee).
    const linked =
      state.selected.melee_weapons?.find(
        (m) => m._linkedInstanceId === instanceId,
      ) ??
      (rangedInstance._linkedInstanceId
        ? state.selected.melee_weapons?.find(
            (m) => m._instanceId === rangedInstance._linkedInstanceId,
          )
        : null);
    if (linked) {
      linked.is_equipped = rangedInstance.is_equipped;
      linked.storedAt = rangedInstance.storedAt;
    }
    _renderRangedAndMeleeLists();
    triggerAutoRun();
    return true;
  }

  if (_rangedEnchantments.handleChange(e)) return true;

  return false;
}

// ─── Add-form ─────────────────────────────────────────────────────────────────

export function handleAddRanged() {
  const nameEl = document.getElementById("rangedNameSelect");
  const tierEl = document.getElementById("rangedTierSelect");
  const materialEl = document.getElementById("rangedMaterialSelect");
  const storageEl = document.getElementById("rangedStorage");
  if (!nameEl || !tierEl || !materialEl || !storageEl) return;
  const ranged = data.ranged_weapons.find(
    (w) => w.weapon_name === nameEl.value && w.weapon_tier === tierEl.value,
  );
  if (!ranged) return;
  const material = data.materials.find(
    (m) => m.material_name === materialEl.value,
  );
  const materialId = material?.material_id ?? null;
  if (storageEl.value === "equipped")
    addEquippedRanged(ranged.weapon_id, materialId);
  else addStoredRanged(ranged.weapon_id, materialId, storageEl.value);
}
