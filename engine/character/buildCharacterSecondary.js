const { buildSecondaryAttributes } = require("./js/attributes/secondary");
const { buildSkills } = require("./js/skills/skills");

const SECONDARY_ATTRS = [
  "HP",
  "Mana",
  "Toxicity",
  "Will",
  "Vision",
  "Hearing",
  "Smell",
  "BasicSpeed",
  "Movement",
  "Dodge",
];

function buildCharacterSecondary({
  primary_attributes,
  secondaryAttributes = {},
  skills = {},
  carry_weight = null,
  effects = {},
  advantages = {},
  enchantmentAttributeModifiers = {},
  enchantmentSkillGrants = {},
  enchantmentSkillModifiers = {},
}) {
  /**
   * ───────────────────────────────────────────────────────────────────────────
   * 1. SECONDARY ATTRIBUTES
   * ───────────────────────────────────────────────────────────────────────────
   *
   * Merge equipped-enchantment modifiers into each secondary attribute's
   * config before resolving — same has_enchantment_modifier presence-flag
   * pattern as buildCharacterPrimary uses for ST/DX/IQ/HT.
   */

  const secondaryWithEnchantments = {};
  for (const attr of SECONDARY_ATTRS) {
    secondaryWithEnchantments[attr] = {
      ...(secondaryAttributes[attr] || {}),
      enchantment_modifier: enchantmentAttributeModifiers[attr] ?? 0,
      has_enchantment_modifier: attr in enchantmentAttributeModifiers,
    };
  }

  const secondaryResult = buildSecondaryAttributes(
    primary_attributes,
    secondaryWithEnchantments,
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
   *     isTrainedWithMaster,
   *   }
   * }
   */

  const normalizedSkills = Array.isArray(skills)
    ? Object.fromEntries(
        skills.map((skill) => [
          skill.skill_id,
          {
            base_value: Number(skill.base_value ?? skill.base ?? 0),
            modifier: Number(skill.modifier ?? 0),
            isTrainedWithMaster: Boolean(skill.isTrainedWithMaster ?? false),
          },
        ]),
      )
    : skills;

  const skillsResult = buildSkills(
    normalizedSkills,
    { primary_attributes },
    advantages,
    enchantmentSkillGrants,
    enchantmentSkillModifiers,
  );

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
