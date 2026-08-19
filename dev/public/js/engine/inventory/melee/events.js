import { state } from "../../../state.js";
import { triggerAutoRun } from "../../../compute/autorun.js";
import {
  equipMelee, addStoredMelee, addEquippedMelee, moveMelee,
  removeMelee, findMeleeByInstanceId, saveMeleeCustomFields,
} from "./model.js";
import { clampHpModifier } from "../shared/durabilityUtils.js";
import { resolveHp } from "../shared/inventoryRenderUtils.js";
import { renderEquippedMelee, renderStoredMelee } from "./render.js";
import { renderEquippedRanged, renderStoredRanged } from "../ranged/render.js";
import { snapshotAll, restoreAll } from "../../../shared/openState.js";
import {
  openCustomFieldsEditor,
  closeCustomFieldsEditor,
  readCustomFieldsEditorValues,
} from "../../../shared/renderUtils.js";

const data = state.data;
const selected = state.selected;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Re-renders ONLY the melee lists (equipped slots + storage), not a full
 * renderLists() sweep of all 21 sections — same reasoning/shape as
 * shield's _renderShieldLists. Use for melee-only changes (name/tier,
 * material, custom fields).
 */
function _renderMeleeLists(sheet) {
  const snapshots = snapshotAll();

  requestAnimationFrame(() => {
    renderEquippedMelee(selected, data, sheet);
    renderStoredMelee(selected, data, sheet);
    restoreAll(snapshots);
  });
}

/**
 * Same as _renderMeleeLists but also re-renders ranged's lists.
 *
 * Melee/ranged dual-use weapons are synced via _linkedInstanceId (see
 * moveMelee/equipMelee's counterparts in inventory/melee.js): mutating a
 * melee instance's HP modifier or equipped/storedAt location mirrors that
 * change onto its linked ranged instance, if any. Rendering only melee's
 * own containers would leave the ranged section showing stale HP/location
 * for the linked entry. Used by every handler below that touches the
 * linked-ranged mirror, regardless of whether a link actually exists for
 * the instance in question (cheap to render ranged even when it's a
 * no-op — simpler and safer than threading a "was anything linked"
 * condition through every call site).
 */
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

/**
 * 300ms-debounced render for HP-modifier inputs. All three HP-modifier
 * inputs mirror to the linked ranged counterpart, so this always uses the
 * melee+ranged variant.
 */
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

// ─── Click ────────────────────────────────────────────────────────────────────

export function handleMeleeClick(e) {
  if (e.target.classList.contains("remove-melee")) {
    removeMelee(e.target.dataset.instanceId); return true;
  }

  if (e.target.classList.contains("remove-equipped-melee")) {
    removeMelee(e.target.dataset.instanceId); return true;
  }
  if (e.target.classList.contains("equip-stored-melee")) {
    const instanceId = e.target.dataset.instanceId;
    const meleeToEquip = findMeleeByInstanceId(instanceId);
    if (!meleeToEquip) return true;
    equipMelee(instanceId, meleeToEquip.weapon_id, meleeToEquip.material_id || "MAT-000");
    return true;
  }

  // ── Custom fields: edit / save / cancel ───────────────────────────────────
  // Generic buttons rendered by customFieldsBlock; only acted on here if the
  // instanceId actually belongs to a melee weapon — lets other equipment
  // types safely reuse the same button classes without collisions.

  if (e.target.classList.contains("custom-fields-edit-btn")) {
    const instanceId = e.target.dataset.instanceId;
    if (!findMeleeByInstanceId(instanceId)) return false;
    openCustomFieldsEditor(instanceId);
    _renderMeleeLists();
    return true;
  }

  if (e.target.classList.contains("custom-fields-cancel-btn")) {
    const instanceId = e.target.dataset.instanceId;
    if (!findMeleeByInstanceId(instanceId)) return false;
    closeCustomFieldsEditor(instanceId);
    _renderMeleeLists();
    return true;
  }

  if (e.target.classList.contains("custom-fields-save-btn")) {
    const instanceId = e.target.dataset.instanceId;
    if (!findMeleeByInstanceId(instanceId)) return false;
    const values = readCustomFieldsEditorValues(instanceId);
    closeCustomFieldsEditor(instanceId);
    if (values) {
      // saveMeleeCustomFields mutates + calls its own renderListsPreserving()
      // internally (unwrapped call site) — snapshot right before it and
      // restore right after it returns, same pattern as shieldEvents.js's
      // equivalent branch.
      const snapshots = snapshotAll();
      saveMeleeCustomFields(instanceId, values);
      restoreAll(snapshots);
    } else {
      _renderMeleeLists();
    }
    return true;
  }

  return false;
}

// ─── Input ────────────────────────────────────────────────────────────────────

