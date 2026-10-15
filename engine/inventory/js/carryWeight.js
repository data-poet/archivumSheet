// 4e B17 encumbrance: Move is multiplied by move_factor (min 1) and Dodge takes dodge_penalty.
const LOAD_LEVELS = [
  { level: "none", multiplier: 1, move_factor: 1, dodge_penalty: 0 },
  { level: "light", multiplier: 2, move_factor: 0.8, dodge_penalty: -1 },
  { level: "medium", multiplier: 3, move_factor: 0.6, dodge_penalty: -2 },
  { level: "heavy", multiplier: 6, move_factor: 0.4, dodge_penalty: -3 },
  { level: "veryHeavy", multiplier: 10, move_factor: 0.2, dodge_penalty: -4 },
];

const OVERLOADED = { level: "overloaded", move_factor: 0, dodge_penalty: -4 };

const LIFT_MULTIPLIERS = {
  oneHanded: 2,
  twoHanded: 8,
  shove: 12,
  onBack: 15,
  shiftSlightly: 50,
};

// 4e metric Basic Lift: ST²/10 kg, rounded to a whole kg from 5 kg up.
function calculateBasicLift(ST) {
  const raw = (ST * ST) / 10;
  return raw >= 5 ? Math.round(raw) : Math.round(raw * 10) / 10;
}

// 4e B426: under 1/3 of natural FP, ST is halved (round up) for lifting and carrying only.
function liftingStrength(ST, FP) {
  if (!FP || FP.value >= FP.final_base_value / 3) return ST;
  return Math.ceil(ST / 2);
}

function calculateCarryWeight(ST, weight) {
  const basic_lift = calculateBasicLift(ST);

  const limits = Object.fromEntries(
    LOAD_LEVELS.map(({ level, multiplier }) => [
      level,
      basic_lift * multiplier,
    ]),
  );

  const lifts = Object.fromEntries(
    Object.entries(LIFT_MULTIPLIERS).map(([key, multiplier]) => [
      key,
      basic_lift * multiplier,
    ]),
  );

  const band =
    LOAD_LEVELS.find(({ level }) => weight <= limits[level]) ?? OVERLOADED;

  return {
    basic_lift,
    limits,
    lifts,
    level: band.level,
    move_factor: band.move_factor,
    dodge_penalty: band.dodge_penalty,
  };
}

module.exports = {
  calculateBasicLift,
  calculateCarryWeight,
  liftingStrength,
};
