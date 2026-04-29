function calculateCarryWeight(ST, weight) {
  const none = ST;
  const light = ST * 2;
  const medium = ST * 3;
  const heavy = ST * 6;
  const veryHeavy = ST * 10;

  let weight_modifier;

  if (weight <= none) {
    weight_modifier = 0;
  } else if (weight < medium) {
    // ST < weight < ST*3
    weight_modifier = 0;
  } else if (weight < heavy) {
    // ST*3 ≤ weight < ST*6
    weight_modifier = -1;
  } else if (weight < veryHeavy) {
    // ST*6 ≤ weight < ST*10
    weight_modifier = -2;
  } else {
    // weight ≥ ST*10
    weight_modifier = -3;
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
