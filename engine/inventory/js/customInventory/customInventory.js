const { VALID_STORED_AT } = require("./customInventoryConstants.js");

const {
  validateCustomInventoryInstance,
} = require("./customInventoryValidation.js");

const {
  resolveCustomInventoryItem,
  calculateCarriedCustomInventoryWeight,
  calculateCarriedCustomInventoryValue,
} = require("./customInventoryResolver.js");

/**
 * Builds the resolved custom inventory, distributed across storage locations.
 *
 * There is no backing database — every item is fully self-described by the
 * instance object. Only backpack items contribute to carried weight.
 */
function buildCustomInventorySlots(customInventory = []) {

  const instanceErrors = customInventory.flatMap((instance, index) =>
    validateCustomInventoryInstance(instance, index),
  );

  if (instanceErrors.length > 0) {
    throw new Error(
      `[buildCustomInventorySlots] Invalid customInventory:\n${instanceErrors.join("\n")}`,
    );
  }

  const stash = [];
  const camp = [];
  const backpack = [];

  for (const instance of customInventory) {
    const resolved = resolveCustomInventoryItem(instance);

    if (instance.storedAt === "stash") {
      stash.push(resolved);
      continue;
    }

    if (instance.storedAt === "camp") {
      camp.push(resolved);
      continue;
    }

    if (instance.storedAt === "backpack") {
      backpack.push(resolved);
    }
  }

  const carried_custom_inventory_weight =
    calculateCarriedCustomInventoryWeight(backpack);
  const carried_custom_inventory_value =
    calculateCarriedCustomInventoryValue(backpack);

  return {
    stash,
    camp,
    backpack,
    carried_custom_inventory_weight,
    carried_custom_inventory_value,
  };
}

module.exports = {
  buildCustomInventorySlots,
  VALID_STORED_AT,
};
