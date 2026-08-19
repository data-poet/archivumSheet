import { state } from "../../../state.js";
import { renderListsPreserving } from "../../../ui.js";
import { triggerAutoRun } from "../../../compute/autorun.js";
import { offerUndo } from "../../../components/undo.js";

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

  renderListsPreserving(selected, state.data, state.sheet);
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

  renderListsPreserving(selected, state.data, state.sheet);
  triggerAutoRun();
}

/** Remove an entry entirely by its custom_item_id. */
export function removeCustomItem(customItemId) {
  const before = structuredClone(selected.customInventory);
  selected.customInventory = selected.customInventory.filter(
    (e) => e.custom_item_id !== customItemId,
  );

  renderListsPreserving(selected, state.data, state.sheet);
  triggerAutoRun();

  offerUndo(() => {
    selected.customInventory = before;
    renderListsPreserving(selected, state.data, state.sheet);
    triggerAutoRun();
  });
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

  renderListsPreserving(selected, state.data, state.sheet);
  triggerAutoRun();
}

// ─────────────────────────────────────────────────────────────────────────────
// FIELD UPDATES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Commits name/weight/price/description at once — called only when the
 * user presses "Salvar" in the edit form, never on individual keystrokes.
 * Unlike catalog-backed items, every field here IS the item (there's no
 * underlying DB record to fall back to), so invalid input is rejected
 * outright rather than silently discarded.
 *
 * @returns {boolean} true if the entry was updated, false if rejected
 */
export function saveCustomItemFields(customItemId, { name, weight, price, description }) {
  const entry = selected.customInventory.find(
    (e) => e.custom_item_id === customItemId,
  );
  if (!entry) return false;

  const trimmedName = name?.trim();
  if (!trimmedName || isNaN(weight) || weight < 0 || isNaN(price) || price < 0) {
    return false;
  }

  entry.name        = trimmedName;
  entry.weight       = weight;
  entry.price        = price;
  entry.description  = description?.trim() || null;

  renderListsPreserving(selected, state.data, state.sheet);
  triggerAutoRun();
  return true;
}
