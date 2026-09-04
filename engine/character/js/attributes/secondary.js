const { calculateCarryWeight } = require("../../../inventory/js/carryWeight");
const { calculateDamage } = require("./baseDamage");

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function resolveSecondary({
  base_value,
  bought = 0,
  modifier = 0,
  enchantment_modifier = 0,
  has_enchantment_modifier = false,
  maxBought = 5,
  step = 1,
}) {
  const safeBought = clamp(bought, 0, maxBought);
  const final_base_value = base_value + safeBought * step;

  return {
    base_value,
    bought: safeBought,
    modifier,
    enchantment_modifier,
    has_enchantment_modifier,
    final_base_value,
    value: final_base_value + modifier + enchantment_modifier,
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

function buildSecondaryAttributes(
  primaryAttributes,
  config = {},
  carry_weight = null,
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
      step: 4,
      ...config.HP,
    }),

    Mana: resolveSecondary({
      base_value: base.Mana,
      step: 4,
      ...config.Mana,
    }),

    Toxicity: resolveSecondary({
      base_value: base.Toxicity,
      step: 4,
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
      step: 0.5,
      maxBought: 6,
      ...config.BasicSpeed,
    }),
  };

  // Halve BasicSpeed (floor) when current HP is below 1/3 of final_base_value; Movement/Dodge are computed after since they cascade from it.
  const hpFinalBase = result.HP.final_base_value;
  const hpCurrent   = result.HP.value;
  if (hpCurrent < hpFinalBase / 3) {
    result.BasicSpeed = {
      ...result.BasicSpeed,
      value: Math.floor(result.BasicSpeed.value / 2),
    };
  }

  const carry = carry_weight || calculateCarryWeight(ST, 0);

  let movementBase = Math.floor(
    result.BasicSpeed.value + carry.weight_modifier,
  );

  if (effects?.secondary?.Movement?.base) {
    movementBase += effects.secondary.Movement.base;
  }

  result.Movement = resolveSecondary({
    base_value: movementBase,
    maxBought: 0,
    bought: 0,
    modifier: config.Movement?.modifier ?? 0,
    enchantment_modifier: config.Movement?.enchantment_modifier ?? 0,
    has_enchantment_modifier:
      config.Movement?.has_enchantment_modifier ?? false,
  });

  let dodgeBase = Math.floor(result.Movement.value + 4);

  if (effects?.secondary?.Dodge?.base) {
    dodgeBase += effects.secondary.Dodge.base;
  }

  result.Dodge = resolveSecondary({
    base_value: dodgeBase,
    ...config.Dodge,
  });

  // Damage isn't a "secondary attribute" — no bought/points.
  const damage = calculateDamage(ST, {
    GDP: {
      modifier: config?.damage?.GDP?.modifier,
    },
    BAL: {
      modifier: config?.damage?.BAL?.modifier,
    },
  });

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
