const { VALID_STORED_AT } = require("./customInventoryConstants.js");

const {
  validateCustomInventoryInstance,
} = require("./customInventoryValidation.js");

const {
  resolveCustomInventoryItem,
  calculateCarriedCustomInventoryWeight,
} = require("./customInventoryResolver.js");

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Builds the resolved custom inventory, distributed across storage locations.
 *
 * There is no backing database — every item is fully self-described by the
 * instance object. Only backpack items contribute to carried weight.
 */
function buildCustomInventorySlots(customInventory = []) {
  // ── VALIDATE ──────────────────────────────────────────────────────────────

  const instanceErrors = customInventory.flatMap((instance, index) =>
    validateCustomInventoryInstance(instance, index),
  );

  if (instanceErrors.length > 0) {
    throw new Error(
      `[buildCustomInventorySlots] Invalid customInventory:\n${instanceErrors.join("\n")}`,
    );
  }

  // ── BUILD BUCKETS ─────────────────────────────────────────────────────────

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

  // ── TOTALS ────────────────────────────────────────────────────────────────

  const carried_custom_inventory_weight =
    calculateCarriedCustomInventoryWeight(backpack);

  return {
    stash,
    camp,
    backpack,
    carried_custom_inventory_weight,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  buildCustomInventorySlots,
  VALID_STORED_AT,
};
