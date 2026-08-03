import { state } from "../state.js";
import { fetchAccessories } from "../api.js";
import { renderLists } from "../ui.js";
import { triggerAutoRun } from "../engine/autorun.js";
import { el, populateSelect } from "../shared/dom.js";
import { ACCESSORY_ITEM_CATEGORY } from "../shared/constants.js";
import { nextAccessoryInstanceId } from "../store/instanceId.js";
import { offerUndo } from "../ui/undo.js";
import {
  addEnchantmentEntry,
  updateEnchantmentEntry,
  removeEnchantmentEntry,
  clearEnchantmentAddFormSelection,
} from "./enchantments.js";

const data = state.data;
const selected = state.selected;

// ─────────────────────────────────────────────────────────────────────────────
// LOAD
// ─────────────────────────────────────────────────────────────────────────────

export async function loadAccessories() {
  data.accessories = await fetchAccessories();

  loadAccessorySelectors();
  renderLists(selected, data);
  triggerAutoRun();
}

// ─────────────────────────────────────────────────────────────────────────────
// ADD-FORM SELECTORS
// ─────────────────────────────────────────────────────────────────────────────

export function loadAccessorySelectors() {
  updateAccessoryNameOptions();
}

export function updateAccessoryNameOptions() {
  const select = el("accessoryNameSelect");
  if (!select) return;

  populateSelect(
    select,
    data.accessories.map((a) => ({
      value: a.accessory_id,
      label: a.accessory_name,
    })),
  );

  updateAccessoryEquipOptionAvailability();
}

/**
 * Disables the "Equipado" option in the add-form storage select whenever the
 * currently selected accessory type is already at its equip limit — the
 * hard-block half of equip-limit enforcement (paired with the engine-side
 * safety check in buildAccessorySlots).
 */
