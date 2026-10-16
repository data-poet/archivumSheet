// Numeric attribute rules the engine applies and the reference documents. Kept here so a rule change
// is one edit (plus the markdown) instead of a hunt through the attribute builders.

const PRIMARY_DEFAULT_VALUE = 10;

// Points per level above or below PRIMARY_DEFAULT_VALUE.
const PRIMARY_COST = {
  ST: 10,
  DX: 20,
  IQ: 20,
  HT: 10,
};

const POINTS_PER_PURCHASE = 5;

const DEFAULT_SECONDARY_PURCHASE = { step: 1, maxBought: 5 };

// What one purchase adds (step) and how many are allowed (maxBought); maxBought 0 means not buyable.
const SECONDARY_PURCHASE = {
  HP: { step: 4, maxBought: 5 },
  FP: { ...DEFAULT_SECONDARY_PURCHASE },
  Mana: { step: 4, maxBought: 5 },
  Toxicity: { step: 4, maxBought: 5 },
  Will: { ...DEFAULT_SECONDARY_PURCHASE },
  Vision: { ...DEFAULT_SECONDARY_PURCHASE },
  Hearing: { ...DEFAULT_SECONDARY_PURCHASE },
  Smell: { ...DEFAULT_SECONDARY_PURCHASE },
  BasicSpeed: { step: 0.5, maxBought: 6 },
  Movement: { step: 1, maxBought: 0 },
  Dodge: { step: 1, maxBought: 0 },
  DamageResistance: { step: 1, maxBought: 0 },
};

module.exports = {
  PRIMARY_DEFAULT_VALUE,
  PRIMARY_COST,
  POINTS_PER_PURCHASE,
  DEFAULT_SECONDARY_PURCHASE,
  SECONDARY_PURCHASE,
};
