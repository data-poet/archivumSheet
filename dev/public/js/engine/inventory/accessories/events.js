import { state } from "../../../state.js";
import {
  addEquippedAccessory,
  addStoredAccessory,
  equipAccessory,
  moveAccessory,
  removeAccessory,
  updateAccessoryPrice,
  saveAccessoryCustomFields,
  findAccessoryByInstanceId,
  updateAccessoryEquipOptionAvailability,
  addAccessoryEnchantment,
  updateAccessoryEnchantment,
  removeAccessoryEnchantment,
} from "./model.js";
import {
  renderEquippedAccessories,
  renderStoredAccessories,
} from "./render.js";
import { createEnchantmentsHandlers } from "../shared/enchantments/dispatch.js";
import { withOpenState, tableRowKeyFn, divBlockKeyFn } from "../../../shared/openState.js";
import { createCustomFieldsClickHandler } from "../shared/customFieldsDispatch.js";

const data = state.data;
const selected = state.selected;

// _withPreservedOpenState mirrors, for the direct renders below, what global
// snapshotAll/restoreAll already does for the debounced triggerAutoRun() path
// (see openState.js's MANAGED_CONTAINER_IDS) — so an open custom-fields
// <details> doesn't collapse mid-edit.

// Re-renders only the accessory lists, not the full renderLists() sweep — a full sweep was the actual cause of the enchantment-type-select flicker.
function _renderAccessoryLists(sheet) {
  renderEquippedAccessories(selected, data, sheet);
  renderStoredAccessories(selected, data, sheet);
}

function _withPreservedOpenState(e, mutateAndRenderFn) {
  if (e.target.closest("#accessorySlots")) {
    withOpenState(
      "#accessorySlots",
      divBlockKeyFn("data-instance-id"),
      mutateAndRenderFn,
    );
  } else {
    withOpenState(
      "#accessoryStorageList",
      tableRowKeyFn("data-instance-id"),
      mutateAndRenderFn,
    );
  }
}

const _handleAccessoryCustomFieldsClick = createCustomFieldsClickHandler({
  findByInstanceId: findAccessoryByInstanceId,
  saveCustomFields: saveAccessoryCustomFields, // mutates + renders + runs engine
  render: _renderAccessoryLists,
  runWithOpenState: _withPreservedOpenState,
});

const _accessoryEnchantments = createEnchantmentsHandlers({
  findByInstanceId: findAccessoryByInstanceId,
  getItems: () => selected.accessories,
  addEnchantment: addAccessoryEnchantment,
  updateEnchantment: updateAccessoryEnchantment,
  removeEnchantment: removeAccessoryEnchantment,
  render: () => _renderAccessoryLists(state.sheet),
  runWithOpenState: _withPreservedOpenState,
});

// ─── Click ────────────────────────────────────────────────────────────────────

export function handleAccessoryClick(e) {
  if (
    e.target.classList.contains("remove-accessory") ||
    e.target.classList.contains("remove-equipped-accessory")
  ) {
    removeAccessory(e.target.dataset.instanceId);
    return true;
  }

  if (e.target.classList.contains("equip-stored-accessory")) {
    equipAccessory(e.target.dataset.instanceId);
    return true;
  }

  // ── Custom fields: edit / save / cancel ───────────────────────────────────
  // Delegated to the shared factory, which ownership-checks the instanceId so other equipment types can reuse the same block/button classes.

  if (_handleAccessoryCustomFieldsClick(e)) return true;

  // ── Enchantments: remove / add / save (edit or swap) ───────────────────────
  // Delegated to the shared factory, same ownership-check as custom fields above.

  if (_accessoryEnchantments.handleClick(e)) return true;

  return false;
}

// ─── Input ────────────────────────────────────────────────────────────────────

export function handleAccessoryInput(e) {
  if (
    e.target.classList.contains("equipped-accessory-price") ||
    e.target.classList.contains("stored-accessory-price")
  ) {
    const instanceId = e.target.dataset.instanceId;
    if (e.target.value === "") return true; // allow mid-typing
    updateAccessoryPrice(instanceId, e.target.value);
    return true;
  }

  return false;
}

// ─── Change ───────────────────────────────────────────────────────────────────

export function handleAccessoryChange(e) {
  if (e.target.id === "accessoryNameSelect") {
    updateAccessoryEquipOptionAvailability();
    return true;
  }

  if (
    e.target.classList.contains("accessory-storage-select") ||
    e.target.classList.contains("equipped-accessory-move")
  ) {
    moveAccessory(e.target.dataset.instanceId, e.target.value);
    return true;
  }

  // ── Enchantments: cascading category/type/target filters ───────────────────
  if (_accessoryEnchantments.handleChange(e)) return true;

  return false;
}

// ─── Add form ─────────────────────────────────────────────────────────────────

export function handleAddAccessory() {
  const nameEl = document.getElementById("accessoryNameSelect");
  const priceEl = document.getElementById("accessoryPriceInput");
  const storageEl = document.getElementById("accessoryStorage");
  if (!nameEl || !priceEl || !storageEl) return;

  const accessoryId = nameEl.value;
  if (!accessoryId) return;

  const price = parseFloat(priceEl.value) || 0;

  if (storageEl.value === "equipped") {
    addEquippedAccessory(accessoryId, price);
  } else {
    addStoredAccessory(accessoryId, price, storageEl.value);
  }

  updateAccessoryEquipOptionAvailability();
}
