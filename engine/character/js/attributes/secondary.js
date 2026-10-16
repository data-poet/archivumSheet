const { calculateCarryWeight } = require("../../../inventory/js/carryWeight");
const { calculateDamage } = require("./baseDamage");
const {
  POINTS_PER_PURCHASE,
  DEFAULT_SECONDARY_PURCHASE,
  SECONDARY_PURCHASE,
} = require("../../../../helpers/rules");

const LOW_RESERVES = ["HP", "FP"];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function resolveSecondary({
  base_value,
  bought = 0,
  modifier = 0,
  enchantment_modifier = 0,
  has_enchantment_modifier = false,
  max_modifier = 0,
  maxBought = DEFAULT_SECONDARY_PURCHASE.maxBought,
  step = DEFAULT_SECONDARY_PURCHASE.step,
}) {
  const safeBought = clamp(bought, 0, maxBought);
  const final_base_value = base_value + safeBought * step;

  return {
    base_value,
    bought: safeBought,
    modifier,
    enchantment_modifier,
    has_enchantment_modifier,
    max_modifier,
    final_base_value,
    value: final_base_value + modifier + enchantment_modifier + max_modifier,
    points: safeBought * POINTS_PER_PURCHASE,
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
    FP: HT,
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
      ...SECONDARY_PURCHASE.HP,
      ...config.HP,
    }),

    FP: resolveSecondary({
      base_value: base.FP,
      ...SECONDARY_PURCHASE.FP,
      ...config.FP,
    }),

    Mana: resolveSecondary({
      base_value: base.Mana,
      ...SECONDARY_PURCHASE.Mana,
      ...config.Mana,
    }),

    Toxicity: resolveSecondary({
      base_value: base.Toxicity,
      ...SECONDARY_PURCHASE.Toxicity,
      ...config.Toxicity,
    }),

    Will: resolveSecondary({
      base_value: base.Will,
      ...SECONDARY_PURCHASE.Will,
      ...config.Will,
    }),

    Vision: resolveSecondary({
      base_value: base.Vision,
      ...SECONDARY_PURCHASE.Vision,
      ...config.Vision,
    }),

    Hearing: resolveSecondary({
      base_value: base.Hearing,
      ...SECONDARY_PURCHASE.Hearing,
      ...config.Hearing,
    }),

    Smell: resolveSecondary({
      base_value: base.Smell,
      ...SECONDARY_PURCHASE.Smell,
      ...config.Smell,
    }),

    BasicSpeed: resolveSecondary({
      base_value: base.BasicSpeed,
      ...SECONDARY_PURCHASE.BasicSpeed,
      ...config.BasicSpeed,
    }),

    DamageResistance: resolveSecondary({
      base_value: 0,
      ...SECONDARY_PURCHASE.DamageResistance,
      ...config.DamageResistance,
    }),
  };

  const carry = carry_weight || calculateCarryWeight(ST, 0);

  let basicMove = Math.floor(result.BasicSpeed.value);

  if (effects?.secondary?.Movement?.base) {
    basicMove += effects.secondary.Movement.base;
  }

  const unencumbered = resolveSecondary({
    base_value: basicMove,
    ...SECONDARY_PURCHASE.Movement,
    bought: 0,
    modifier: config.Movement?.modifier ?? 0,
    enchantment_modifier: config.Movement?.enchantment_modifier ?? 0,
    has_enchantment_modifier:
      config.Movement?.has_enchantment_modifier ?? false,
  });

  result.Movement = {
    ...unencumbered,
    value:
      carry.move_factor === 0
        ? 0
        : Math.max(1, Math.floor(unencumbered.value * carry.move_factor)),
  };

  // Dodge starts from unencumbered Move (house: Move + 4) so the 4e load penalty isn't counted twice.
  let dodgeBase = Math.floor(unencumbered.value + 4) + carry.dodge_penalty;

  if (effects?.secondary?.Dodge?.base) {
    dodgeBase += effects.secondary.Dodge.base;
  }

  result.Dodge = resolveSecondary({
    base_value: dodgeBase,
    ...SECONDARY_PURCHASE.Dodge,
    bought: 0,
    modifier: config.Dodge?.modifier ?? 0,
    enchantment_modifier: config.Dodge?.enchantment_modifier ?? 0,
    has_enchantment_modifier: config.Dodge?.has_enchantment_modifier ?? false,
  });

  // 4e B419/B426: each reserve under 1/3 of its natural max (gear bonuses excluded) halves current Move and Dodge, rounding up; they stack.
  LOW_RESERVES.forEach((key) => {
    if (result[key].value >= result[key].final_base_value / 3) return;
    result.Movement = {
      ...result.Movement,
      value: Math.ceil(result.Movement.value / 2),
    };
    result.Dodge = {
      ...result.Dodge,
      value: Math.ceil(result.Dodge.value / 2),
    };
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
    points[key] = attr?.points ?? 0;
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
