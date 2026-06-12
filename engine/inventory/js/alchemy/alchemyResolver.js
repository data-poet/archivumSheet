// ─────────────────────────────────────────────────────────────────────────────
// ALCHEMY RESOLVER
// ─────────────────────────────────────────────────────────────────────────────

function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

// ─────────────────────────────────────────────────────────────────────────────
// RESOLVE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Merges a consumable DB record + instance state into a fully resolved entry.
 */
function resolveAlchemyConsumable(instance, consumable) {
  const total_weight = round2(consumable.consumable_weight * instance.quantity);

  return {
    // DB BASE
    consumable_id: consumable.consumable_id,
    consumable_name: consumable.consumable_name,
    consumable_box_name: consumable.consumable_box_name,
    consumable_tier: consumable.consumable_tier,
    consumable_type: consumable.consumable_type,
    consumable_category: consumable.consumable_category,
    consumable_ingredients: consumable.consumable_ingredients,
    consumable_duration: consumable.consumable_duration,
    consumable_effect: consumable.consumable_effect,
    consumable_toxicity: consumable.consumable_toxicity,
    consumable_price: consumable.consumable_price,
    consumable_weight: consumable.consumable_weight,
    consumable_method: consumable.consumable_method,
    consumable_effect_area: consumable.consumable_effect_area,

    // RUNTIME
    quantity: instance.quantity,
    storedAt: instance.storedAt,
    total_weight,
    total_value: round2(consumable.consumable_price * instance.quantity),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// WEIGHT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sums the total weight that counts toward carry.
 *
 * Only backpack consumables count.
 * Stash and camp are excluded.
 */
function calculateCarriedAlchemyWeight(backpackConsumables) {
  return round2(
    backpackConsumables.reduce((sum, entry) => sum + entry.total_weight, 0),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VALUE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sums total_value for backpack consumables only.
 * Stash and camp do not count toward carried value.
 */
function calculateCarriedAlchemyValue(backpackConsumables) {
  return round2(
    backpackConsumables.reduce((sum, entry) => sum + entry.total_value, 0),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  resolveAlchemyConsumable,
  calculateCarriedAlchemyWeight,
  calculateCarriedAlchemyValue,
};
