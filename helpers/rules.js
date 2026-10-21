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

const PRIMARY_KEYS = Object.keys(PRIMARY_COST);

const POINTS_PER_PURCHASE = 5;

const DEFAULT_SECONDARY_PURCHASE = { step: 1, maxBought: 5 };

// What one purchase adds (step) and how many are allowed (maxBought); maxBought 0 means not buyable.
const SECONDARY_PURCHASE = {
  HP: { step: 4, maxBought: 5 },
  FP: { ...DEFAULT_SECONDARY_PURCHASE },
  // minValue floors Mana at 0: spending past it casts on PV instead (see effects/fatigue_and_healing.md).
  Mana: { step: 4, maxBought: 5, minValue: 0 },
  Toxicity: { ...DEFAULT_SECONDARY_PURCHASE },
  Will: { ...DEFAULT_SECONDARY_PURCHASE },
  Vision: { ...DEFAULT_SECONDARY_PURCHASE },
  Hearing: { ...DEFAULT_SECONDARY_PURCHASE },
  Smell: { ...DEFAULT_SECONDARY_PURCHASE },
  BasicSpeed: { step: 0.5, maxBought: 6 },
  Movement: { step: 1, maxBought: 0 },
  Dodge: { step: 1, maxBought: 0 },
  DamageResistance: { step: 1, maxBought: 0 },
};

// A reserve under 1/3 of its natural max halves current Move and Dodge (round up); FP also halves lifting ST.
const LOW_RESERVE = {
  keys: ["HP", "FP"],
  belowDivisor: 3,
};

// Toxicity's auto-applied condition bands (thresholds.js's toxicityState): "bands" splits natural max
// into thirds, mirroring LOW_RESERVE's "below 1/3" shape for the saturado/ok line; the negative range
// below 0 is carved into the same thirds, "severeAtBands" of them down, for the three escalating
// poisoning tiers in data/db_conditions.csv's toxicidade exclusive group.
const TOXICITY_THRESHOLDS = {
  bands: 3,
  severeAtBands: 2,
};

// Death thresholds are multiples of natural HT (house rule), not of PV.
const HP_THRESHOLDS = {
  majorWoundDivisor: 2,
  headStunDivisor: 3,
  deathCheckMultiples: [1, 2, 3, 4],
  deathMultiple: 5,
  destroyedMultiple: 10,
};

// 4e B17 encumbrance: Move is multiplied by move_factor (min 1) and Dodge takes dodge_penalty.
const LOAD_LEVELS = [
  { level: "none", multiplier: 1, move_factor: 1, dodge_penalty: 0 },
  { level: "light", multiplier: 2, move_factor: 0.8, dodge_penalty: -1 },
  { level: "medium", multiplier: 3, move_factor: 0.6, dodge_penalty: -2 },
  { level: "heavy", multiplier: 6, move_factor: 0.4, dodge_penalty: -3 },
  { level: "veryHeavy", multiplier: 10, move_factor: 0.2, dodge_penalty: -4 },
];

// Spell tier by final level: ordered ascending by max, the first threshold the level doesn't exceed wins; above the last, SPELL_TIER_DEFAULT.
const SPELL_TIER_THRESHOLDS = [
  { max: 12, tier: "Aprendiz" },
  { max: 15, tier: "Experiente" },
  { max: 17, tier: "Veterano" },
  { max: 19, tier: "Especialista" },
];
const SPELL_TIER_DEFAULT = "Mestre";

// A status tag can imply others, and its roll penalty counts once however many active conditions grant it.
const CONDITION_RULES = {
  // Every status tag: what it implies, the roll penalty it carries, and whether only an implication can give it.
  tags: {
    stunned: { penalty: { defense: -4 } },
    incapacitated: { implies: ["stunned", "cannot_act"] },
    unconscious: { implies: ["incapacitated"] },
    paralyzed: {},
    cannot_act: { impliedOnly: true },
  },
  // Pain-threshold traits by key: the factors of the owned ones multiply, so Hipoalgia and Hiperalgia cancel out.
  painScale: { hipoalgia: 0.5, hiperalgia: 2 },
  // The roll names a penalty may match on each attribute (on top of "all_rolls"); Will and the senses are rolls too.
  attributeRollKinds: {
    ST: ["ST"],
    DX: ["DX"],
    IQ: ["IQ"],
    HT: ["HT"],
    Will: ["Will"],
    Vision: ["Per"],
    Hearing: ["Per"],
    Smell: ["Per"],
  },
};

const OVERLOADED = { level: "overloaded", move_factor: 0, dodge_penalty: -4 };

const LIFT_MULTIPLIERS = {
  oneHanded: 2,
  twoHanded: 8,
  shove: 12,
  onBack: 15,
  shiftSlightly: 50,
};

// 4e metric Basic Lift: ST²/divisor kg, rounded to a whole kg from wholeKgFrom up.
const BASIC_LIFT = { divisor: 10, wholeKgFrom: 5 };

module.exports = {
  PRIMARY_DEFAULT_VALUE,
  PRIMARY_COST,
  PRIMARY_KEYS,
  POINTS_PER_PURCHASE,
  DEFAULT_SECONDARY_PURCHASE,
  SECONDARY_PURCHASE,
  LOW_RESERVE,
  TOXICITY_THRESHOLDS,
  HP_THRESHOLDS,
  LOAD_LEVELS,
  SPELL_TIER_THRESHOLDS,
  SPELL_TIER_DEFAULT,
  CONDITION_RULES,
  OVERLOADED,
  LIFT_MULTIPLIERS,
  BASIC_LIFT,
};
