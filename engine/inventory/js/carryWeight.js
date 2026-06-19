function calculateCarryWeight(ST, weight) {
  const none = ST;
  const light = ST * 2;
  const medium = ST * 3;
  const heavy = ST * 6;
  const veryHeavy = ST * 10;

  let weight_modifier;

  if (weight <= none) {
    weight_modifier = 0;
  } else if (weight <= light) {
    weight_modifier = 0;
  } else if (weight <= medium) {
    weight_modifier = -1;
  } else if (weight <= heavy) {
    weight_modifier = -2;
  } else if (weight <= veryHeavy) {
    weight_modifier = -3;
  } else {
    // weight > ST*10
    weight_modifier = -4;
  }

  return {
    limits: {
      none,
      light,
      medium,
      heavy,
      veryHeavy,
    },
    weight_modifier,
  };
}

module.exports = {
  calculateCarryWeight,
};
