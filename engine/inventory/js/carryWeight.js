const {
  LOW_RESERVE,
  LOAD_LEVELS,
  OVERLOADED,
  LIFT_MULTIPLIERS,
  BASIC_LIFT,
} = require("../../../helpers/rules");

// 4e metric Basic Lift (see BASIC_LIFT in helpers/rules.js).
function calculateBasicLift(ST) {
  const raw = (ST * ST) / BASIC_LIFT.divisor;
  return raw >= BASIC_LIFT.wholeKgFrom
    ? Math.round(raw)
    : Math.round(raw * 10) / 10;
}

// 4e B426: under 1/3 of natural FP, ST is halved (round up) for lifting and carrying only.
function liftingStrength(ST, FP) {
  if (!FP || FP.value >= FP.final_base_value / LOW_RESERVE.belowDivisor)
    return ST;
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
