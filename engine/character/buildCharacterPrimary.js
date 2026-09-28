const { buildAdvantages } = require("./js/traits/advantages");
const { buildDisadvantages } = require("./js/traits/disadvantages");
const { buildPrimaryAttributes } = require("./js/attributes/primary");
const {
  withEnchantmentModifier,
} = require("./js/shared/withEnchantmentModifier");

function buildCharacterPrimary({
  advantages = [],
  disadvantages = [],
  primaryAttributes = {},
  raceModifiers = {},
  innateAdvantageIds = [],
  innateDisadvantageIds = [],
  enchantmentAttributeModifiers = {},
  enchantmentAdvantageIds = [],
  enchantmentDisadvantageIds = [],
  metaRaceAttributeModifiers = {},
  metaRaceAdvantageIds = [],
  metaRaceDisadvantageIds = [],
}) {
  // has_enchantment_modifier is presence-based (item touches attribute), not magnitude-based (nonzero sum) — see collectEquippedEnchantments.js.
  // race_modifier folds in the meta-race attribute delta too — the two are shown as one combined
  // number in the UI (see docs/proposals/meta-race-templates.md), not as separate fields.
  const attributesWithRace = withEnchantmentModifier(
    primaryAttributes,
    enchantmentAttributeModifiers,
    ["ST", "DX", "IQ", "HT"],
    (attr) => ({
      race_modifier:
        (raceModifiers[attr] ?? 0) + (metaRaceAttributeModifiers[attr] ?? 0),
    }),
  );

  // buildAdvantages/buildDisadvantages derive cost (0 if innate/meta-race/enchantment-granted) and
  // is_race_innate/is_meta_race/is_enchantment from the respective id lists.
  const allAdvantageIds = [
    ...new Set([
      ...advantages,
      ...innateAdvantageIds,
      ...metaRaceAdvantageIds,
      ...enchantmentAdvantageIds,
    ]),
  ];
  const allDisadvantageIds = [
    ...new Set([
      ...disadvantages,
      ...innateDisadvantageIds,
      ...metaRaceDisadvantageIds,
      ...enchantmentDisadvantageIds,
    ]),
  ];

  const advantagesResult = buildAdvantages(
    allAdvantageIds,
    innateAdvantageIds,
    enchantmentAdvantageIds,
    metaRaceAdvantageIds,
  );
  const disadvantagesResult = buildDisadvantages(
    allDisadvantageIds,
    innateDisadvantageIds,
    enchantmentDisadvantageIds,
    metaRaceDisadvantageIds,
  );
  const primaryAttributesResult = buildPrimaryAttributes(attributesWithRace);

  const primaryPoints = primaryAttributesResult.character_points || {};
  const advPoints = advantagesResult.character_points || {};
  const disPoints = disadvantagesResult.character_points || {};

  return {
    primary_attributes: primaryAttributesResult.primary_attributes,
    advantages: advantagesResult.advantages,
    disadvantages: disadvantagesResult.disadvantages,
    character_points: {
      primary_attributes: primaryPoints,
      advantages: advPoints.advantages ?? 0,
      disadvantages: disPoints.disadvantages ?? 0,
    },
  };
}

module.exports = { buildCharacterPrimary };
