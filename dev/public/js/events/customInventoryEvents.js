import {
  addCustomItem,
  updateCustomItemQuantity,
  removeCustomItem,
  moveCustomItem,
} from "../inventory/customInventory.js";

// ─── Click ────────────────────────────────────────────────────────────────────

export function handleCustomInventoryClick(e) {
  if (e.target.classList.contains("remove-custom-item")) {
    removeCustomItem(e.target.dataset.customItemId);
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
