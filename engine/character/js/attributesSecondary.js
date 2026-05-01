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
  base_value,
  bought = 0,
  modifier = 0,
  maxBought = 5,
  step = 1,
}) {
  const safeBought = clamp(bought, 0, maxBought);

  return {
    base_value,
    bought: safeBought,
    modifier,
    value: base_value + safeBought * step + modifier,
    points: safeBought * 5,
  };
}

function applySecondaryBaseEffects(base, effects = {}) {
  const secondaryEffects = effects.secondary || {};

  Object.entries(secondaryEffects).forEach(([key, effect]) => {
    if (effect.base) {
      base[key] = (base[key] ?? 0) + effect.base;
    }
  });

  return base;
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
function buildSecondaryAttributes(
  primaryAttributes,
  config = {},
  weight = 0,
  effects = {},
) {
  const ST = primaryAttributes.ST.value;
  const HT = primaryAttributes.HT.value;
  const IQ = primaryAttributes.IQ.value;
  const DX = primaryAttributes.DX.value;

  const base = computeBaseSecondary({ ST, HT, IQ, DX });
  applySecondaryBaseEffects(base, effects);

  const result = {
    HP: resolveSecondary({
      base_value: base.HP,
      ...config.HP,
    }),

    Mana: resolveSecondary({
      base_value: base.Mana,
      ...config.Mana,
    }),

    Toxicity: resolveSecondary({
      base_value: base.Toxicity,
      ...config.Toxicity,
    }),

    Will: resolveSecondary({
      base_value: base.Will,
      ...config.Will,
    }),

    Vision: resolveSecondary({
      base_value: base.Vision,
      ...config.Vision,
    }),

    Hearing: resolveSecondary({
      base_value: base.Hearing,
      ...config.Hearing,
    }),

    Smell: resolveSecondary({
      base_value: base.Smell,
      ...config.Smell,
    }),

    BasicSpeed: resolveSecondary({
      base_value: base.BasicSpeed,
      step: 0.25,
      ...config.BasicSpeed,
    }),
  };

  /**
   * Movement & Dodge (depends on BasicSpeed + carry weight)
   */
  const carry = calculateCarryWeight(ST, weight);

  let movementBase = Math.floor(
    result.BasicSpeed.value + carry.weight_modifier,
  );

  if (effects?.secondary?.Movement?.base) {
    movementBase += effects.secondary.Movement.base;
  }

  result.Movement = resolveSecondary({
    base_value: movementBase,
    ...config.Movement,
  });

  let dodgeBase = Math.floor(
    result.Movement.value + (carry.weight_modifier + 4),
  );

  if (effects?.secondary?.Dodge?.base) {
    dodgeBase += effects.secondary.Dodge.base;
  }

  result.Dodge = resolveSecondary({
    base_value: dodgeBase,
    ...config.Dodge,
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

  // result.Damage = damage;

  /**
   * Points calculation (flat 5 per bought level)
   */
  const points = {};

  Object.entries(result).forEach(([key, attr]) => {
    points[key] = attr?.bought ? attr.bought * 5 : 0;
  });

  return {
    attributes: result,
    damage,
    points,
  };
}

module.exports = {
  buildSecondaryAttributes,
};