export function updateAccessoryEquipOptionAvailability() {
  const nameSelect = el("accessoryNameSelect");
  const storageSelect = el("accessoryStorage");
  if (!nameSelect || !storageSelect) return;

  const equipOption = Array.from(storageSelect.options).find(
    (o) => o.value === "equipped",
  );
  if (!equipOption) return;

  const atLimit = isAccessoryAtEquipLimit(nameSelect.value);
  equipOption.disabled = atLimit;

  if (atLimit && storageSelect.value === "equipped") {
    storageSelect.value = "backpack";
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// EQUIP LIMITS
// ─────────────────────────────────────────────────────────────────────────────

export function countEquippedAccessories(accessoryId) {
  return selected.accessories.filter(
    (a) => a.accessory_id === accessoryId && a.is_equipped,
  ).length;
}

export function getAccessoryEquipLimit(accessoryId) {
  const accessory = data.accessories.find(
    (a) => a.accessory_id === accessoryId,
  );
  return Number(accessory?.accessory_equip_limit ?? 0);
}

export function isAccessoryAtEquipLimit(accessoryId) {
  if (!accessoryId) return false;
  return countEquippedAccessories(accessoryId) >= getAccessoryEquipLimit(accessoryId);
}

// ─────────────────────────────────────────────────────────────────────────────
// ADD
// ─────────────────────────────────────────────────────────────────────────────

function _newAccessoryInstance(accessoryId, price, isEquipped, storedAt) {
  return {
    _instanceId: nextAccessoryInstanceId(),
    accessory_id: accessoryId,
    price: Number(price) || 0,
    is_equipped: isEquipped,
    storedAt,
    accessory_custom_name: null,
    accessory_custom_description: null,
    accessory_custom_effect: null,
    enchantments: [],
  };
}

/** Add an accessory directly as equipped. Refuses silently if at the type's equip limit. */
export function addEquippedAccessory(accessoryId, price = 0) {
  if (!accessoryId) return;
  if (isAccessoryAtEquipLimit(accessoryId)) return;

  selected.accessories.push(
    _newAccessoryInstance(accessoryId, price, true, null),
  );

  updateAccessoryEquipOptionAvailability();
  renderLists(selected, data);
  triggerAutoRun();
}

/** Add an accessory directly to storage (not equipped). */
export function addStoredAccessory(accessoryId, price = 0, storedAt = "backpack") {
  if (!accessoryId) return;

  selected.accessories.push(
    _newAccessoryInstance(accessoryId, price, false, storedAt),
  );

  renderLists(selected, data);
  triggerAutoRun();
}

// ─────────────────────────────────────────────────────────────────────────────
// EQUIP / STORAGE OPERATIONS
// ─────────────────────────────────────────────────────────────────────────────

/** Equip a stored accessory. Refuses silently if at the type's equip limit. */
export function equipAccessory(instanceId) {
  const instance = findAccessoryByInstanceId(instanceId);
  if (!instance) return;
  if (isAccessoryAtEquipLimit(instance.accessory_id)) return;

  instance.is_equipped = true;
  instance.storedAt = null;

  updateAccessoryEquipOptionAvailability();
  renderLists(selected, data);
  triggerAutoRun();
}

/** Move an equipped/stored accessory to a different storage location, or
 *  back to equipped if destination is empty (used by the equipped-move select). */
export function moveAccessory(instanceId, storedAt) {
  const instance = findAccessoryByInstanceId(instanceId);
  if (!instance) return;

  if (!storedAt) {
    if (isAccessoryAtEquipLimit(instance.accessory_id) && !instance.is_equipped) {
      return;
    }
    instance.is_equipped = true;
    instance.storedAt = null;
  } else {
    instance.is_equipped = false;
    instance.storedAt = storedAt;
  }

  updateAccessoryEquipOptionAvailability();
  renderLists(selected, data);
  triggerAutoRun();
}

/** Remove an accessory instance by instanceId, with undo support. */
export function removeAccessory(instanceId) {
  const before = structuredClone(selected.accessories);

  selected.accessories = selected.accessories.filter(
    (a) => a._instanceId !== instanceId,
  );
  clearEnchantmentAddFormSelection(instanceId);
  updateAccessoryEquipOptionAvailability();
  renderLists(selected, data);
  triggerAutoRun();

  offerUndo(() => {
    selected.accessories = before;
    updateAccessoryEquipOptionAvailability();
    renderLists(selected, data);
    triggerAutoRun();
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// FIELD UPDATES (price + custom fields)
// ─────────────────────────────────────────────────────────────────────────────

export function updateAccessoryPrice(instanceId, rawValue) {
  const instance = findAccessoryByInstanceId(instanceId);
  if (!instance) return;

  const parsed = parseFloat(rawValue);
  instance.price = isNaN(parsed) || parsed < 0 ? 0 : parsed;

  triggerAutoRun();
}

/**
 * Commits all three custom fields at once — called only when the user
 * presses "Salvar" in the custom-fields editor (see renderUtils.js /
 * accessoriesEvents.js), never on individual keystrokes. Blank strings are
 * normalized to null.
 */
export function saveAccessoryCustomFields(instanceId, { name, description, effect }) {
  const instance = findAccessoryByInstanceId(instanceId);
  if (!instance) return;

  const norm = (v) => (v == null || v.trim() === "" ? null : v.trim());

  instance.accessory_custom_name = norm(name);
  instance.accessory_custom_description = norm(description);
  instance.accessory_custom_effect = norm(effect);

  renderLists(selected, data);
  triggerAutoRun();
}

// ─────────────────────────────────────────────────────────────────────────────
// ENCHANTMENTS
//
// Thin accessory-specific wrappers around the generic entry helpers in
// enchantments.js — same relationship saveAccessoryCustomFields has with
// customFieldsBlock. instance.enchantments defaults to [] defensively since
// accessories saved before this feature existed won't have the field.
// ─────────────────────────────────────────────────────────────────────────────

export function addAccessoryEnchantment(instanceId, enchantmentId, params) {
  const instance = findAccessoryByInstanceId(instanceId);
  if (!instance) return;
  if (!instance.enchantments) instance.enchantments = [];

  const added = addEnchantmentEntry(
    instance.enchantments,
    enchantmentId,
    params,
  );
  if (!added) return;

  renderLists(selected, data, state.sheet);
  triggerAutoRun();
}

/**
 * Edits an already-attached entry in place — swapping it for a different
 * enchantment entirely, or just changing its target/value/extraPoints.
 * Keeps the entry's own _instanceId so its position in the list and its
 * price-lookup identity survive the edit.
 */
export function updateAccessoryEnchantment(
  instanceId,
  entryInstanceId,
  enchantmentId,
  params,
) {
  const instance = findAccessoryByInstanceId(instanceId);
  if (!instance || !instance.enchantments) return;

  const before = structuredClone(instance.enchantments);

  const updated = updateEnchantmentEntry(
    instance.enchantments,
    entryInstanceId,
    enchantmentId,
    params,
  );
  if (!updated) return;

  renderLists(selected, data, state.sheet);
  triggerAutoRun();

  offerUndo(() => {
    instance.enchantments = before;
    renderLists(selected, data, state.sheet);
    triggerAutoRun();
  });
}

export function removeAccessoryEnchantment(instanceId, entryInstanceId) {
  const instance = findAccessoryByInstanceId(instanceId);
  if (!instance || !instance.enchantments) return;

  const before = structuredClone(instance.enchantments);

  removeEnchantmentEntry(instance.enchantments, entryInstanceId);

  renderLists(selected, data, state.sheet);
  triggerAutoRun();

  offerUndo(() => {
    instance.enchantments = before;
    renderLists(selected, data, state.sheet);
    triggerAutoRun();
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// SELECTORS
// ─────────────────────────────────────────────────────────────────────────────

export function findAccessoryByInstanceId(instanceId) {
  return (
    selected.accessories.find((a) => a._instanceId === instanceId) || null
  );
}
