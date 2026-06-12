// ─────────────────────────────────────────────────────────────────────────────
// CUSTOM INVENTORY RESOLVER
// ─────────────────────────────────────────────────────────────────────────────

function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

// ─────────────────────────────────────────────────────────────────────────────
// RESOLVE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resolves a custom inventory instance into a display-ready entry.
 *
 * Unlike DB-backed features, there is nothing to merge — all data already
 * lives on the instance. This function normalises the shape and computes
 * derived fields so the rest of the system always gets a consistent object.
 */
function resolveCustomInventoryItem(instance) {
  const total_weight = round2(instance.weight * instance.quantity);

  return {
    custom_item_id: instance.custom_item_id,
    name: instance.name.trim(),
    weight: instance.weight,
    price: instance.price,
    quantity: instance.quantity,
    description: instance.description?.trim() || null,
    storedAt: instance.storedAt,
    total_weight,
    total_value: round2(instance.price * instance.quantity),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// WEIGHT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sums total_weight for all backpack entries.
 * Stash and camp are excluded from carried weight.
 */
function calculateCarriedCustomInventoryWeight(backpackItems) {
  return round2(
    backpackItems.reduce((sum, entry) => sum + entry.total_weight, 0),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VALUE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sums total_value for backpack items only.
 * Stash and camp do not count toward carried value.
 */
function calculateCarriedCustomInventoryValue(backpackItems) {
  return round2(
    backpackItems.reduce((sum, entry) => sum + entry.total_value, 0),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  resolveCustomInventoryItem,
  calculateCarriedCustomInventoryWeight,
  calculateCarriedCustomInventoryValue,
};
