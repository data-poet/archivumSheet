const { buildCharacterPrimary } = require("./buildCharacterPrimary");
const { buildCharacterSecondary } = require("./buildCharacterSecondary");
const { buildTraitsEffects } = require("./js/traits/effects");

function buildCharacter({
  advantages = [],
  disadvantages = [],
  primaryAttributes = {},
  secondaryAttributes = {},
  skills = [],
  carry_weight = null,
  raceModifiers = {},
  raceElementalMultipliers = {},
  innateAdvantageIds = [],
  innateDisadvantageIds = [],
  enchantmentAttributeModifiers = {},
  enchantmentElementalModifiers = {},
  enchantmentAdvantageIds = [],
  enchantmentDisadvantageIds = [],
  enchantmentSkillGrants = {},
  enchantmentSkillModifiers = {},
}) {
  // enchantment* args come from collectEquippedEnchantments() on resolved equipped items, computed by buildSheet.js before this call.
  const primary = buildCharacterPrimary({
    advantages,
    disadvantages,
    primaryAttributes,
    raceModifiers,
    innateAdvantageIds,
    innateDisadvantageIds,
    enchantmentAttributeModifiers,
    enchantmentAdvantageIds,
    enchantmentDisadvantageIds,
  });

  const effects = buildTraitsEffects({
    advantages: primary.advantages,

    disadvantages: primary.disadvantages,
  });

  const secondary = buildCharacterSecondary({
    primary_attributes: primary.primary_attributes,

    secondaryAttributes,

    skills,

    carry_weight,

    effects,

    advantages: primary.advantages,

    raceElementalMultipliers,

    enchantmentAttributeModifiers,
    enchantmentElementalModifiers,
    enchantmentSkillGrants,
    enchantmentSkillModifiers,
  });

  const primaryPoints = primary.character_points || {};

  const secondaryPoints = secondary.character_points || {};

  return {
    character: {
      primary_attributes: primary.primary_attributes,

      secondary_attributes: secondary.secondary_attributes,

      base_damage: secondary.base_damage,

      elemental_resistances: secondary.elemental_resistances,

      skills: secondary.skills,

      advantages: primary.advantages,

      disadvantages: primary.disadvantages,

      character_points: {
        primary_attributes: primaryPoints.primary_attributes ?? 0,

        secondary_attributes: secondaryPoints.secondary_attributes ?? 0,

        skills: secondaryPoints.skills ?? 0,

        advantages: primaryPoints.advantages ?? 0,

        disadvantages: primaryPoints.disadvantages ?? 0,
      },
    },
  };
}

module.exports = {
  buildCharacter,
};
