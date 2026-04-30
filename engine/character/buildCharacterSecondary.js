const { buildSecondaryAttributes } = require("./js/attributesSecondary");
const { buildSkills } = require("./js/skills");

function buildCharacterSecondary({
  primary_attributes,
  secondaryAttributes = {},
  skills = [],
  weight = 0,
}) {
  /**
   * 1. Secondary attributes (derived stats)
   */
  const secondaryResult = buildSecondaryAttributes(
    primary_attributes,
    secondaryAttributes,
    weight,
  );

  /**
   * 2. Skills (selection-based like traits)
   */
  const skillsResult = buildSkills(skills, {
    primary_attributes,
  });

  return {
    secondary_attributes: secondaryResult.attributes,

    skills: skillsResult.skills,

    character_points: {
      secondary_attributes: secondaryResult.points,
      skills: skillsResult.character_points.skills,
    },
  };
}

module.exports = {
  buildCharacterSecondary,
};
