import { state } from "../../../state.js";
import { renderListsPreserving } from "../../../ui.js";
import { triggerAutoRun } from "../../../compute/autorun.js";
import { offerUndo } from "../../../components/undo.js";
import { generateInstanceId } from "../../../store/instanceId.js";
import { transferInstance, undoTransferInstance } from "../shared/transfer.js";
import { t } from "../../../localization/pt-BR/index.js";

const selected = state.selected;

// ─────────────────────────────────────────────────────────────────────────────
// STORAGE OPERATIONS
// ─────────────────────────────────────────────────────────────────────────────

// Every field is provided by the caller — there is no DB to look up.
export function addCustomItem({ name, weight, price, quantity, description, storedAt }) {
  if (!name?.trim() || quantity <= 0 || weight < 0 || price < 0) return;

  selected.customInventory.push({
    id: generateInstanceId(),
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

export function updateCustomItemQuantity(customItemId, quantity) {
  if (quantity <= 0) {
    removeCustomItem(customItemId);
    return;
  }

  const entry = selected.customInventory.find(
    (e) => e.id === customItemId,
  );
  if (entry) entry.quantity = quantity;

  renderListsPreserving(selected, state.data, state.sheet);
  triggerAutoRun();
}

export function removeCustomItem(customItemId) {
  const before = structuredClone(selected.customInventory);
  selected.customInventory = selected.customInventory.filter(
    (e) => e.id !== customItemId,
  );

  renderListsPreserving(selected, state.data, state.sheet);
  triggerAutoRun();

  offerUndo(() => {
    selected.customInventory = before;
    renderListsPreserving(selected, state.data, state.sheet);
    triggerAutoRun();
  });
}

export function sendCustomItemToAlly(customItemId, destinationCharacterId, storedAt = "backpack") {
  const before = structuredClone(selected.customInventory);

  const clone = transferInstance({
    sourceArray: selected.customInventory,
    instanceId: customItemId,
    destinationCharacterId,
    destinationInventoryKey: "customInventory",
    destinationStoredAt: storedAt,
  });
  if (!clone) return false;

  renderListsPreserving(selected, state.data, state.sheet);
  triggerAutoRun();

  offerUndo(() => {
    undoTransferInstance({
      destinationCharacterId,
      destinationInventoryKey: "customInventory",
      cloneId: clone.id,
    });
    selected.customInventory = before;
    renderListsPreserving(selected, state.data, state.sheet);
    triggerAutoRun();
  }, t("undo.sentMessage"));

  return true;
}

// Unique per id, so no merging is needed.
export function moveCustomItem(customItemId, toLocation) {
  const entry = selected.customInventory.find(
    (e) => e.id === customItemId,
  );
  if (!entry || entry.storedAt === toLocation) return;

  entry.storedAt = toLocation;

  renderListsPreserving(selected, state.data, state.sheet);
  triggerAutoRun();
}

// ─────────────────────────────────────────────────────────────────────────────
// FIELD UPDATES
// ─────────────────────────────────────────────────────────────────────────────

// Unlike catalog-backed items, every field here IS the item, so invalid input is rejected outright
// rather than silently discarded. Returns true if updated, false if rejected.
export function saveCustomItemFields(customItemId, { name, weight, price, description }) {
  const entry = selected.customInventory.find(
    (e) => e.id === customItemId,
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
