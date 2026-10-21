import { STORED_AT } from "../../../shared/constants.js";
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
  sendAccessoryToAlly,
} from "./model.js";
import {
  renderEquippedAccessories,
  renderStoredAccessories,
} from "./render.js";
import { createEnchantmentsHandlers } from "../shared/enchantments/dispatch.js";
import { createSendToAllyHandler } from "../shared/sendToAllyControl.js";
import { createCustomFieldsClickHandler } from "../shared/customFieldsDispatch.js";

const data = state.data;
const selected = state.selected;

// Re-renders only the accessory lists, not the full renderLists() sweep — a full sweep was the actual cause of the enchantment-type-select flicker.
function _renderAccessoryLists(sheet) {
  renderEquippedAccessories(selected, data, sheet);
  renderStoredAccessories(selected, data, sheet);
}

// render.js now writes through morphHTML, whose idiomorph-based identity tracking preserves
// open <details>/card-expand state on its own — openState.js's snapshot/restore is no longer
// needed here. The one-rAF defer survives on its own merit: these fire from native <select>
// "change" handlers, and rebuilding before the browser finishes closing the native option
// picker flickers worst on mobile Safari (shared/openState.js's withOpenState has the same
// reasoning, just no longer paired with a snapshot for this container).
function _deferRender(e, fn) {
  requestAnimationFrame(fn);
}

const _handleAccessoryCustomFieldsClick = createCustomFieldsClickHandler({
  findByInstanceId: findAccessoryByInstanceId,
  saveCustomFields: saveAccessoryCustomFields, // mutates + renders + runs engine
  render: _renderAccessoryLists,
  runWithOpenState: _deferRender,
});

const _accessoryEnchantments = createEnchantmentsHandlers({
  findByInstanceId: findAccessoryByInstanceId,
  getItems: () => selected.accessories,
  addEnchantment: addAccessoryEnchantment,
  updateEnchantment: updateAccessoryEnchantment,
  removeEnchantment: removeAccessoryEnchantment,
  render: () => _renderAccessoryLists(state.sheet),
  runWithOpenState: _deferRender,
});

const _handleSendAccessoryToAllyClick = createSendToAllyHandler({
  sendFn: sendAccessoryToAlly,
  render: () => _renderAccessoryLists(state.sheet),
  canHandle: (instanceId) =>
    selected.accessories.some((a) => a.id === instanceId),
});

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

  // Delegated to the shared factory, which ownership-checks the instanceId so other equipment types can reuse the same block/button classes.

  if (_handleAccessoryCustomFieldsClick(e)) return true;

  // Delegated to the shared factory, same ownership-check as custom fields above.

  if (_accessoryEnchantments.handleClick(e)) return true;

  if (_handleSendAccessoryToAllyClick(e)) return true;

  return false;
}

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

  if (_accessoryEnchantments.handleChange(e)) return true;

  return false;
}

export function handleAddAccessory() {
  const nameEl = document.getElementById("accessoryNameSelect");
  const priceEl = document.getElementById("accessoryPriceInput");
  const storageEl = document.getElementById("accessoryStorage");
  if (!nameEl || !priceEl || !storageEl) return;

  const accessoryId = nameEl.value;
  if (!accessoryId) return;

  const price = parseFloat(priceEl.value) || 0;

  if (storageEl.value === STORED_AT.EQUIPPED) {
    addEquippedAccessory(accessoryId, price);
  } else {
    addStoredAccessory(accessoryId, price, storageEl.value);
  }

  updateAccessoryEquipOptionAvailability();
}
