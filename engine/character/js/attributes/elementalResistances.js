// Final value is floored at 0 but has no upper cap — a character can become arbitrarily weak against an element.
const ELEMENTAL_TYPES = [
  "Fire",
  "Water",
  "Air",
  "Electricity",
  "Earth",
  "Corrosion",
  "Necrotic",
  "Holy",
  "Void",
  "Arcane",
];

// metaRaceMultipliers is already the product of every stacked meta-race (see traits/metaRaces.js's
// resolveMetaRaces) — combined with race here rather than kept as a separate field, per the
// decision to surface race+meta-race as a single combined number in the UI.
function calculateElementalResistances(
  raceMultipliers = {},
  config = {},
  metaRaceMultipliers = {},
) {
  const result = {};

  for (const type of ELEMENTAL_TYPES) {
    const race_base =
      (raceMultipliers[type] ?? 1) * (metaRaceMultipliers[type] ?? 1);
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
