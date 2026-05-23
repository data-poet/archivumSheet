import { state } from "../state.js";
import { renderLists } from "../ui.js";
import { triggerAutoRun } from "../engine/autorun.js";
import {
  equipShield,
  addStoredShield,
  moveShield,
  removeShield,
  findShieldByInstanceId,
} from "../inventory/shield.js";
import { clampHpModifier } from "../shared/durabilityUtils.js";
import { resolveHp } from "../shared/inventoryRenderUtils.js";

const data = state.data;
const selected = state.selected;

// ─── Click ────────────────────────────────────────────────────────────────────

export function handleShieldClick(e) {
  if (e.target.classList.contains("remove-shield")) {
    removeShield(e.target.dataset.instanceId);
    return true;
  }

  if (e.target.classList.contains("equip-stored-shield")) {
    const instanceId = e.target.dataset.instanceId;
    const shieldToEquip = findShieldByInstanceId(instanceId);
    if (!shieldToEquip) return true;

    selected.shields.forEach((inst) => {
      if (!inst.is_equipped) return;
      inst.is_equipped = false;
      inst.storedAt = "backpack";
    });

    shieldToEquip.is_equipped = true;
    shieldToEquip.storedAt = null;

    renderLists(selected, data);
    triggerAutoRun();
    return true;
  }

  return false;
}

// ─── Input ────────────────────────────────────────────────────────────────────

export function handleShieldInput(e) {
  if (e.target.classList.contains("equipped-shield-hp")) {
    const equippedShield = selected.shields.find((s) => s.is_equipped);
    if (!equippedShield) return true;

    const shieldData = data.shields.find(
      (s) => s.shield_id === equippedShield.shield_id,
    );
    const { maxHp } = resolveHp(
      equippedShield,
      shieldData?.shield_hit_points ?? 0,
      data.materials,
    );

    equippedShield.hit_points_modifier = clampHpModifier(e.target.value, maxHp);
    triggerAutoRun(); // state updated — output recalculates; DOM left untouched
    return true;
  }

  if (e.target.classList.contains("stored-shield-hp")) {
    const instanceId = e.target.dataset.instanceId;
    const shieldInstance = findShieldByInstanceId(instanceId);
    if (!shieldInstance) return true;

    const shieldData = data.shields.find(
      (s) => s.shield_id === shieldInstance.shield_id,
    );
    const { maxHp } = resolveHp(
      shieldInstance,
      shieldData?.shield_hit_points ?? 0,
      data.materials,
    );

    shieldInstance.hit_points_modifier = clampHpModifier(e.target.value, maxHp);
    triggerAutoRun(); // state updated — output recalculates; DOM left untouched
    return true;
  }

  return false;
}

// ─── Change ───────────────────────────────────────────────────────────────────

export function handleShieldChange(e) {
  if (e.target.classList.contains("equipped-shield-name")) {
    const name = e.target.value;

    if (!name) {
      equipShield(""); // clears + calls renderLists intentionally (slot is empty)
      return true;
    }

    const availableShields = data.shields.filter((s) => s.shield_name === name);
    const firstShield = availableShields[0];
    if (!firstShield) return true;

    // Patch tier select in-place — no full re-render
    const tierSelect = document.querySelector(".equipped-shield-tier");
    if (tierSelect) {
      tierSelect.innerHTML = availableShields
        .map(
          (s) => `<option value="${s.shield_tier}">${s.shield_tier}</option>`,
        )
        .join("");
    }

    // Mutate state only
    const equippedInstance = selected.shields.find((s) => s.is_equipped);
    if (equippedInstance) {
      equippedInstance.shield_id = firstShield.shield_id;
      equippedInstance.hit_points_modifier = 0;
    } else {
      equipShield(firstShield.shield_id, "MAT-000");
      return true;
    }

    triggerAutoRun();
    return true;
  }

  if (e.target.classList.contains("equipped-shield-tier")) {
    const tier = e.target.value;
    const nameEl = document.querySelector(".equipped-shield-name");
    if (!nameEl) return true;

    const shield = data.shields.find(
      (s) => s.shield_name === nameEl.value && s.shield_tier === tier,
    );
    if (!shield) return true;

    // Mutate state only
    const equippedInstance = selected.shields.find((s) => s.is_equipped);
    if (equippedInstance) {
      equippedInstance.shield_id = shield.shield_id;
      equippedInstance.hit_points_modifier = 0;
    } else {
      equipShield(shield.shield_id, "MAT-000");
      return true;
    }

    triggerAutoRun();
    return true;
  }

  if (e.target.classList.contains("equipped-shield-material")) {
    const equippedShield = selected.shields.find((s) => s.is_equipped);
    if (!equippedShield) return true;

    equippedShield.material_id = e.target.value;
    equippedShield.hit_points_modifier = 0;

    // Material change recalculates max HP — full re-render is correct here
    renderLists(selected, data);
    triggerAutoRun();
    return true;
  }

  if (e.target.classList.contains("shield-storage-select")) {
    moveShield(e.target.dataset.instanceId, e.target.value);
    return true;
  }

  if (e.target.classList.contains("equipped-shield-move")) {
    const destination = e.target.value;
    const equippedShield = selected.shields.find((s) => s.is_equipped);
    if (!equippedShield) return true;

    if (!destination) {
      equippedShield.is_equipped = true;
      equippedShield.storedAt = null;
    } else {
      equippedShield.is_equipped = false;
      equippedShield.storedAt = destination;
    }

    renderLists(selected, data);
    triggerAutoRun();
    return true;
  }

  return false;
}

// ─── Add-form ─────────────────────────────────────────────────────────────────

export function handleAddShield() {
  const nameEl = document.getElementById("shieldNameSelect");
  const tierEl = document.getElementById("shieldTierSelect");
  const materialEl = document.getElementById("shieldMaterialSelect");
  const storageEl = document.getElementById("shieldStorage");

  if (!nameEl || !tierEl || !materialEl || !storageEl) return;

  const shield = data.shields.find(
    (s) => s.shield_name === nameEl.value && s.shield_tier === tierEl.value,
  );
  if (!shield) return;

  const material = data.materials.find(
    (m) => m.material_name === materialEl.value,
  );
  addStoredShield(
    shield.shield_id,
    material?.material_id ?? null,
    storageEl.value,
  );
}