export function handleMeleeInput(e) {
  if (e.target.classList.contains("resume-melee-hp")) {
    const instanceId    = e.target.dataset.instanceId;
    const meleeInstance = findMeleeByInstanceId(instanceId);
    if (!meleeInstance) return true;
    if (/^-$/.test(e.target.value)) return true;
    const weaponData = data.melee_weapons.find((w) => w.weapon_id === meleeInstance.weapon_id);
    const { maxHp }  = resolveHp(meleeInstance, weaponData?.weapon_hit_points ?? 0, data.materials);
    meleeInstance.hit_points_modifier = clampHpModifier(e.target.value, maxHp);
    _updateResumeHpDisplay(e.target, maxHp, meleeInstance.hit_points_modifier);
    // Mirror HP modifier to ranged counterpart (bidirectional lookup).
    const linkedRanged =
      state.selected.ranged_weapons?.find((r) => r._linkedInstanceId === instanceId) ??
      (meleeInstance._linkedInstanceId
        ? state.selected.ranged_weapons?.find((r) => r._instanceId === meleeInstance._linkedInstanceId)
        : null);
    if (linkedRanged) linkedRanged.hit_points_modifier = meleeInstance.hit_points_modifier;
    _deferRender();
    triggerAutoRun();
    return true;
  }

  if (e.target.classList.contains("equipped-melee-hp")) {
    const instanceId = e.target.dataset.instanceId;
    const meleeInstance = findMeleeByInstanceId(instanceId);
    if (!meleeInstance) return true;
    if (/^-$/.test(e.target.value)) return true; // allow '-' mid-type
    const weaponData = data.melee_weapons.find((w) => w.weapon_id === meleeInstance.weapon_id);
    const { maxHp } = resolveHp(meleeInstance, weaponData?.weapon_hit_points ?? 0, data.materials);
    meleeInstance.hit_points_modifier = clampHpModifier(e.target.value, maxHp);
    _updateActualHpDisplay(e.target, maxHp, meleeInstance.hit_points_modifier);
    // Mirror HP modifier to ranged counterpart (bidirectional lookup).
    const linkedRanged =
      state.selected.ranged_weapons?.find((r) => r._linkedInstanceId === instanceId) ??
      (meleeInstance._linkedInstanceId
        ? state.selected.ranged_weapons?.find((r) => r._instanceId === meleeInstance._linkedInstanceId)
        : null);
    if (linkedRanged) linkedRanged.hit_points_modifier = meleeInstance.hit_points_modifier;
    _deferRender();
    triggerAutoRun();
    return true;
  }

  if (e.target.classList.contains("stored-melee-hp")) {
    const instanceId = e.target.dataset.instanceId;
    const meleeInstance = findMeleeByInstanceId(instanceId);
    if (!meleeInstance) return true;
    if (/^-$/.test(e.target.value)) return true; // allow '-' mid-type
    const weaponData = data.melee_weapons.find((w) => w.weapon_id === meleeInstance.weapon_id);
    const { maxHp } = resolveHp(meleeInstance, weaponData?.weapon_hit_points ?? 0, data.materials);
    meleeInstance.hit_points_modifier = clampHpModifier(e.target.value, maxHp);
    _updateActualHpDisplay(e.target, maxHp, meleeInstance.hit_points_modifier);
    // Mirror HP modifier to ranged counterpart (bidirectional lookup).
    const linkedRanged =
      state.selected.ranged_weapons?.find((r) => r._linkedInstanceId === instanceId) ??
      (meleeInstance._linkedInstanceId
        ? state.selected.ranged_weapons?.find((r) => r._instanceId === meleeInstance._linkedInstanceId)
        : null);
    if (linkedRanged) linkedRanged.hit_points_modifier = meleeInstance.hit_points_modifier;
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
    const availableWeapons = data.melee_weapons.filter((w) => w.weapon_name === name);
    const firstWeapon = availableWeapons[0];
    if (!firstWeapon) return true;
    const tierSelect = document.querySelector(`.equipped-melee-tier[data-instance-id="${instanceId}"]`);
    if (tierSelect) {
      tierSelect.innerHTML = availableWeapons
        .map((w) => `<option value="${w.weapon_tier}">${w.weapon_tier}</option>`).join("");
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
    const nameEl = document.querySelector(`.equipped-melee-name[data-instance-id="${instanceId}"]`);
    if (!nameEl) return true;
    const weapon = data.melee_weapons.find((w) => w.weapon_name === nameEl.value && w.weapon_tier === tier);
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
    moveMelee(e.target.dataset.instanceId, e.target.value); return true;
  }

  if (e.target.classList.contains("equipped-melee-move")) {
    const instanceId = e.target.dataset.instanceId;
    const destination = e.target.value;
    const meleeInstance = findMeleeByInstanceId(instanceId);
    if (!meleeInstance) return true;
    if (!destination) { meleeInstance.is_equipped = true; meleeInstance.storedAt = null; }
    else { meleeInstance.is_equipped = false; meleeInstance.storedAt = destination; }
    // Mirror to ranged counterpart (bidirectional: ranged may point at us, or we may point at ranged).
    const linked =
      state.selected.ranged_weapons?.find((r) => r._linkedInstanceId === instanceId) ??
      (meleeInstance._linkedInstanceId
        ? state.selected.ranged_weapons?.find((r) => r._instanceId === meleeInstance._linkedInstanceId)
        : null);
    if (linked) {
      linked.is_equipped = meleeInstance.is_equipped;
      linked.storedAt = meleeInstance.storedAt;
    }
    _renderMeleeAndRangedLists();
    triggerAutoRun();
    return true;
  }

  return false;
}

// ─── Add-form ─────────────────────────────────────────────────────────────────

export function handleAddMelee() {
  const nameEl     = document.getElementById("meleeNameSelect");
  const tierEl     = document.getElementById("meleeTierSelect");
  const materialEl = document.getElementById("meleeMaterialSelect");
  const storageEl  = document.getElementById("meleeStorage");
  if (!nameEl || !tierEl || !materialEl || !storageEl) return;
  const melee = data.melee_weapons.find(
    (w) => w.weapon_name === nameEl.value && w.weapon_tier === tierEl.value,
  );
  if (!melee) return;
  const material = data.materials.find((m) => m.material_name === materialEl.value);
  const materialId = material?.material_id ?? null;
  if (storageEl.value === "equipped") addEquippedMelee(melee.weapon_id, materialId);
  else addStoredMelee(melee.weapon_id, materialId, storageEl.value);
}
