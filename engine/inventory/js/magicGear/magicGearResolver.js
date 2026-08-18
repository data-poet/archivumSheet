const {
  resolveItemEnchantments,
} = require("../shared/enchantmentsResolver.js");

function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

// ─────────────────────────────────────────────────────────────────────────────
// RESOLVE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Merges a magic gear DB record + instance runtime state into a fully
 * resolved entry.
 *
 * Unlike accessories, price and weight are entirely DB-driven (catalog
 * values from db_magic_gear.csv) — no user-input price field. Enchantment
 * price is intrinsic to the item and counts toward total_value regardless
 * of equip state, same convention as accessories.
 */
function resolveMagicGearItem(
  instance,
  magicGear,
  enchantmentsDb = {},
  targetsDb = {},
) {
  const price = Number(magicGear.magic_gear_price) || 0;
  const weight = Number(magicGear.magic_gear_weight) || 0;

  const { resolved: enchantments, total_price: enchantments_total_price } =
    resolveItemEnchantments(
      instance.enchantments || [],
      enchantmentsDb,
      targetsDb,
    );

  return {
    // DB BASE
    magic_gear_id: magicGear.magic_gear_id,
    magic_gear_name: magicGear.magic_gear_name,
    magic_gear_price: price,
    magic_gear_weight: weight,

    // RUNTIME
    enchantments,
    enchantments_total_price,
    total_value: round2(price + enchantments_total_price),
    total_weight: weight,

    magic_gear_custom_name: instance.magic_gear_custom_name?.trim() || null,
    magic_gear_custom_description:
      instance.magic_gear_custom_description?.trim() || null,
    magic_gear_custom_effect: instance.magic_gear_custom_effect?.trim() || null,

    is_equipped: instance.is_equipped,
    storedAt: instance.storedAt,
    _instanceId: instance._instanceId ?? null,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// VALUE / WEIGHT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sums total_value for equipped + backpack entries only.
 * Stash and camp are excluded — mirrors the armor/accessories convention.
 */
function calculateCarriedMagicGearValue(equipped, backpackItems) {
  return round2(
    [...equipped, ...backpackItems].reduce(
      (sum, entry) => sum + entry.total_value,
      0,
    ),
  );
}

/**
 * Sums total_weight for equipped + backpack entries only.
 * Stash and camp are excluded — mirrors the armor/accessories convention.
 */
function calculateCarriedMagicGearWeight(equipped, backpackItems) {
  return round2(
    [...equipped, ...backpackItems].reduce(
      (sum, entry) => sum + entry.total_weight,
      0,
    ),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  resolveMagicGearItem,
  calculateCarriedMagicGearValue,
  calculateCarriedMagicGearWeight,
};
