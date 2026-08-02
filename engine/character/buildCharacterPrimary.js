const { buildAdvantages } = require("./js/traits/advantages");
const { buildDisadvantages } = require("./js/traits/disadvantages");
const { buildPrimaryAttributes } = require("./js/attributes/primary");

function buildCharacterPrimary({
  advantages = [],
  disadvantages = [],
  primaryAttributes = {},
  raceModifiers = {},
  innateAdvantageIds = [],
  innateDisadvantageIds = [],
  enchantmentAttributeModifiers = {},
  enchantmentAdvantageIds = [],
  enchantmentDisadvantageIds = [],
}) {
  // Merge race modifiers + equipped-enchantment modifiers into each primary
  // attribute input. has_enchantment_modifier is presence-based (does an
  // equipped item touch this attribute at all), not magnitude-based (is the
  // net sum nonzero) — see collectEquippedEnchantments.js.
  const attributesWithRace = {};
  for (const attr of ["ST", "DX", "IQ", "HT"]) {
    attributesWithRace[attr] = {
      ...(primaryAttributes[attr] || {}),
      race_modifier: raceModifiers[attr] ?? 0,
      enchantment_modifier: enchantmentAttributeModifiers[attr] ?? 0,
      has_enchantment_modifier: attr in enchantmentAttributeModifiers,
    };
  }

  // Merge user-selected + innate + enchantment-granted ids (deduplicated)
  // for engine processing. buildAdvantages/buildDisadvantages decide cost
  // (0 for innate or enchantment-granted) and the is_race_innate/
  // is_enchantment flags from the innate/enchantment id lists.
  const allAdvantageIds = [
    ...new Set([
      ...advantages,
      ...innateAdvantageIds,
      ...enchantmentAdvantageIds,
    ]),
  ];
  const allDisadvantageIds = [
    ...new Set([
      ...disadvantages,
      ...innateDisadvantageIds,
      ...enchantmentDisadvantageIds,
    ]),
  ];

  const advantagesResult = buildAdvantages(
    allAdvantageIds,
    innateAdvantageIds,
    enchantmentAdvantageIds,
  );
  const disadvantagesResult = buildDisadvantages(
    allDisadvantageIds,
    innateDisadvantageIds,
    enchantmentDisadvantageIds,
  );
  const primaryAttributesResult = buildPrimaryAttributes(attributesWithRace);

  const primaryPoints = primaryAttributesResult.character_points || {};
  const advPoints = advantagesResult.character_points || {};
  const disPoints = disadvantagesResult.character_points || {};

  return {
    primary_attributes: primaryAttributesResult.primary_attributes,
    advantages: advantagesResult.advantages,
    disadvantages: disadvantagesResult.disadvantages,
    character_points: {
      primary_attributes: primaryPoints,
      advantages: advPoints.advantages ?? 0,
      disadvantages: disPoints.disadvantages ?? 0,
    },
  };
}

module.exports = { buildCharacterPrimary };
