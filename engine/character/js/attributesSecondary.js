/**
 * Secondary Attributes Builder
 */

const { calculateCarryWeight } = require("../../inventory/js/carryWeight");
const { calculateDamage } = require("./baseDamage");

/**
 * Helpers
 */
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function resolveSecondary({
  base,
  bought = 0,
  modifier = 0,
  maxBought = 5,
  step = 1,
}) {
  const safeBought = clamp(bought, 0, maxBought);

  return {
    base,
    bought: safeBought,
    modifier,
    value: base + safeBought * step + modifier,
  };
}

/**
 * Base formulas
 */
function computeBaseSecondary({ ST, HT, IQ, DX }) {
  return {
    HP: Math.floor((HT * 4 + ST * 2) / 2),
    Mana: Math.floor((IQ * 4 + HT * 2) / 2),
    Toxicity: Math.floor((HT * 4 + ST * 2 + IQ * 2) / 3),

    Will: IQ,
    Vision: IQ,
    Hearing: IQ,
    Smell: IQ,

    BasicSpeed: (HT + DX) / 4,
  };
}

/**
 * Builder
 *
 * @param {Object} primaryAttributes
 * @param {Object} config (bought values + modifiers)
 * @param {number} weight (current carried weight)
 */
function buildSecondaryAttributes(primaryAttributes, config = {}, weight = 0) {
  const ST = primaryAttributes.ST.value;
  const HT = primaryAttributes.HT.value;
  const IQ = primaryAttributes.IQ.value;
  const DX = primaryAttributes.DX.value;

  const base = computeBaseSecondary({ ST, HT, IQ, DX });

  const result = {
    HP: resolveSecondary({
      base: base.HP,
      ...config.HP,
    }),

    Mana: resolveSecondary({
      base: base.Mana,
      ...config.Mana,
    }),

    Toxicity: resolveSecondary({
      base: base.Toxicity,
      ...config.Toxicity,
    }),

    Will: resolveSecondary({
      base: base.Will,
      ...config.Will,
    }),

    Vision: resolveSecondary({
      base: base.Vision,
      ...config.Vision,
    }),

    Hearing: resolveSecondary({
      base: base.Hearing,
      ...config.Hearing,
    }),

    Smell: resolveSecondary({
      base: base.Smell,
      ...config.Smell,
    }),

    BasicSpeed: resolveSecondary({
      base: base.BasicSpeed,
      step: 0.25,
      ...config.BasicSpeed,
    }),
  };

  /**
   * Movement (depends on BasicSpeed + carry weight)
   */
  const carry = calculateCarryWeight(ST, weight);

  const movementBase = Math.floor(
    result.BasicSpeed.value + carry.weight_modifier,
  );

  result.Movement = resolveSecondary({
    base: movementBase,
    ...config.Movement,
  });

  /**
   * Damage (depends on ST)
   * Not a "secondary attribute" → no bought/points
   */
  const damage = calculateDamage(ST, {
    GDP: {
      modifier: config?.damage?.GDP?.modifier,
    },
    BAL: {
      modifier: config?.damage?.BAL?.modifier,
    },
  });

  result.damage = damage;

  /**
   * Points calculation (flat 5 per bought level)
   */
  const points = {};

  Object.entries(result).forEach(([key, attr]) => {
    points[key] = attr.bought * 5;
  });

  return {
    attributes: result,
    points,
  };
}

module.exports = {
  buildSecondaryAttributes,
};
