// Final value is floored at 0 but has no upper cap — a character can become arbitrarily weak against an element.
const ELEMENTAL_TYPES = [
  "Fire",
  "Ice",
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
