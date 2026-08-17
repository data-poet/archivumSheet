import {
  addCustomItem,
  updateCustomItemQuantity,
  removeCustomItem,
  moveCustomItem,
  saveCustomItemFields,
} from "../inventory/customInventory.js";
import { state } from "../state.js";
import { renderCustomInventory } from "../ui/lists/renderCustomInventory.js";
import { snapshotAll, restoreAll } from "../shared/openState.js";
import {
  openCustomFieldsEditor,
  closeCustomFieldsEditor,
  readCustomItemEditorValues,
} from "../ui/lists/renderUtils.js";

/**
 * Re-renders ONLY the custom-inventory list, not a full renderLists()
 * sweep of all 21 sections — same reasoning/shape as shield's
 * _renderShieldLists.
 */
function _renderCustomInventoryLists() {
  const snapshots = snapshotAll();

  requestAnimationFrame(() => {
    renderCustomInventory(state.selected, state.data, state.sheet);
    restoreAll(snapshots);
  });
}

// ─── Click ────────────────────────────────────────────────────────────────────

export function handleCustomInventoryClick(e) {
  if (e.target.classList.contains("remove-custom-item")) {
    removeCustomItem(e.target.dataset.customItemId);
    return true;
  }

  if (e.target.classList.contains("custom-item-edit-btn")) {
    openCustomFieldsEditor(e.target.dataset.customItemId);
    _renderCustomInventoryLists();
    return true;
  }

  if (e.target.classList.contains("custom-item-cancel-btn")) {
    closeCustomFieldsEditor(e.target.dataset.customItemId);
    _renderCustomInventoryLists();
    return true;
  }

  if (e.target.classList.contains("custom-item-save-btn")) {
    const customItemId = e.target.dataset.customItemId;
    const values = readCustomItemEditorValues(customItemId);
    if (!values) {
      closeCustomFieldsEditor(customItemId);
      _renderCustomInventoryLists();
      return true;
    }

    const ok = saveCustomItemFields(customItemId, values); // mutates + renders + runs engine if valid
    if (ok) {
      closeCustomFieldsEditor(customItemId);
    }
    // If invalid (blank name, negative weight/price, etc.), deliberately do
    // NOT close the editor or re-render — a re-render would pull fresh markup
    // from committed state and silently revert what the user just typed.
    // Leaving the DOM untouched keeps their input in place so they can fix it.
    return true;
  }

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
    const toLoc        = e.target.value;
    moveCustomItem(customItemId, toLoc);
    return true;
  }
  return false;
}

// ─── Add-form ─────────────────────────────────────────────────────────────────

export function handleAddCustomItem() {
  const nameEl        = document.getElementById("customItemName");
  const weightEl      = document.getElementById("customItemWeight");
  const priceEl       = document.getElementById("customItemPrice");
  const qtyEl         = document.getElementById("customItemQty");
  const descriptionEl = document.getElementById("customItemDescription");
  const storageEl     = document.getElementById("customItemStorage");

  if (!nameEl || !weightEl || !priceEl || !qtyEl || !storageEl) return;

  const name        = nameEl.value.trim();
  const weight      = parseFloat(weightEl.value);
  const price       = parseFloat(priceEl.value);
  const quantity    = parseInt(qtyEl.value, 10);
  const description = descriptionEl?.value.trim() || null;
  const storedAt    = storageEl.value;

  if (!name || isNaN(weight) || weight < 0 || isNaN(price) || price < 0 || isNaN(quantity) || quantity <= 0) return;

  addCustomItem({ name, weight, price, quantity, description, storedAt });

  // Reset form
  nameEl.value   = "";
  weightEl.value = "0";
  priceEl.value  = "0";
  qtyEl.value    = "1";
  if (descriptionEl) descriptionEl.value = "";
}
