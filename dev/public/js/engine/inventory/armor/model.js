import { state } from "../../../state.js";
import { fetchArmors, fetchMaterials } from "../../../api.js";
import { renderListsPreserving } from "../../../ui.js";
import { triggerAutoRun } from "../../../compute/autorun.js";
import { el, populateSelect } from "../../../shared/dom.js";
import { DEFAULT_MATERIAL_ID } from "../../../shared/constants.js";
import { nextArmorInstanceId } from "../../../store/instanceId.js";
import { offerUndo } from "../../../components/undo.js";
import { t } from "../../../localization/pt-BR/index.js";
import {
  addEnchantmentEntry,
  updateEnchantmentEntry,
  removeEnchantmentEntry,
  clearEnchantmentAddFormSelection,
} from "../shared/enchantments/model.js";

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
  renderListsPreserving(selected, data);
  triggerAutoRun();
}

// ─────────────────────────────────────────────────────────────────────────────
// ADD-FORM SELECTORS
// ─────────────────────────────────────────────────────────────────────────────

export function loadArmorSelectors() {
  const slotSelect = el("armorSlotSelect");
  if (!slotSelect) return;

  const slots = [...new Set(data.armors.map((a) => a.armor_piece_location))];
  populateSelect(
    slotSelect,
    slots.map((s) => ({ value: s, label: s })),
  );

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

  populateSelect(
    nameSelect,
    names.map((n) => ({ value: n, label: n })),
  );
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

  populateSelect(
    tierSelect,
    tiers.map((t) => ({ value: t, label: t })),
  );
}

export function updateArmorMaterialOptions() {
  const materialSelect = el("armorMaterialSelect");
  if (!materialSelect) return;

  populateSelect(
    materialSelect,
    data.materials.map((m) => ({
      value: m.material_name,
      label: m.material_name,
    })),
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
    renderListsPreserving(selected, data);
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
    armor_custom_name: null,
    armor_custom_description: null,
    armor_custom_effect: null,
    enchantments: [],
  });

  renderListsPreserving(selected, data);
  triggerAutoRun();
}

// ─────────────────────────────────────────────────────────────────────────────
// STORAGE OPERATIONS
// ─────────────────────────────────────────────────────────────────────────────

/** Add armor directly to storage (not equipped). */
export function addStoredArmor(
  armorId,
  materialId = null,
  storedAt = "backpack",
) {
  if (!armorId) return;

  selected.armors.push({
    _instanceId: nextArmorInstanceId(),
    armor_id: armorId,
    material_id: materialId,
    hit_points_modifier: 0,
    is_equipped: false,
    storedAt,
    armor_custom_name: null,
    armor_custom_description: null,
    armor_custom_effect: null,
    enchantments: [],
  });

  renderListsPreserving(selected, data);
  triggerAutoRun();
}

/** Move a stored armor to a different storage location. Uses instanceId. */
export function moveArmor(instanceId, storedAt) {
  const armor = findArmorByInstanceId(instanceId);
  if (!armor) return;

  armor.is_equipped = false;
  armor.storedAt = storedAt;

  renderListsPreserving(selected, data);
  triggerAutoRun();
}

/** Remove an armor instance by instanceId. */
export function removeArmor(instanceId) {
  const before = structuredClone(selected.armors);
  selected.armors = selected.armors.filter((a) => a._instanceId !== instanceId);
  clearEnchantmentAddFormSelection(instanceId);
  renderListsPreserving(selected, data);
  triggerAutoRun();

  offerUndo(() => {
    selected.armors = before;
    renderListsPreserving(selected, data);
    triggerAutoRun();
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// FIELD UPDATES (custom fields)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Commits all three custom fields at once — called only when the user
 * presses "Salvar" in the custom-fields editor, never on individual
 * keystrokes. Blank strings are normalized to null.
 */
export function saveArmorCustomFields(
  instanceId,
  { name, description, effect },
) {
  const instance = findArmorByInstanceId(instanceId);
  if (!instance) return;

  const norm = (v) => (v == null || v.trim() === "" ? null : v.trim());

  instance.armor_custom_name = norm(name);
  instance.armor_custom_description = norm(description);
  instance.armor_custom_effect = norm(effect);

  renderListsPreserving(selected, data);
  triggerAutoRun();
}

// ─────────────────────────────────────────────────────────────────────────────
// ENCHANTMENTS
//
// Thin armor-specific wrappers around the generic entry helpers in
// enchantments.js — same relationship saveArmorCustomFields has with
// customFieldsBlock, and identical shape to accessories'/magicGear's own
// wrappers (see accessories/model.js). instance.enchantments defaults to
// [] defensively since armor saved before this feature existed won't have
// the field.
// ─────────────────────────────────────────────────────────────────────────────

export function addArmorEnchantment(instanceId, enchantmentId, params) {
  const instance = findArmorByInstanceId(instanceId);
  if (!instance) return;
  if (!instance.enchantments) instance.enchantments = [];

  const before = structuredClone(instance.enchantments);

  const added = addEnchantmentEntry(
    instance.enchantments,
    enchantmentId,
    params,
  );
  if (!added) return;

  renderListsPreserving(selected, data, state.sheet);
  triggerAutoRun();

  offerUndo(() => {
    instance.enchantments = before;
    renderListsPreserving(selected, data, state.sheet);
    triggerAutoRun();
  }, t("common.added"));
}

/**
 * Edits an already-attached entry in place — swapping it for a different
 * enchantment entirely, or just changing its target/value/extraPoints.
 * Keeps the entry's own _instanceId so its position in the list and its
 * price-lookup identity survive the edit.
 */
export function updateArmorEnchantment(
  instanceId,
  entryInstanceId,
  enchantmentId,
  params,
) {
  const instance = findArmorByInstanceId(instanceId);
  if (!instance || !instance.enchantments) return;

  const before = structuredClone(instance.enchantments);

  const updated = updateEnchantmentEntry(
    instance.enchantments,
    entryInstanceId,
    enchantmentId,
    params,
  );
  if (!updated) return;

  renderListsPreserving(selected, data, state.sheet);
  triggerAutoRun();

  offerUndo(() => {
    instance.enchantments = before;
    renderListsPreserving(selected, data, state.sheet);
    triggerAutoRun();
  });
}

export function removeArmorEnchantment(instanceId, entryInstanceId) {
  const instance = findArmorByInstanceId(instanceId);
  if (!instance || !instance.enchantments) return;

  const before = structuredClone(instance.enchantments);

  removeEnchantmentEntry(instance.enchantments, entryInstanceId);

  renderListsPreserving(selected, data, state.sheet);
  triggerAutoRun();

  offerUndo(() => {
    instance.enchantments = before;
    renderListsPreserving(selected, data, state.sheet);
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
