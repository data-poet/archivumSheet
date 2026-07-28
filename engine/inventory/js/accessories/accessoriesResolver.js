function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

// ─────────────────────────────────────────────────────────────────────────────
// RESOLVE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Merges an accessory DB record + instance runtime state into a fully
 * resolved entry.
 *
 * Accessories have no weight and no DB-driven price — price is entirely
 * user-input, since it is highly variable per item.
 */
function resolveAccessoryItem(instance, accessory) {
  const price = Number(instance.price) || 0;

  return {
    // DB BASE
    accessory_id: accessory.accessory_id,
    accessory_name: accessory.accessory_name,
    accessory_equip_limit: accessory.accessory_equip_limit,

    // RUNTIME
    price,
    total_value: round2(price),

    accessory_custom_name: instance.accessory_custom_name?.trim() || null,
    accessory_custom_description:
      instance.accessory_custom_description?.trim() || null,
    accessory_custom_effect:
      instance.accessory_custom_effect?.trim() || null,

    is_equipped: instance.is_equipped,
    storedAt: instance.storedAt,
    _instanceId: instance._instanceId ?? null,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// VALUE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sums total_value for equipped + backpack entries only.
 * Stash and camp are excluded — mirrors the armor/firearms convention.
 */
function calculateCarriedAccessoryValue(equipped, backpackItems) {
  return round2(
    [...equipped, ...backpackItems].reduce(
      (sum, entry) => sum + entry.total_value,
      0,
    ),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  resolveAccessoryItem,
  calculateCarriedAccessoryValue,
};
