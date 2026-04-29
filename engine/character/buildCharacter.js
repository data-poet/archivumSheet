const { buildAdvantages } = require("./js/traitsAdvantages");
const { buildDisadvantages } = require("./js/traitsDisadvantages");
const { buildPrimaryAttributes } = require("./js/attributesPrimary");

/**
 * Builds full character sheet from selected IDs
 */
function buildCharacter({
  advantages = [],
  disadvantages = [],
  primaryAttributes = {},
}) {
  const advantagesResult = buildAdvantages(advantages);
  const disadvantagesResult = buildDisadvantages(disadvantages);
  const primaryAttributesResult = buildPrimaryAttributes(primaryAttributes);

  return {
    character: {
      primary_attributes: primaryAttributesResult.primary_attributes,
      advantages: advantagesResult.advantages,
      disadvantages: disadvantagesResult.disadvantages,

      character_points: {
        primary_attributes: primaryAttributesResult.character_points,
        advantages: advantagesResult.character_points.advantages,
        disadvantages: disadvantagesResult.character_points.disadvantages,
      },
    },
  };
}

module.exports = { buildCharacter };
