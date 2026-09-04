const {
  resolveItemEnchantments,
} = require("../shared/enchantmentsResolver.js");

function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

// Accessories have no DB-driven price (it's entirely user-input, since it's highly variable per item) but enchantment price is DB-driven and counts toward total_value regardless of equip state.
function resolveAccessoryItem(
  instance,
  accessory,
  enchantmentsDb = {},
  targetsDb = {},
) {
  const price = Number(instance.price) || 0;

  const { resolved: enchantments, total_price: enchantments_total_price } =
    resolveItemEnchantments(
      instance.enchantments || [],
      enchantmentsDb,
      targetsDb,
    );

  return {
    accessory_id: accessory.accessory_id,
    accessory_name: accessory.accessory_name,
    accessory_equip_limit: accessory.accessory_equip_limit,

    price,
    enchantments,
    enchantments_total_price,
    total_value: round2(price + enchantments_total_price),

    accessory_custom_name: instance.accessory_custom_name?.trim() || null,
    accessory_custom_description:
      instance.accessory_custom_description?.trim() || null,
    accessory_custom_effect:
      instance.accessory_custom_effect?.trim() || null,

    is_equipped: instance.is_equipped,
    storedAt: instance.storedAt,
    _instanceId: instance._instanceId ?? null,
  };
}

function calculateCarriedAccessoryValue(equipped, backpackItems) {
  return round2(
    [...equipped, ...backpackItems].reduce(
      (sum, entry) => sum + entry.total_value,
      0,
    ),
  );
}

module.exports = {
  resolveAccessoryItem,
  calculateCarriedAccessoryValue,
};
