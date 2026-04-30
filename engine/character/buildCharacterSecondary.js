const { buildSecondaryAttributes } = require("./js/attributesSecondary");
const { buildSkills } = require("./js/skills");

function buildCharacterSecondary({
  primary_attributes,
  secondaryAttributes = {},
  skills = {},
  weight = 0,
  effects = {},
}) {
  /**
   * 1. Secondary attributes (derived stats)
   */
  const secondaryResult = buildSecondaryAttributes(
    primary_attributes,
    secondaryAttributes,
    weight,
    effects,
  );

  /**
   * 2. Skills (UI-driven + normalized)
   *
   * Ensure skills is always an object:
   * { skill_id: { base, modifier } }
   */
  const normalizedSkills = Array.isArray(skills)
    ? Object.fromEntries(
        skills.map((s) => [
          s.skill_id,
          {
            base_value: Number(s.base ?? 0),
            modifier: Number(s.modifier ?? 0),
          },
        ]),
      )
    : skills;

  const skillsResult = buildSkills(normalizedSkills, {
    primary_attributes,
  });

  return {
    secondary_attributes: secondaryResult.attributes,
    base_damage: secondaryResult.damage,

    skills: skillsResult.skills || {},

    character_points: {
      secondary_attributes: secondaryResult.points,
      skills: skillsResult.character_points?.skills || 0,
    },
  };
}

module.exports = {
  buildCharacterSecondary,
};
