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
  // has_enchantment_modifier is presence-based (item touches attribute), not magnitude-based (nonzero sum) — see collectEquippedEnchantments.js.
  const attributesWithRace = {};
  for (const attr of ["ST", "DX", "IQ", "HT"]) {
    attributesWithRace[attr] = {
      ...(primaryAttributes[attr] || {}),
      race_modifier: raceModifiers[attr] ?? 0,
      enchantment_modifier: enchantmentAttributeModifiers[attr] ?? 0,
      has_enchantment_modifier: attr in enchantmentAttributeModifiers,
    };
  }

  // buildAdvantages/buildDisadvantages derive cost (0 if innate/enchantment-granted) and is_race_innate/is_enchantment from the innate/enchantment id lists.
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
