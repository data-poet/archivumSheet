const {
  POINT_EFFECT_TYPES,
  SPELL_EFFECT_TYPES,
  DIFFICULTY_EFFECT_TYPES,
  VALUE_EFFECT_TYPES,
  FLAT_EFFECT_TYPES,
  DIFFICULTY_TIER,
} = require("./enchantmentsConstants.js");

function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

// value/extraPoints are signed (positive fortify, negative weaken) but price only cares about magnitude, so a weaken costs the same as the equivalent-strength fortify.
// disadvantage_cost is stored negative in the DB, hence the abs() on advantage/disadvantage pricing.
// This only prices the application — it doesn't check whether the character already knows the target skill/spell.
function resolveEnchantmentPrice(entry, enchantment, targetsDb) {
  const type = enchantment.enchantment_effect_type;

  if (VALUE_EFFECT_TYPES.includes(type)) {
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

  if (FLAT_EFFECT_TYPES.includes(type)) {
    return round2(enchantment.enchantment_base_price || 0);
  }

  return 0;
}

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

// Keyed by enchantment_id rather than effect_type: flat effects sharing a type (e.g. special_effect) are still individually distinct.
function hasEnchantment(resolvedEnchantments, enchantmentId) {
  return resolvedEnchantments.some(
    (entry) => entry.enchantment_id === enchantmentId,
  );
}

module.exports = {
  resolveEnchantmentPrice,
  resolveEnchantmentEntry,
  resolveItemEnchantments,
  hasEnchantment,
};
