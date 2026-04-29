const { buildCharacterPrimary } = require("./buildCharacterPrimary");
const { buildCharacterSecondary } = require("./buildCharacterSecondary");

function buildCharacter({
  advantages = [],
  disadvantages = [],
  primaryAttributes = {},
  secondaryAttributes = {},
  weight = 0,
}) {
  const primary = buildCharacterPrimary({
    advantages,
    disadvantages,
    primaryAttributes,
  });

  const secondary = buildCharacterSecondary({
    primary_attributes: primary.primary_attributes,
    secondaryAttributes,
    weight,
  });

  return {
    character: {
      primary_attributes: primary.primary_attributes,
      secondary_attributes: secondary.secondary_attributes,

      advantages: primary.advantages,
      disadvantages: primary.disadvantages,

      character_points: {
        ...primary.character_points,
        ...secondary.character_points,
      },
    },
  };
}

module.exports = { buildCharacter };
