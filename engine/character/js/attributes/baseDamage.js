// GURPS 4e Basic Set (p. B16) Strength Table: canon thrust (GDP) and swing
// (BAL) damage, keyed by every ST it explicitly lists (every ST through 40,
// then every 5th ST through 100). RAW: an ST between two listed keys uses
// the next-lower key's damage.
const DAMAGE_TABLE = {
  1: { gdpDice: "0d6", gdpMod: 0, balDice: "0d6", balMod: 0 },
  2: { gdpDice: "0d6", gdpMod: 0, balDice: "0d6", balMod: 0 },
  3: { gdpDice: "0d6", gdpMod: 0, balDice: "0d6", balMod: 0 },
  4: { gdpDice: "0d6", gdpMod: 0, balDice: "0d6", balMod: 0 },
  5: { gdpDice: "1d6", gdpMod: -5, balDice: "1d6", balMod: -5 },
  6: { gdpDice: "1d6", gdpMod: -4, balDice: "1d6", balMod: -4 },
  7: { gdpDice: "1d6", gdpMod: -3, balDice: "1d6", balMod: -3 },
  8: { gdpDice: "1d6", gdpMod: -3, balDice: "1d6", balMod: -2 },
  9: { gdpDice: "1d6", gdpMod: -2, balDice: "1d6", balMod: -1 },
  10: { gdpDice: "1d6", gdpMod: -2, balDice: "1d6", balMod: 0 },
  11: { gdpDice: "1d6", gdpMod: -1, balDice: "1d6", balMod: 1 },
  12: { gdpDice: "1d6", gdpMod: -1, balDice: "1d6", balMod: 2 },
  13: { gdpDice: "1d6", gdpMod: 0, balDice: "2d6", balMod: -1 },
  14: { gdpDice: "1d6", gdpMod: 0, balDice: "2d6", balMod: 0 },
  15: { gdpDice: "1d6", gdpMod: 1, balDice: "2d6", balMod: 1 },
  16: { gdpDice: "1d6", gdpMod: 1, balDice: "2d6", balMod: 2 },
  17: { gdpDice: "1d6", gdpMod: 2, balDice: "3d6", balMod: -1 },
  18: { gdpDice: "1d6", gdpMod: 2, balDice: "3d6", balMod: 0 },
  19: { gdpDice: "2d6", gdpMod: -1, balDice: "3d6", balMod: 1 },
  20: { gdpDice: "2d6", gdpMod: -1, balDice: "3d6", balMod: 2 },
  21: { gdpDice: "2d6", gdpMod: 0, balDice: "4d6", balMod: -1 },
  22: { gdpDice: "2d6", gdpMod: 0, balDice: "4d6", balMod: 0 },
  23: { gdpDice: "2d6", gdpMod: 1, balDice: "4d6", balMod: 1 },
  24: { gdpDice: "2d6", gdpMod: 1, balDice: "4d6", balMod: 2 },
  25: { gdpDice: "2d6", gdpMod: 2, balDice: "5d6", balMod: -1 },
  26: { gdpDice: "2d6", gdpMod: 2, balDice: "5d6", balMod: 0 },
  27: { gdpDice: "3d6", gdpMod: -1, balDice: "5d6", balMod: 1 },
  28: { gdpDice: "3d6", gdpMod: -1, balDice: "5d6", balMod: 2 },
  29: { gdpDice: "3d6", gdpMod: 0, balDice: "6d6", balMod: -1 },
  30: { gdpDice: "3d6", gdpMod: 0, balDice: "6d6", balMod: 0 },
  31: { gdpDice: "3d6", gdpMod: 1, balDice: "6d6", balMod: -1 },
  33: { gdpDice: "3d6", gdpMod: 2, balDice: "6d6", balMod: 0 },
  35: { gdpDice: "4d6", gdpMod: -1, balDice: "6d6", balMod: 1 },
  37: { gdpDice: "4d6", gdpMod: 0, balDice: "6d6", balMod: 2 },
  39: { gdpDice: "4d6", gdpMod: 1, balDice: "7d6", balMod: -1 },
  45: { gdpDice: "5d6", gdpMod: 0, balDice: "7d6", balMod: 1 },
  50: { gdpDice: "5d6", gdpMod: 2, balDice: "8d6", balMod: -1 },
  55: { gdpDice: "6d6", gdpMod: 0, balDice: "8d6", balMod: 1 },
  60: { gdpDice: "7d6", gdpMod: -1, balDice: "9d6", balMod: 0 },
  65: { gdpDice: "7d6", gdpMod: 1, balDice: "9d6", balMod: 2 },
  70: { gdpDice: "8d6", gdpMod: 0, balDice: "10d6", balMod: 0 },
  75: { gdpDice: "8d6", gdpMod: 2, balDice: "10d6", balMod: 2 },
  80: { gdpDice: "9d6", gdpMod: 0, balDice: "11d6", balMod: 0 },
  85: { gdpDice: "9d6", gdpMod: 2, balDice: "11d6", balMod: 2 },
  90: { gdpDice: "10d6", gdpMod: 0, balDice: "12d6", balMod: 0 },
  95: { gdpDice: "10d6", gdpMod: 2, balDice: "12d6", balMod: 2 },
  100: { gdpDice: "11d6", gdpMod: 0, balDice: "13d6", balMod: 0 },
};

const TABLE_KEYS = Object.keys(DAMAGE_TABLE)
  .map(Number)
  .sort((a, b) => a - b);

function getTabledDamage(ST) {
  const key = TABLE_KEYS.filter((candidate) => candidate <= ST).pop() ?? TABLE_KEYS[0];

  return DAMAGE_TABLE[key];
}

// Past ST 100 the table gives way to a flat, open-ended rule (confirmed by
// SJG): damage climbs 1 die per 10 ST, with swing permanently 2 dice ahead
// of thrust and no further pip modifier.
function getHighSTDamage(ST) {
  const tier = Math.floor(ST / 10);

  return {
    gdpDice: `${tier + 1}d6`,
    gdpMod: 0,
    balDice: `${tier + 3}d6`,
    balMod: 0,
  };
}

function getBaseDamage(ST) {
  return ST > 100 ? getHighSTDamage(ST) : getTabledDamage(ST);
}

function calculateDamage(ST, context = {}) {
  const gdpModifier = context.GDP?.modifier ?? 0;
  const balModifier = context.BAL?.modifier ?? 0;

  const base = getBaseDamage(ST);

  return {
    GDP: {
      dice: base.gdpDice,
      base_modifier: base.gdpMod,
      modifier: gdpModifier,
      final_modifier: base.gdpMod + gdpModifier,
    },

    BAL: {
      dice: base.balDice,
      base_modifier: base.balMod,
      modifier: balModifier,
      final_modifier: base.balMod + balModifier,
    },
  };
}

module.exports = {
  calculateDamage,
};
