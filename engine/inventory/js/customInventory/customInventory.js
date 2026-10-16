const { STORED_AT } = require("../../../../helpers/storage.js");
const { VALID_STORED_AT } = require("./customInventoryConstants.js");

const {
  validateCustomInventoryInstance,
} = require("./customInventoryValidation.js");

const {
  resolveCustomInventoryItem,
  calculateCarriedCustomInventoryWeight,
  calculateCarriedCustomInventoryValue,
} = require("./customInventoryResolver.js");

// No backing database: every item is fully described by its instance. Only backpack items count toward carried weight.
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

    if (instance.storedAt === STORED_AT.STASH) {
      stash.push(resolved);
      continue;
    }

    if (instance.storedAt === STORED_AT.CAMP) {
      camp.push(resolved);
      continue;
    }

    if (instance.storedAt === STORED_AT.BACKPACK) {
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
