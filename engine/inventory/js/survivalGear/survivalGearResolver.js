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
    adventure_gear_observation: gear.adventure_gear_observation,

    // RUNTIME
    quantity: instance.quantity,
    storedAt: instance.storedAt,
    total_weight,
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
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  resolveSurvivalGearItem,
  calculateCarriedSurvivalGearWeight,
};
