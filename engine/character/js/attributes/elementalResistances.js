/**
 * Elemental Damage Resistances
 *
 * Percentage-based damage multipliers per element (1 = normal damage).
 * Unlike other secondary attributes, there is no "bought"/points concept
 * here — just race_base (from the race CSV) + modifier (player) +
 * enchantment_modifier (equipment, unwired for now — see
 * collectEquippedEnchantments.js, which doesn't produce elemental targets
 * yet). Same has_enchantment_modifier presence-flag pattern as
 * buildCharacterPrimary/buildCharacterSecondary use elsewhere.
 *
 * These are percentages, not flat stats: modifiers can push the final
 * value down to (but not below) zero, but there is no upper cap — a
 * character can become arbitrarily weak against an element.
 */

const ELEMENTAL_TYPES = [
  "Fire",
  "Water",
  "Earth",
  "Air",
  "Electricity",
  "Corrosion",
  "Necrotic",
  "Holy",
  "Void",
  "Arcane",
];

function calculateElementalResistances(raceMultipliers = {}, config = {}) {
  const result = {};

  for (const type of ELEMENTAL_TYPES) {
    const race_base = raceMultipliers[type] ?? 1;
    const modifier = config[type]?.modifier ?? 0;
    const enchantment_modifier = config[type]?.enchantment_modifier ?? 0;
    const has_enchantment_modifier =
      config[type]?.has_enchantment_modifier ?? false;

    result[type] = {
      race_base,
      modifier,
      enchantment_modifier,
      has_enchantment_modifier,
      final: Math.max(0, race_base + modifier + enchantment_modifier),
    };
  }

  return result;
}

module.exports = {
  ELEMENTAL_TYPES,
  calculateElementalResistances,
};
