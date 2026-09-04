
function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function resolveAlchemyConsumable(instance, consumable) {
  const total_weight = round2(consumable.consumable_weight * instance.quantity);

  return {
    consumable_id: consumable.consumable_id,
    consumable_name: consumable.consumable_name,
    consumable_box_name: consumable.consumable_box_name,
    consumable_tier: consumable.consumable_tier,
    consumable_type: consumable.consumable_type,
    consumable_category: consumable.consumable_category,
    consumable_ingredients: consumable.consumable_ingredients,
    consumable_duration: consumable.consumable_duration,
    consumable_effect: consumable.consumable_effect,
    consumable_toxicity: consumable.consumable_toxicity,
    consumable_price: consumable.consumable_price,
    consumable_weight: consumable.consumable_weight,
    consumable_method: consumable.consumable_method,
    consumable_effect_area: consumable.consumable_effect_area,

    quantity: instance.quantity,
    storedAt: instance.storedAt,
    total_weight,
    total_value: round2(consumable.consumable_price * instance.quantity),
  };
}

function calculateCarriedAlchemyWeight(backpackConsumables) {
  return round2(
    backpackConsumables.reduce((sum, entry) => sum + entry.total_weight, 0),
  );
}

function calculateCarriedAlchemyValue(backpackConsumables) {
  return round2(
    backpackConsumables.reduce((sum, entry) => sum + entry.total_value, 0),
  );
}

module.exports = {
  resolveAlchemyConsumable,
  calculateCarriedAlchemyWeight,
  calculateCarriedAlchemyValue,
};
