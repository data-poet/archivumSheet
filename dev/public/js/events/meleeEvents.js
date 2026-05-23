import { state } from "../state.js";
import { renderLists } from "../ui.js";
import { triggerAutoRun } from "../engine/autorun.js";
import {
  equipMelee,
  addStoredMelee,
  addEquippedMelee,
  moveMelee,
  removeMelee,
  findMeleeByInstanceId,
} from "../inventory/melee.js";
import { clampHpModifier } from "../shared/durabilityUtils.js";
import { resolveHp } from "../shared/inventoryRenderUtils.js";

const data = state.data;
const selected = state.selected;

// ─── Click ────────────────────────────────────────────────────────────────────

export function handleMeleeClick(e) {
  if (e.target.classList.contains("remove-melee")) {
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

  return false;
}

// ─── Input ────────────────────────────────────────────────────────────────────

export function handleMeleeInput(e) {
  if (e.target.classList.contains("equipped-melee-hp")) {
    const instanceId = e.target.dataset.instanceId;
    const meleeInstance = findMeleeByInstanceId(instanceId);
    if (!meleeInstance) return true;

    const weaponData = data.melee_weapons.find(
      (w) => w.weapon_id === meleeInstance.weapon_id,
    );
    const { maxHp } = resolveHp(
      meleeInstance,
      weaponData?.weapon_hit_points ?? 0,
      data.materials,
    );

    meleeInstance.hit_points_modifier = clampHpModifier(e.target.value, maxHp);
    triggerAutoRun(); // state updated — output recalculates; DOM left untouched
    return true;
  }

  if (e.target.classList.contains("stored-melee-hp")) {
    const instanceId = e.target.dataset.instanceId;
    const meleeInstance = findMeleeByInstanceId(instanceId);
    if (!meleeInstance) return true;

    const weaponData = data.melee_weapons.find(
      (w) => w.weapon_id === meleeInstance.weapon_id,
    );
    const { maxHp } = resolveHp(
      meleeInstance,
      weaponData?.weapon_hit_points ?? 0,
      data.materials,
    );

    meleeInstance.hit_points_modifier = clampHpModifier(e.target.value, maxHp);
    triggerAutoRun(); // state updated — output recalculates; DOM left untouched
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

    // Patch tier select in-place — no full re-render
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

    // Mutate state only
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

    // Mutate state only
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

    // Material change recalculates max HP — full re-render is correct here
    renderLists(selected, data);
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

    renderLists(selected, data);
    triggerAutoRun();
    return true;
  }

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

  if (storageEl.value === "equipped") {
    addEquippedMelee(melee.weapon_id, materialId);
  } else {
    addStoredMelee(melee.weapon_id, materialId, storageEl.value);
  }
}
