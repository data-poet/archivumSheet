const { buildSecondaryAttributes } = require("./js/attributesSecondary");

function buildCharacterSecondary({
  primary_attributes,
  secondaryAttributes = {},
  weight = 0,
}) {
  const secondaryResult = buildSecondaryAttributes(
    primary_attributes,
    secondaryAttributes,
    weight,
  );

  return {
    secondary_attributes: secondaryResult.attributes,
    character_points: {
      secondary_attributes: secondaryResult.points,
    },
  };
}

module.exports = { buildCharacterSecondary };
