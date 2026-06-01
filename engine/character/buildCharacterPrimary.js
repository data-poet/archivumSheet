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
}) {
  // Merge race modifiers into each primary attribute input
  const attributesWithRace = {};
  for (const attr of ["ST", "DX", "IQ", "HT"]) {
    attributesWithRace[attr] = {
      ...(primaryAttributes[attr] || {}),
      race_modifier: raceModifiers[attr] ?? 0,
    };
  }

  // Merge user-selected + innate ids (deduplicated) for engine processing
  const allAdvantageIds = [
    ...new Set([...advantages, ...innateAdvantageIds]),
  ];
  const allDisadvantageIds = [
    ...new Set([...disadvantages, ...innateDisadvantageIds]),
  ];

  const advantagesResult = buildAdvantages(allAdvantageIds, innateAdvantageIds);
  const disadvantagesResult = buildDisadvantages(allDisadvantageIds, innateDisadvantageIds);
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
