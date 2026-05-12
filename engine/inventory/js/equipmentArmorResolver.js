const { SLOTS } = require("./equipmentArmorConstants");

// Resolvers

/**
 * Merges a DB record with an instance's runtime state
 * into a resolved armor piece.
 */
function resolveArmorPiece(instance, armor) {
  return {
    armor_id: armor.armor_id,

    armor_name: armor.armor_name,
    armor_box_name: armor.armor_box_name,

    armor_piece_location: armor.armor_piece_location,

    armor_type: armor.armor_type,
    armor_tier: armor.armor_tier,

    armor_damage_resistence: armor.armor_damage_resistence,

    armor_weight: armor.armor_weight,

    armor_price: armor.armor_price,

    armor_hit_points: armor.armor_hit_points,

    is_equipped: instance.is_equipped,

    storedAt: instance.storedAt,
  };
}

function buildEquippedSlots() {
  return Object.fromEntries(SLOTS.map((slot) => [slot, null]));
}

function calculateTotalArmorWeight(armorInventory, db) {
  return armorInventory.reduce((sum, instance) => {
    return sum + db[instance.armor_id].armor_weight;
  }, 0);
}

// Exports

module.exports = {
  resolveArmorPiece,
  buildEquippedSlots,
  calculateTotalArmorWeight,
};
