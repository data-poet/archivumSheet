const {
  ATTRIBUTE_EFFECT_TYPES,
  POINT_EFFECT_TYPES,
  SPELL_EFFECT_TYPES,
  DIFFICULTY_EFFECT_TYPES,
  DIFFICULTY_TIER,
} = require("./enchantmentsConstants.js");

function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

// ─────────────────────────────────────────────────────────────────────────────
// PRICE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Computes the price of a single enchantment application.
 *
 * Three formulas, chosen by enchantment_effect_type:
 *
 * - attribute (fortify/weaken): base_price + extraSteps × price_per_extra_value
 *     extraSteps = (|value| - base_value) / step
 *     value is signed (positive fortify, negative weaken) but price only
 *     cares about magnitude — a weaken enchantment costs the same as the
 *     equivalent-strength fortify, not a negative price.
 *
 * - advantage/disadvantage: |target_cost| × price_per_point
 *     target_cost comes from the target's own DB row (advantage_cost /
 *     disadvantage_cost — the latter stored negative, hence the abs()).
 *
 * - skill/spell (add, fortify, weaken — all three share this):
 *     tierIndex(target's difficulty) × price_per_difficulty
 *     + |extraPoints| × price_per_extra_value
 *     extraPoints is signed for fortify/weaken (same reasoning as value
 *     above), unsigned for the plain add/grant type.
 *
 * Phase 1 scope: this only prices the application. It does not check
 * whether the character already knows the target skill/spell — that's a
 * Phase 3 (character effects) concern.
 */
function resolveEnchantmentPrice(entry, enchantment, targetsDb) {
  const type = enchantment.enchantment_effect_type;

  if (ATTRIBUTE_EFFECT_TYPES.includes(type)) {
    const base = enchantment.enchantment_base_value || 0;
    const step = enchantment.enchantment_step || 0;
    const magnitude = Math.abs(Number(entry.value ?? base));

    const extraSteps = step > 0 ? Math.round((magnitude - base) / step) : 0;

    return round2(
      (enchantment.enchantment_base_price || 0) +
        extraSteps * (enchantment.enchantment_price_per_extra_value || 0),
    );
  }

  if (POINT_EFFECT_TYPES.includes(type)) {
    const source =
      type === "advantage" ? targetsDb.advantages : targetsDb.disadvantages;

    const cost = source[entry.target]?.cost || 0;

    return round2(
      Math.abs(cost) * (enchantment.enchantment_price_per_point || 0),
    );
  }

  if (DIFFICULTY_EFFECT_TYPES.includes(type)) {
    const isSpell = SPELL_EFFECT_TYPES.includes(type);
    const source = isSpell ? targetsDb.spells : targetsDb.skills;

    const difficulty = source[entry.target]?.difficulty;
    const tierIndex = DIFFICULTY_TIER[difficulty] || 0;
    const extraPoints = Math.abs(Number(entry.extraPoints || 0));

    return round2(
      tierIndex * (enchantment.enchantment_price_per_difficulty || 0) +
        extraPoints * (enchantment.enchantment_price_per_extra_value || 0),
    );
  }

  return 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// RESOLVE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Merges one enchantment instance entry + its DB record into a fully
 * resolved, display-ready application.
 */
function resolveEnchantmentEntry(entry, enchantment, targetsDb) {
  const price = resolveEnchantmentPrice(entry, enchantment, targetsDb);

  return {
    enchantment_id: enchantment.enchantment_id,
    enchantment_name: enchantment.enchantment_name,
    enchantment_effect_type: enchantment.enchantment_effect_type,

    target: entry.target ?? enchantment.enchantment_target ?? null,
    value: entry.value ?? null,
    extraPoints: entry.extraPoints ?? null,

    price,

    _instanceId: entry._instanceId ?? null,
  };
}

/**
 * Resolves every enchantment attached to a single item instance and sums
 * their price. Unlimited enchantments per item — no slot system.
 */
function resolveItemEnchantments(entries, enchantmentsDb, targetsDb) {
  const resolved = entries.map((entry) =>
    resolveEnchantmentEntry(
      entry,
      enchantmentsDb[entry.enchantment_id],
      targetsDb,
    ),
  );

  const total_price = round2(
    resolved.reduce((sum, resolvedEntry) => sum + resolvedEntry.price, 0),
  );

  return { resolved, total_price };
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  resolveEnchantmentPrice,
  resolveEnchantmentEntry,
  resolveItemEnchantments,
};
