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
