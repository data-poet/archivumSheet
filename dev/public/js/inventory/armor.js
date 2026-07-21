import { state } from "../state.js";
import { fetchArmors, fetchMaterials } from "../api.js";
import { renderLists } from "../ui.js";
import { triggerAutoRun } from "../engine/autorun.js";
import { el, populateSelect } from "../shared/dom.js";
import { DEFAULT_MATERIAL_ID } from "../shared/constants.js";
import { nextArmorInstanceId } from "../store/instanceId.js";
import { offerUndo } from "../ui/undo.js";

const data = state.data;
const selected = state.selected;

// ─────────────────────────────────────────────────────────────────────────────
// LOAD
// ─────────────────────────────────────────────────────────────────────────────

export async function loadArmors() {
  [data.armors, data.materials] = await Promise.all([
    fetchArmors(),
    fetchMaterials(),
  ]);

  loadArmorSelectors();
  renderLists(selected, data);
  triggerAutoRun();
}

// ─────────────────────────────────────────────────────────────────────────────
// ADD-FORM SELECTORS
// ─────────────────────────────────────────────────────────────────────────────

export function loadArmorSelectors() {
  const slotSelect = el("armorSlotSelect");
  if (!slotSelect) return;

  const slots = [...new Set(data.armors.map((a) => a.armor_piece_location))];
  populateSelect(slotSelect, slots.map((s) => ({ value: s, label: s })));

  updateArmorNameOptions();
  updateArmorTierOptions();
  updateArmorMaterialOptions();
}

export function updateArmorNameOptions() {
  const slotSelect = el("armorSlotSelect");
  const nameSelect = el("armorNameSelect");
  if (!slotSelect || !nameSelect) return;

  const slot = slotSelect.value;
  const names = [
    ...new Set(
      data.armors
        .filter((a) => a.armor_piece_location === slot)
        .map((a) => a.armor_name),
    ),
  ];

  populateSelect(nameSelect, names.map((n) => ({ value: n, label: n })));
  updateArmorTierOptions();
}

export function updateArmorTierOptions() {
  const slotSelect = el("armorSlotSelect");
  const nameSelect = el("armorNameSelect");
  const tierSelect = el("armorTierSelect");
  if (!slotSelect || !nameSelect || !tierSelect) return;

  const slot = slotSelect.value;
  const name = nameSelect.value;
  const tiers = [
    ...new Set(
      data.armors
        .filter((a) => a.armor_piece_location === slot && a.armor_name === name)
        .map((a) => a.armor_tier),
    ),
  ];

  populateSelect(tierSelect, tiers.map((t) => ({ value: t, label: t })));
}

export function updateArmorMaterialOptions() {
  const materialSelect = el("armorMaterialSelect");
  if (!materialSelect) return;

  populateSelect(
    materialSelect,
    data.materials.map((m) => ({ value: m.material_name, label: m.material_name })),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EQUIP
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Equip an armor into a slot. Only one per slot allowed.
 * Passing an empty armorId clears the slot.
 */
export function equipArmor(slot, armorId, materialId = DEFAULT_MATERIAL_ID) {
  const currentEquipped = findEquippedArmorInSlot(slot);
  const preservedMaterialId = currentEquipped?.material_id || materialId;

  // Unequip whatever is in this slot
  selected.armors = selected.armors.filter((inst) => {
    if (!inst.is_equipped) return true;
    const db = data.armors.find((a) => a.armor_id === inst.armor_id);
    return db?.armor_piece_location !== slot;
  });

  if (!armorId) {
    renderLists(selected, data);
    triggerAutoRun();
    return;
  }

  selected.armors.push({
    _instanceId: nextArmorInstanceId(),
    armor_id: armorId,
    material_id: preservedMaterialId,
    hit_points_modifier: 0,
    is_equipped: true,
    storedAt: null,
  });

  renderLists(selected, data);
  triggerAutoRun();
}

// ─────────────────────────────────────────────────────────────────────────────
// STORAGE OPERATIONS
// ─────────────────────────────────────────────────────────────────────────────

/** Add armor directly to storage (not equipped). */
export function addStoredArmor(armorId, materialId = null, storedAt = "backpack") {
  if (!armorId) return;

  selected.armors.push({
    _instanceId: nextArmorInstanceId(),
    armor_id: armorId,
    material_id: materialId,
    hit_points_modifier: 0,
    is_equipped: false,
    storedAt,
  });

  renderLists(selected, data);
  triggerAutoRun();
}

/** Move a stored armor to a different storage location. Uses instanceId. */
export function moveArmor(instanceId, storedAt) {
  const armor = findArmorByInstanceId(instanceId);
  if (!armor) return;

  armor.is_equipped = false;
  armor.storedAt = storedAt;

  renderLists(selected, data);
  triggerAutoRun();
}

/** Remove an armor instance by instanceId. */
export function removeArmor(instanceId) {
  const before = structuredClone(selected.armors);
  selected.armors = selected.armors.filter((a) => a._instanceId !== instanceId);
  renderLists(selected, data);
  triggerAutoRun();

  offerUndo(() => {
    selected.armors = before;
    renderLists(selected, data);
    triggerAutoRun();
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// SELECTORS
// ─────────────────────────────────────────────────────────────────────────────

export function findEquippedArmorInSlot(slot) {
  return selected.armors.find((inst) => {
    if (!inst.is_equipped) return false;
    const db = data.armors.find((a) => a.armor_id === inst.armor_id);
    return db?.armor_piece_location === slot;
  });
}

export function findArmorByInstanceId(instanceId) {
  return selected.armors.find((a) => a._instanceId === instanceId) || null;
}
