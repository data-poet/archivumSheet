import { state } from "../state.js";
import { renderLists } from "../ui.js";
import { triggerAutoRun } from "../engine/autorun.js";
import {
  equipRanged,
  addStoredRanged,
  addEquippedRanged,
  moveRanged,
  removeRanged,
  findRangedByInstanceId,
} from "../inventory/ranged.js";
import { clampHpModifier } from "../shared/durabilityUtils.js";
import { resolveHp } from "../shared/inventoryRenderUtils.js";

const data = state.data;
const selected = state.selected;

// ─── Click ────────────────────────────────────────────────────────────────────

export function handleRangedClick(e) {
  if (e.target.classList.contains("remove-ranged")) {
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

  return false;
}

// ─── Input ────────────────────────────────────────────────────────────────────

export function handleRangedInput(e) {
  if (e.target.classList.contains("equipped-ranged-hp")) {
    const instanceId = e.target.dataset.instanceId;
    const rangedInstance = findRangedByInstanceId(instanceId);
    if (!rangedInstance) return true;

    const weaponData = data.ranged_weapons.find(
      (w) => w.weapon_id === rangedInstance.weapon_id,
    );
    const { maxHp } = resolveHp(
      rangedInstance,
      weaponData?.weapon_hit_points ?? 0,
      data.materials,
    );

    rangedInstance.hit_points_modifier = clampHpModifier(e.target.value, maxHp);

    renderLists(selected, data);
    triggerAutoRun();
    return true;
  }

  if (e.target.classList.contains("stored-ranged-hp")) {
    const instanceId = e.target.dataset.instanceId;
    const rangedInstance = findRangedByInstanceId(instanceId);
    if (!rangedInstance) return true;

    const weaponData = data.ranged_weapons.find(
      (w) => w.weapon_id === rangedInstance.weapon_id,
    );
    const { maxHp } = resolveHp(
      rangedInstance,
      weaponData?.weapon_hit_points ?? 0,
      data.materials,
    );

    rangedInstance.hit_points_modifier = clampHpModifier(e.target.value, maxHp);

    renderLists(selected, data);
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

    // Patch tier select in-place — no full re-render
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

    // Mutate state only
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

    // Mutate state only
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

    // Material change recalculates max HP — full re-render is correct here
    renderLists(selected, data);
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

    renderLists(selected, data);
    triggerAutoRun();
    return true;
  }

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

  if (storageEl.value === "equipped") {
    addEquippedRanged(ranged.weapon_id, materialId);
  } else {
    addStoredRanged(ranged.weapon_id, materialId, storageEl.value);
  }
}
