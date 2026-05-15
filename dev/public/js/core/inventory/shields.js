import { state } from "../../state.js";
import { fetchShields, fetchMaterials } from "../../api.js";
import { renderLists } from "../../ui.js";
import { triggerAutoRun } from "../autorun.js";

const data = state.data;
const selected = state.selected;

// ===== LOAD =====
export async function loadShields() {
  [data.shields, data.materials] = await Promise.all([
    fetchShields(),
    fetchMaterials(),
  ]);

  loadShieldSelectors();
  renderLists(selected, data);
  triggerAutoRun();
}

// ===== SELECTORS =====
// Shields have no slots — selectors go straight to name → tier → material.
export function loadShieldSelectors() {
  updateShieldNameOptions();
  updateShieldTierOptions();
  updateShieldMaterialOptions();
}

export function updateShieldNameOptions() {
  const nameSelect = document.getElementById("shieldNameSelect");
  nameSelect.innerHTML = "";

  const names = [...new Set(data.shields.map((shield) => shield.shield_name))];

  names.forEach((name) => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    nameSelect.appendChild(opt);
  });

  updateShieldTierOptions();
}

export function updateShieldTierOptions() {
  const name = document.getElementById("shieldNameSelect").value;
  const tierSelect = document.getElementById("shieldTierSelect");
  tierSelect.innerHTML = "";

  const tiers = [
    ...new Set(
      data.shields
        .filter((shield) => shield.shield_name === name)
        .map((shield) => shield.shield_tier),
    ),
  ];

  tiers.forEach((tier) => {
    const opt = document.createElement("option");
    opt.value = tier;
    opt.textContent = tier;
    tierSelect.appendChild(opt);
  });
}

export function updateShieldMaterialOptions() {
  const materialSelect = document.getElementById("shieldMaterialSelect");
  materialSelect.innerHTML = "";

  data.materials.forEach((material) => {
    const opt = document.createElement("option");
    opt.value = material.material_name;
    opt.textContent = material.material_name;
    materialSelect.appendChild(opt);
  });
}

// ===== EQUIP =====
/**
 * Equip a shield. Only one shield can be equipped at a time.
 * Pass an empty shieldId to clear the equipped shield.
 */
export function equipShield(shieldId, materialId = "MAT-000") {
  const currentEquipped = selected.shields.find(
    (selectedShield) => selectedShield.is_equipped,
  );

  const preservedMaterialId = currentEquipped?.material_id || materialId;

  // Remove whatever shield is currently equipped
  selected.shields = selected.shields.filter(
    (selectedShield) => !selectedShield.is_equipped,
  );

  if (!shieldId) {
    renderLists(selected, data);
    triggerAutoRun();
    return;
  }

  selected.shields.push({
    shield_id: shieldId,
    material_id: preservedMaterialId,
    is_equipped: true,
    storedAt: null,
  });

  renderLists(selected, data);
  triggerAutoRun();
}

// ===== STORED SHIELDS =====
/**
 * Add a shield directly to storage (not equipped).
 */
export function addStoredShield(
  shieldId,
  materialId = null,
  storedAt = "backpack",
) {
  if (!shieldId) return;

  selected.shields.push({
    shield_id: shieldId,
    material_id: materialId,
    is_equipped: false,
    storedAt,
  });

  renderLists(selected, data);
  triggerAutoRun();
}

/**
 * Move a stored shield to a different storage location.
 */
export function moveShield(index, storedAt) {
  const shield = selected.shields[index];
  if (!shield) return;

  shield.is_equipped = false;
  shield.storedAt = storedAt;

  renderLists(selected, data);
  triggerAutoRun();
}

/**
 * Remove a shield instance entirely.
 */
export function removeShield(index) {
  selected.shields.splice(index, 1);
  renderLists(selected, data);
  triggerAutoRun();
}
