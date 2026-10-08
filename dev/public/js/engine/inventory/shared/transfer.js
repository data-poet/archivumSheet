import { generateInstanceId } from "../../../store/instanceId.js";
import { withCharacterInventory } from "../../../store/characters.js";
import { cloneEnchantmentsWithFreshIds } from "./enchantments/model.js";

function _defaultCloneInstance(instance, destinationStoredAt) {
  const clone = structuredClone(instance);
  clone.id = generateInstanceId();
  if ("is_equipped" in clone) clone.is_equipped = false;
  clone.storedAt = destinationStoredAt;
  if (clone.enchantments) {
    clone.enchantments = cloneEnchantmentsWithFreshIds(clone.enchantments);
  }
  return clone;
}

// All-or-nothing: the source instance is only removed once the destination write has
// actually landed, so a vanished ally (deleted mid-render) can never lose the item in transit.
// Returns the pushed clone (callers need its id + destination to undo the destination-side
// write too — restoring the source alone would leave the item duplicated) or null on failure.
export function transferInstance({
  sourceArray,
  instanceId,
  destinationCharacterId,
  destinationInventoryKey,
  destinationStoredAt = "backpack",
  canReceive,
  cloneInstance = _defaultCloneInstance,
}) {
  const instance = sourceArray.find((entry) => entry.id === instanceId);
  if (!instance) return null;

  if (canReceive && !canReceive(instance)) return null;

  const clone = cloneInstance(instance, destinationStoredAt);

  const written = withCharacterInventory(destinationCharacterId, (inventory) => {
    inventory[destinationInventoryKey].push(clone);
  });
  if (!written) return null;

  const index = sourceArray.indexOf(instance);
  sourceArray.splice(index, 1);
  return clone;
}

// Reverses a successful transferInstance: removes the clone from the destination.
// Caller is still responsible for restoring its own source array/state.
export function undoTransferInstance({
  destinationCharacterId,
  destinationInventoryKey,
  cloneId,
}) {
  withCharacterInventory(destinationCharacterId, (inventory) => {
    inventory[destinationInventoryKey] = inventory[destinationInventoryKey].filter(
      (entry) => entry.id !== cloneId,
    );
  });
}

// Amount is clamped to the row's current quantity. Merges into a matching destination row
// (same matchKeyFields + storedAt) if one exists, else pushes a fresh row with a new id.
// All-or-nothing on destination-write failure. Returns { destinationRowId, amount } (the
// clamped amount actually moved) or null on failure, since undo needs both to reverse it.
export function transferStackQuantity({
  sourceArray,
  instanceId,
  amount,
  destinationCharacterId,
  destinationInventoryKey,
  destinationStoredAt = "backpack",
  matchKeyFields,
}) {
  const row = sourceArray.find((entry) => entry.id === instanceId);
  if (!row) return null;

  const clamped = Math.min(amount, row.quantity);
  if (clamped <= 0) return null;

  let destinationRowId = null;

  const written = withCharacterInventory(destinationCharacterId, (inventory) => {
    const destArray = inventory[destinationInventoryKey];
    const match = destArray.find(
      (entry) =>
        entry.storedAt === destinationStoredAt &&
        matchKeyFields.every((field) => entry[field] === row[field]),
    );
    if (match) {
      match.quantity += clamped;
      destinationRowId = match.id;
    } else {
      const clone = {
        ...row,
        id: generateInstanceId(),
        quantity: clamped,
        storedAt: destinationStoredAt,
      };
      destArray.push(clone);
      destinationRowId = clone.id;
    }
  });
  if (!written) return null;

  row.quantity -= clamped;
  if (row.quantity <= 0) {
    sourceArray.splice(sourceArray.indexOf(row), 1);
  }

  return { destinationRowId, amount: clamped };
}

// Reverses a successful transferStackQuantity: decrements the destination row by the moved
// amount, removing it entirely if that was the whole row (i.e. no pre-existing merge target).
export function undoTransferStackQuantity({
  destinationCharacterId,
  destinationInventoryKey,
  destinationRowId,
  amount,
}) {
  withCharacterInventory(destinationCharacterId, (inventory) => {
    const row = inventory[destinationInventoryKey].find(
      (entry) => entry.id === destinationRowId,
    );
    if (!row) return;

    row.quantity -= amount;
    if (row.quantity <= 0) {
      inventory[destinationInventoryKey] = inventory[destinationInventoryKey].filter(
        (entry) => entry.id !== destinationRowId,
      );
    }
  });
}
