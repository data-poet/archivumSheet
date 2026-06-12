// ─────────────────────────────────────────────────────────────────────────────
// SURVIVAL GEAR RESOLVER
// ─────────────────────────────────────────────────────────────────────────────

function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

// ─────────────────────────────────────────────────────────────────────────────
// RESOLVE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Merges a survival gear DB record + instance state into a fully resolved entry.
 */
function resolveSurvivalGearItem(instance, gear) {
  const total_weight = round2(gear.adventure_gear_weight * instance.quantity);

  return {
    // DB BASE
    adventure_gear_id: gear.adventure_gear_id,
    adventure_gear_name: gear.adventure_gear_name,
    adventure_gear_type: gear.adventure_gear_type,
    adventure_gear_price: gear.adventure_gear_price,
    adventure_gear_weight: gear.adventure_gear_weight,

    // RUNTIME
    quantity: instance.quantity,
    storedAt: instance.storedAt,
    total_weight,
    total_value: round2(gear.adventure_gear_price * instance.quantity),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// WEIGHT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sums the total weight that counts toward carry.
 *
 * Only backpack items count.
 * Stash and camp are excluded.
 */
function calculateCarriedSurvivalGearWeight(backpackItems) {
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
function calculateCarriedSurvivalGearValue(backpackItems) {
  return round2(
    backpackItems.reduce((sum, entry) => sum + entry.total_value, 0),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  resolveSurvivalGearItem,
  calculateCarriedSurvivalGearWeight,
  calculateCarriedSurvivalGearValue,
};
