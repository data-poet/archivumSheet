import { state } from "../state.js";
import { renderLists } from "../ui.js";
import { triggerAutoRun } from "../engine/autorun.js";
import {
  equipRanged, addStoredRanged, addEquippedRanged, moveRanged,
  removeRanged, findRangedByInstanceId,
} from "../inventory/ranged.js";
import { clampHpModifier } from "../shared/durabilityUtils.js";
import { resolveHp } from "../shared/inventoryRenderUtils.js";
import { tableRowKeyFn, divBlockKeyFn } from "../shared/openState.js";

const data = state.data;
const selected = state.selected;

// ─── Open-state helpers ───────────────────────────────────────────────────────

function _snapshot() {
  return {
    slots:   _snap("#rangedSlots",       divBlockKeyFn("data-instance-id")),
    storage: _snap("#rangedStorageList", tableRowKeyFn("data-instance-id")),
  };
}
function _snap(sel, keyFn) {
  const open = new Set();
  document.querySelector(sel)?.querySelectorAll("details[open]").forEach((d) => {
    const k = keyFn(d); if (k) open.add(k);
  });
  return open;
}
function _restore(snap) {
  _rest("#rangedSlots",       divBlockKeyFn("data-instance-id"), snap.slots);
  _rest("#rangedStorageList", tableRowKeyFn("data-instance-id"), snap.storage);
}
function _rest(sel, keyFn, open) {
  if (!open.size) return;
  document.querySelector(sel)?.querySelectorAll("details").forEach((d) => {
    const k = keyFn(d); if (k && open.has(k)) d.setAttribute("open", "");
  });
}
function _renderAll() {
  const snap = _snapshot(); renderLists(selected, data); _restore(snap);
}

let _deferTimer = null;
function _deferRender() {
  const snap = _snapshot();
  clearTimeout(_deferTimer);
  _deferTimer = setTimeout(() => { renderLists(selected, data); _restore(snap); }, 300);
}

function _updateActualHpDisplay(inputEl, maxHp, modifier) {
  const block = inputEl.closest(".hp-modifier");
  if (!block) return;
  const strongs = block.querySelectorAll("strong");
  if (strongs.length >= 2) strongs[1].textContent = maxHp + (modifier || 0);
}

// ─── Click ────────────────────────────────────────────────────────────────────

export function handleRangedClick(e) {
  if (e.target.classList.contains("remove-ranged")) {
    removeRanged(e.target.dataset.instanceId); return true;
  }
  if (e.target.classList.contains("equip-stored-ranged")) {
    const instanceId = e.target.dataset.instanceId;
    const rangedToEquip = findRangedByInstanceId(instanceId);
    if (!rangedToEquip) return true;
    equipRanged(instanceId, rangedToEquip.weapon_id, rangedToEquip.material_id || "MAT-000");
    return true;
  }
  return false;
}

// ─── Input ────────────────────────────────────────────────────────────────────

export function handleRangedInput(e) {
  if (e.target.classList.contains("equipped-ranged-hp")) {
    const instanceId = e.target.dataset.instanceId;
    const rangedInstance = findRangedByInstanceId(instanceId);
    if (!rangedInstance) return true;
    if (/^-$/.test(e.target.value)) return true; // allow '-' mid-type
    const weaponData = data.ranged_weapons.find((w) => w.weapon_id === rangedInstance.weapon_id);
    const { maxHp } = resolveHp(rangedInstance, weaponData?.weapon_hit_points ?? 0, data.materials);
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
    const weaponData = data.ranged_weapons.find((w) => w.weapon_id === rangedInstance.weapon_id);
    const { maxHp } = resolveHp(rangedInstance, weaponData?.weapon_hit_points ?? 0, data.materials);
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
    const availableWeapons = data.ranged_weapons.filter((w) => w.weapon_name === name);
    const firstWeapon = availableWeapons[0];
    if (!firstWeapon) return true;
    const tierSelect = document.querySelector(`.equipped-ranged-tier[data-instance-id="${instanceId}"]`);
    if (tierSelect) {
      tierSelect.innerHTML = availableWeapons
        .map((w) => `<option value="${w.weapon_tier}">${w.weapon_tier}</option>`).join("");
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
    const nameEl = document.querySelector(`.equipped-ranged-name[data-instance-id="${instanceId}"]`);
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
    _renderAll();
    triggerAutoRun();
    return true;
  }

  if (e.target.classList.contains("ranged-storage-select")) {
    moveRanged(e.target.dataset.instanceId, e.target.value); return true;
  }

  if (e.target.classList.contains("equipped-ranged-move")) {
    const instanceId = e.target.dataset.instanceId;
    const destination = e.target.value;
    const rangedInstance = findRangedByInstanceId(instanceId);
    if (!rangedInstance) return true;
    if (!destination) { rangedInstance.is_equipped = true; rangedInstance.storedAt = null; }
    else { rangedInstance.is_equipped = false; rangedInstance.storedAt = destination; }
    _renderAll();
    triggerAutoRun();
    return true;
  }

  return false;
}

// ─── Add-form ─────────────────────────────────────────────────────────────────

export function handleAddRanged() {
  const nameEl     = document.getElementById("rangedNameSelect");
  const tierEl     = document.getElementById("rangedTierSelect");
  const materialEl = document.getElementById("rangedMaterialSelect");
  const storageEl  = document.getElementById("rangedStorage");
  if (!nameEl || !tierEl || !materialEl || !storageEl) return;
  const ranged = data.ranged_weapons.find(
    (w) => w.weapon_name === nameEl.value && w.weapon_tier === tierEl.value,
  );
  if (!ranged) return;
  const material = data.materials.find((m) => m.material_name === materialEl.value);
  const materialId = material?.material_id ?? null;
  if (storageEl.value === "equipped") addEquippedRanged(ranged.weapon_id, materialId);
  else addStoredRanged(ranged.weapon_id, materialId, storageEl.value);
}
