
function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function resolveCustomInventoryItem(instance) {
  const total_weight = round2(instance.weight * instance.quantity);

  return {
    custom_item_id: instance.custom_item_id,
    name: instance.name.trim(),
    weight: instance.weight,
    price: instance.price,
    quantity: instance.quantity,
    description: instance.description?.trim() || null,
    storedAt: instance.storedAt,
    total_weight,
    total_value: round2(instance.price * instance.quantity),
  };
}

function calculateCarriedCustomInventoryWeight(backpackItems) {
  return round2(
    backpackItems.reduce((sum, entry) => sum + entry.total_weight, 0),
  );
}

function calculateCarriedCustomInventoryValue(backpackItems) {
  return round2(
    backpackItems.reduce((sum, entry) => sum + entry.total_value, 0),
  );
}

module.exports = {
  resolveCustomInventoryItem,
  calculateCarriedCustomInventoryWeight,
  calculateCarriedCustomInventoryValue,
};
