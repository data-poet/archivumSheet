/**
 * Dice Rules
 */

function getGDPDice(ST) {
  if (ST > 26) return "3d6";
  if (ST > 18 && ST <= 26) return "2d6";
  if (ST > 4 && ST <= 18) return "1d6";
  return "0d6";
}

function getBALDice(ST) {
  if (ST > 28) return "6d6";
  if (ST > 24 && ST <= 28) return "5d6";
  if (ST > 20 && ST <= 24) return "4d6";
  if (ST > 16 && ST <= 20) return "3d6";
  if (ST > 12 && ST <= 16) return "2d6";
  if (ST > 4 && ST <= 12) return "1d6";
  return "0d6";
}

/**
 * Base Modifiers tables
 */

const GDP_MOD_TABLE = {
  1: 0,
  2: 0,
  3: 0,
  4: 0,
  5: -5,
  6: -4,
  7: -3,
  8: -3,
  9: -2,
  10: -2,
  11: -1,
  12: -1,
  13: 0,
  14: 0,
  15: 1,
  16: 1,
  17: 2,
  18: 2,
  19: -1,
  20: -1,
  21: 0,
  22: 0,
  23: 1,
  24: 1,
  25: 2,
  26: 2,
  27: -1,
  28: -1,
  29: 0,
  30: 0,
};

const BAL_MOD_TABLE = {
  1: 0,
  2: 0,
  3: 0,
  4: 0,
  5: -5,
  6: -4,
  7: -3,
  8: -2,
  9: -1,
  10: 0,
  11: 1,
  12: 2,
  13: -1,
  14: 0,
  15: 1,
  16: 2,
  17: -1,
  18: 0,
  19: 1,
  20: 2,
  21: -1,
  22: 0,
  23: 1,
  24: 2,
  25: -1,
  26: 0,
  27: 1,
  28: 2,
  29: -1,
  30: 0,
};

function getGDPModifier(ST) {
  return GDP_MOD_TABLE[ST] ?? 0;
}

function getBALModifier(ST) {
  return BAL_MOD_TABLE[ST] ?? 0;
}

/**
 * Player base damage calculation
 */
function calculateDamage(ST, context = {}) {
  const gdpModifier = context.GDP?.modifier ?? 0;
  const balModifier = context.BAL?.modifier ?? 0;

  const base = {
    GDP: {
      dice: getGDPDice(ST),
      base_modifier: getGDPModifier(ST),
    },
    BAL: {
      dice: getBALDice(ST),
      base_modifier: getBALModifier(ST),
    },
  };

  return {
    GDP: {
      dice: base.GDP.dice,
      base_modifier: base.GDP.base_modifier,
      modifier: gdpModifier,
      final_modifier: base.GDP.base_modifier + gdpModifier,
    },

    BAL: {
      dice: base.BAL.dice,
      base_modifier: base.BAL.base_modifier,
      modifier: balModifier,
      final_modifier: base.BAL.base_modifier + balModifier,
    },
  };
}

module.exports = {
  calculateDamage,
};
