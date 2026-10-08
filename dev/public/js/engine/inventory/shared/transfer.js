import { generateInstanceId } from "../../../store/instanceId.js";
import { withCharacterInventory } from "../../../store/characters.js";
import { cloneEnchantmentsWithFreshIds } from "./enchantments/model.js";

function _defaultCloneInstance(instance, destinationStoredAt) {
  const clone = structuredClone(instance);
  clone.id = generateInstanceId();
  clone.is_equipped = false;
  clone.storedAt = destinationStoredAt;
  if (clone.enchantments) {
    clone.enchantments = cloneEnchantmentsWithFreshIds(clone.enchantments);
  }
  return clone;
}

// All-or-nothing: the source instance is only removed once the destination write has
// actually landed, so a vanished ally (deleted mid-render) can never lose the item in transit.
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
  if (!instance) return false;

  if (canReceive && !canReceive(instance)) return false;

  const clone = cloneInstance(instance, destinationStoredAt);

  const written = withCharacterInventory(destinationCharacterId, (inventory) => {
    inventory[destinationInventoryKey].push(clone);
  });
  if (!written) return false;

  const index = sourceArray.indexOf(instance);
  sourceArray.splice(index, 1);
  return true;
}
