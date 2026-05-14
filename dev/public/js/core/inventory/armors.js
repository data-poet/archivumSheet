import { state } from "../../state.js";
import { fetchArmors, fetchMaterials } from "../../api.js";
import { renderLists } from "../../ui.js";
import { triggerAutoRun } from "../autorun.js";

const data = state.data;
const selected = state.selected;

// ===== LOAD =====
export async function loadArmors() {
  [data.armors, data.materials] = await Promise.all([
    fetchArmors(),
    fetchMaterials(),
  ]);

  loadArmorSelectors();
  renderLists(selected, data);
  triggerAutoRun();
}

// ===== SELECTORS =====
export function loadArmorSelectors() {
  const slotSelect = document.getElementById("armorSlotSelect");
  slotSelect.innerHTML = "";

  const slots = [
    ...new Set(data.armors.map((armor) => armor.armor_piece_location)),
  ];

  slots.forEach((slot) => {
    const opt = document.createElement("option");
    opt.value = slot;
    opt.textContent = slot;
    slotSelect.appendChild(opt);
  });

  updateArmorNameOptions();
  updateArmorTierOptions();
  updateArmorMaterialOptions();
}

export function updateArmorNameOptions() {
  const slot = document.getElementById("armorSlotSelect").value;
  const nameSelect = document.getElementById("armorNameSelect");
  nameSelect.innerHTML = "";

  const names = [
    ...new Set(
      data.armors
        .filter((armor) => armor.armor_piece_location === slot)
        .map((armor) => armor.armor_name),
    ),
  ];

  names.forEach((name) => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    nameSelect.appendChild(opt);
  });

  updateArmorTierOptions();
}

export function updateArmorTierOptions() {
  const slot = document.getElementById("armorSlotSelect").value;
  const name = document.getElementById("armorNameSelect").value;
  const tierSelect = document.getElementById("armorTierSelect");
  tierSelect.innerHTML = "";

  const tiers = [
    ...new Set(
      data.armors
        .filter(
          (armor) =>
            armor.armor_piece_location === slot && armor.armor_name === name,
        )
        .map((armor) => armor.armor_tier),
    ),
  ];

  tiers.forEach((tier) => {
    const opt = document.createElement("option");
    opt.value = tier;
    opt.textContent = tier;
    tierSelect.appendChild(opt);
  });
}

export function updateArmorMaterialOptions() {
  const materialSelect = document.getElementById("armorMaterialSelect");
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
 * Equip an armor into a slot. Only one equipped per slot.
 * Pass an empty armorId to clear the slot.
 */
export function equipArmor(slot, armorId, materialId = "MAT-000") {
  const currentEquipped = selected.armors.find((selectedArmor) => {
    if (!selectedArmor.is_equipped) return false;

    const dbArmor = data.armors.find(
      (armor) => armor.armor_id === selectedArmor.armor_id,
    );

    return dbArmor?.armor_piece_location === slot;
  });

  const preservedMaterialId = currentEquipped?.material_id || materialId;

  // Remove whatever is currently equipped in this slot
  selected.armors = selected.armors.filter((selectedArmor) => {
    if (!selectedArmor.is_equipped) return true;

    const dbArmor = data.armors.find(
      (armor) => armor.armor_id === selectedArmor.armor_id,
    );

    return dbArmor?.armor_piece_location !== slot;
  });

  if (!armorId) {
    renderLists(selected, data);
    triggerAutoRun();
    return;
  }

  selected.armors.push({
    armor_id: armorId,
    material_id: preservedMaterialId,
    is_equipped: true,
    storedAt: null,
  });

  renderLists(selected, data);
  triggerAutoRun();
}

// ===== STORED ARMORS =====
/**
 * Add armor directly to storage (not equipped).
 */
export function addStoredArmor(
  armorId,
  materialId = null,
  storedAt = "backpack",
) {
  if (!armorId) return;

  selected.armors.push({
    armor_id: armorId,
    material_id: materialId,
    is_equipped: false,
    storedAt,
  });

  renderLists(selected, data);
  triggerAutoRun();
}

/**
 * Move a stored armor to a different storage location.
 */
export function moveArmor(index, storedAt) {
  const armor = selected.armors[index];
  if (!armor) return;

  armor.is_equipped = false;
  armor.storedAt = storedAt;

  renderLists(selected, data);
  triggerAutoRun();
}

/**
 * Remove an armor instance entirely.
 */
export function removeArmor(index) {
  selected.armors.splice(index, 1);
  renderLists(selected, data);
  triggerAutoRun();
}
