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
  innateAdvantageIds = [],
  innateDisadvantageIds = [],
}) {
  /**
   * ───────────────────────────────────────────────────────────────────────────
   * 1. PRIMARY LAYER
   * ───────────────────────────────────────────────────────────────────────────
   *
   * Base character definition:
   *
   * - primary attributes
   * - traits
   * - base costs
   */

  const primary = buildCharacterPrimary({
    advantages,
    disadvantages,
    primaryAttributes,
    raceModifiers,
    innateAdvantageIds,
    innateDisadvantageIds,
  });

  /**
   * ───────────────────────────────────────────────────────────────────────────
   * 1.5 TRAIT EFFECTS
   * ───────────────────────────────────────────────────────────────────────────
   */

  const effects = buildTraitsEffects({
    advantages: primary.advantages,

    disadvantages: primary.disadvantages,
  });

  /**
   * ───────────────────────────────────────────────────────────────────────────
   * 2. DERIVED LAYER
   * ───────────────────────────────────────────────────────────────────────────
   *
   * Derived systems:
   *
   * - secondary attributes
   * - base damage
   * - skills
   *
   * These may depend on:
   *
   * - trait effects
   * - encumbrance penalties
   */

  const secondary = buildCharacterSecondary({
    primary_attributes: primary.primary_attributes,

    secondaryAttributes,

    skills,

    carry_weight,

    effects,

    advantages: primary.advantages,
  });

  /**
   * ───────────────────────────────────────────────────────────────────────────
   * 3. SAFE EXTRACTION
   * ───────────────────────────────────────────────────────────────────────────
   */

  const primaryPoints = primary.character_points || {};

  const secondaryPoints = secondary.character_points || {};

  /**
   * ───────────────────────────────────────────────────────────────────────────
   * 4. FINAL COMPOSITION
   * ───────────────────────────────────────────────────────────────────────────
   */

  return {
    character: {
      primary_attributes: primary.primary_attributes,

      secondary_attributes: secondary.secondary_attributes,

      base_damage: secondary.base_damage,

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
