const { buildSecondaryAttributes } = require("./js/attributesSecondary");

const { buildSkills } = require("./js/skills");

function buildCharacterSecondary({
  primary_attributes,

  secondaryAttributes = {},

  skills = {},

  carry_weight = null,

  effects = {},
}) {
  /**
   * ───────────────────────────────────────────────────────────────────────────
   * 1. SECONDARY ATTRIBUTES
   * ───────────────────────────────────────────────────────────────────────────
   *
   * Derived stats:
   *
   * - HP
   * - FP
   * - Dodge
   * - Move
   * - Speed
   * - Base damage
   *
   * These may be affected by:
   *
   * - trait effects
   * - encumbrance
   */

  const secondaryResult = buildSecondaryAttributes(
    primary_attributes,

    secondaryAttributes,

    carry_weight,

    effects,
  );

  /**
   * ───────────────────────────────────────────────────────────────────────────
   * 2. SKILLS
   * ───────────────────────────────────────────────────────────────────────────
   *
   * Normalize UI input into:
   *
   * {
   *   skill_id: {
   *     base_value,
   *     modifier,
   *   }
   * }
   */

  const normalizedSkills = Array.isArray(skills)
    ? Object.fromEntries(
        skills.map((skill) => [
          skill.skill_id,

          {
            base_value: Number(skill.base ?? 0),

            modifier: Number(skill.modifier ?? 0),
          },
        ]),
      )
    : skills;

  const skillsResult = buildSkills(normalizedSkills, {
    primary_attributes,
  });

  /**
   * ───────────────────────────────────────────────────────────────────────────
   * 3. FINAL COMPOSITION
   * ───────────────────────────────────────────────────────────────────────────
   */

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
