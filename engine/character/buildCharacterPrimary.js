const { buildAdvantages } = require("./js/traitsAdvantages");
const { buildDisadvantages } = require("./js/traitsDisadvantages");
const { buildPrimaryAttributes } = require("./js/attributesPrimary");

function buildCharacterPrimary({
  advantages = [],
  disadvantages = [],
  primaryAttributes = {},
}) {
  const advantagesResult = buildAdvantages(advantages);
  const disadvantagesResult = buildDisadvantages(disadvantages);
  const primaryAttributesResult = buildPrimaryAttributes(primaryAttributes);

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
