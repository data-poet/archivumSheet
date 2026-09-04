
function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function resolveSurvivalGearItem(instance, gear) {
  const total_weight = round2(gear.adventure_gear_weight * instance.quantity);

  return {
    adventure_gear_id: gear.adventure_gear_id,
    adventure_gear_name: gear.adventure_gear_name,
    adventure_gear_type: gear.adventure_gear_type,
    adventure_gear_price: gear.adventure_gear_price,
    adventure_gear_weight: gear.adventure_gear_weight,

    quantity: instance.quantity,
    storedAt: instance.storedAt,
    total_weight,
    total_value: round2(gear.adventure_gear_price * instance.quantity),
  };
}

function calculateCarriedSurvivalGearWeight(backpackItems) {
  return round2(
    backpackItems.reduce((sum, entry) => sum + entry.total_weight, 0),
  );
}

function calculateCarriedSurvivalGearValue(backpackItems) {
  return round2(
    backpackItems.reduce((sum, entry) => sum + entry.total_value, 0),
  );
}

module.exports = {
  resolveSurvivalGearItem,
  calculateCarriedSurvivalGearWeight,
  calculateCarriedSurvivalGearValue,
};
