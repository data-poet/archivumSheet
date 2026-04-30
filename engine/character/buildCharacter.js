const { buildCharacterPrimary } = require("./buildCharacterPrimary");
const { buildCharacterSecondary } = require("./buildCharacterSecondary");
const { buildTraitsEffects } = require("./js/traitsEffects");

function buildCharacter({
  advantages = [],
  disadvantages = [],
  primaryAttributes = {},
  secondaryAttributes = {},
  skills = [],
  weight = 0,
}) {
  // 1. PRIMARY LAYER (base character definition)
  const primary = buildCharacterPrimary({
    advantages,
    disadvantages,
    primaryAttributes,
  });

  // 1.5 ADVANTAGES & DISADVANTAGES EFFECTS
  const effects = buildTraitsEffects({
    advantages,
    disadvantages,
  });

  // 2. DERIVED LAYER (secondary stats + skills)
  const secondary = buildCharacterSecondary({
    primary_attributes: primary.primary_attributes,
    secondaryAttributes,
    skills,
    weight,
    effects,
  });

  // 3. SAFE EXTRACTION (prevents undefined crashes in expansion)
  const primaryPoints = primary.character_points || {};
  const secondaryPoints = secondary.character_points || {};

  // 4. FINAL COMPOSITION (deterministic structure)
  return {
    character: {
      primary_attributes: primary.primary_attributes,

      secondary_attributes: secondary.secondary_attributes,
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

module.exports = { buildCharacter };
