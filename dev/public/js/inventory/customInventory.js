import { state } from "../state.js";
import { renderLists } from "../ui.js";
import { triggerAutoRun } from "../engine/autorun.js";

const selected = state.selected;

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function generateId() {
  return `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// STORAGE OPERATIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Add a new fully user-defined item.
 * Every field is provided by the caller — there is no DB to look up.
 */
export function addCustomItem({ name, weight, price, quantity, description, storedAt }) {
  if (!name?.trim() || quantity <= 0 || weight < 0 || price < 0) return;

  selected.customInventory.push({
    custom_item_id: generateId(),
    name:        name.trim(),
    weight:      weight,
    price:       price,
    quantity:    quantity,
    description: description?.trim() || null,
    storedAt:    storedAt,
  });

  renderLists(selected, state.data, state.sheet);
  triggerAutoRun();
}

/** Update the quantity of an entry identified by its custom_item_id. */
export function updateCustomItemQuantity(customItemId, quantity) {
  if (quantity <= 0) {
    removeCustomItem(customItemId);
    return;
  }

  const entry = selected.customInventory.find(
    (e) => e.custom_item_id === customItemId,
  );
  if (entry) entry.quantity = quantity;

  renderLists(selected, state.data, state.sheet);
  triggerAutoRun();
}

/** Remove an entry entirely by its custom_item_id. */
export function removeCustomItem(customItemId) {
  selected.customInventory = selected.customInventory.filter(
    (e) => e.custom_item_id !== customItemId,
  );

  renderLists(selected, state.data, state.sheet);
  triggerAutoRun();
}

/**
 * Move a custom item to a different location.
 * Custom items are unique per custom_item_id so no merging is needed.
 */
export function moveCustomItem(customItemId, toLocation) {
  const entry = selected.customInventory.find(
    (e) => e.custom_item_id === customItemId,
  );
  if (!entry || entry.storedAt === toLocation) return;

  entry.storedAt = toLocation;

  renderLists(selected, state.data, state.sheet);
  triggerAutoRun();
}
