import {
  addCustomItem,
  updateCustomItemQuantity,
  removeCustomItem,
  moveCustomItem,
  saveCustomItemFields,
  sendCustomItemToAlly,
} from "./model.js";
import { state } from "../../../state.js";
import { renderCustomInventory } from "./render.js";
import { snapshotAll, restoreAll } from "../../../shared/openState.js";
import { readCustomItemEditorValues } from "../../../shared/renderUtils.js";
import {
  createCustomFieldsClickHandler,
  withPreservedOpenState,
} from "../shared/customFieldsDispatch.js";
import { createSendToAllyHandler } from "../shared/sendToAllyControl.js";

// Re-renders only the custom-inventory list, avoiding a full renderLists() sweep — mirrors shield's _renderShieldLists.
function _renderCustomInventoryLists() {
  const snapshots = snapshotAll();

  requestAnimationFrame(() => {
    renderCustomInventory(state.selected, state.data, state.sheet);
    restoreAll(snapshots);
  });
}

function _findCustomItemById(customItemId) {
  return (
    state.selected.customInventory.find(
      (e) => e.id === customItemId,
    ) ?? null
  );
}

const _handleCustomInventoryCustomFieldsClick = createCustomFieldsClickHandler({
  classPrefix: "custom-item",
  idAttr: "customItemId",
  findByInstanceId: _findCustomItemById,
  readValues: readCustomItemEditorValues,
  saveCustomFields: withPreservedOpenState(saveCustomItemFields),
  render: _renderCustomInventoryLists,
});

const _handleSendCustomItemToAllyClick = createSendToAllyHandler({
  sendFn: sendCustomItemToAlly,
  render: _renderCustomInventoryLists,
});

// ─── Click ────────────────────────────────────────────────────────────────────

export function handleCustomInventoryClick(e) {
  if (e.target.classList.contains("remove-custom-item")) {
    removeCustomItem(e.target.dataset.customItemId);
    return true;
  }

  // Delegated to the shared factory — see armorEvents.js for the full rationale.
  if (_handleCustomInventoryCustomFieldsClick(e)) return true;

  if (_handleSendCustomItemToAllyClick(e)) return true;

  return false;
}

// ─── Input ────────────────────────────────────────────────────────────────────

export function handleCustomInventoryInput(e) {
  if (e.target.classList.contains("custom-item-qty")) {
    const customItemId = e.target.dataset.customItemId;
    if (!customItemId) return true;
    if (e.target.value === "-" || e.target.value === "") return true;
    const quantity = parseInt(e.target.value, 10);
    updateCustomItemQuantity(customItemId, isNaN(quantity) ? 0 : quantity);
    return true;
  }
  return false;
}

// ─── Change ───────────────────────────────────────────────────────────────────

export function handleCustomInventoryChange(e) {
  if (e.target.classList.contains("custom-item-location-select")) {
    const customItemId = e.target.dataset.customItemId;
    const toLoc = e.target.value;
    moveCustomItem(customItemId, toLoc);
    return true;
  }
  return false;
}

// ─── Add-form ─────────────────────────────────────────────────────────────────

export function handleAddCustomItem() {
  const nameEl = document.getElementById("customItemName");
  const weightEl = document.getElementById("customItemWeight");
  const priceEl = document.getElementById("customItemPrice");
  const qtyEl = document.getElementById("customItemQty");
  const descriptionEl = document.getElementById("customItemDescription");
  const storageEl = document.getElementById("customItemStorage");

  if (!nameEl || !weightEl || !priceEl || !qtyEl || !storageEl) return;

  const name = nameEl.value.trim();
  const weight = parseFloat(weightEl.value);
  const price = parseFloat(priceEl.value);
  const quantity = parseInt(qtyEl.value, 10);
  const description = descriptionEl?.value.trim() || null;
  const storedAt = storageEl.value;

  if (
    !name ||
    isNaN(weight) ||
    weight < 0 ||
    isNaN(price) ||
    price < 0 ||
    isNaN(quantity) ||
    quantity <= 0
  )
    return;

  addCustomItem({ name, weight, price, quantity, description, storedAt });

  nameEl.value = "";
  weightEl.value = "0";
  priceEl.value = "0";
  qtyEl.value = "1";
  if (descriptionEl) descriptionEl.value = "";
}
