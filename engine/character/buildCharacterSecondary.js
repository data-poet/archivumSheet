const { buildSecondaryAttributes } = require("./js/attributes/secondary");
const { buildSkills } = require("./js/skills/skills");
const {
  ELEMENTAL_TYPES,
  calculateElementalResistances,
} = require("./js/attributes/elementalResistances");

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
  raceElementalMultipliers = {},
  enchantmentAttributeModifiers = {},
  enchantmentElementalModifiers = {},
  enchantmentSkillGrants = {},
  enchantmentSkillModifiers = {},
}) {
  // Same has_enchantment_modifier presence-flag pattern as buildCharacterPrimary uses for ST/DX/IQ/HT.
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

  // No equipped enchantment currently produces enchantmentElementalModifiers, so this stays empty until that's wired up.
  const elementalWithEnchantments = {};
  for (const type of ELEMENTAL_TYPES) {
    elementalWithEnchantments[type] = {
      ...(secondaryAttributes.elementalResistances?.[type] || {}),
      enchantment_modifier: enchantmentElementalModifiers[type] ?? 0,
      has_enchantment_modifier: type in enchantmentElementalModifiers,
    };
  }

  const elementalResistances = calculateElementalResistances(
    raceElementalMultipliers,
    elementalWithEnchantments,
  );

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

  return {
    secondary_attributes: secondaryResult.attributes,

    base_damage: secondaryResult.damage,

    elemental_resistances: elementalResistances,

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
