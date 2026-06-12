const { SLOT_MAP } = require("./armorConstants");
function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

// Resolvers

/**
 * Applies material modifiers to armor stats
 */
function applyMaterialToArmor(armor, material) {
  if (!material) {
    return {
      armor_final_damage_resistance: round2(armor.armor_damage_resistance),
      armor_final_weight: round2(armor.armor_weight),
      armor_final_price: round2(armor.armor_price),
      armor_final_hit_points: round2(armor.armor_hit_points),
    };
  }

  return {
    armor_final_damage_resistance: round2(
      armor.armor_damage_resistance +
        Number(material.material_dr_modifier || 0),
    ),

    armor_final_weight: round2(
      armor.armor_weight * Number(material.material_weight_modifier || 1),
    ),

    armor_final_price: round2(
      armor.armor_price * Number(material.material_price_modifier || 1),
    ),

    armor_final_hit_points: round2(
      armor.armor_hit_points *
        Number(material.material_hit_points_modifier || 1),
    ),
  };
}

/**
 * Merges:
 *
 * - armor db record
 * - material db record
 * - runtime instance state
 *
 * into a fully resolved armor piece.
 */
function resolveArmorPiece(instance, armor, material = null) {
  const finalStats = applyMaterialToArmor(armor, material);

  const hitPointsModifier = Number(instance.hit_points_modifier || 0);

  return {
    armor_id: armor.armor_id,

    armor_name: armor.armor_name,
    armor_box_name: armor.armor_box_name,
    armor_piece_location: SLOT_MAP[armor.armor_piece_location],
    armor_type: armor.armor_type,
    armor_tier: armor.armor_tier,
    armor_damage_resistance: armor.armor_damage_resistance,
    armor_weight: armor.armor_weight,
    armor_price: armor.armor_price,
    armor_hit_points: armor.armor_hit_points,

    // MATERIAL
    material_id: material?.material_id || null,

    material_name: material?.material_name || null,
    material_type: material?.material_type || null,
    material_tier: material?.material_tier || null,
    material_dr_modifier: Number(material?.material_dr_modifier || 0),
    material_def_effect: material?.material_def_effect || null,
    material_weight_modifier: Number(material?.material_weight_modifier || 1),
    material_price_modifier: Number(material?.material_price_modifier || 1),
    material_hit_points_modifier: Number(
      material?.material_hit_points_modifier || 0,
    ),

    // FINAL VALUES
    ...finalStats,

    // RUNTIME MODIFIERS
    hit_points_modifier: hitPointsModifier,

    final_hit_points: round2(
      finalStats.armor_final_hit_points + hitPointsModifier,
    ),

    // VALUE — armor has no quantity; one instance = one piece
    total_value: round2(finalStats.armor_final_price),

    // RUNTIME
    is_equipped: instance.is_equipped,

    storedAt: instance.storedAt,
    _instanceId: instance._instanceId ?? null,
  };
}

function buildEquippedSlots() {
  return Object.fromEntries(
    Object.values(SLOT_MAP).map((slot) => [slot, null]),
  );
}

/**
 * Calculates total carried armor weight.
 *
 * Only:
 * - equipped
 * - backpack
 *
 * count as carried weight.
 */
function calculateTotalArmorWeight(armorInventory, armorDb, materialDb = {}) {
  return armorInventory.reduce((sum, instance) => {
    if (instance.storedAt === "stash" || instance.storedAt === "camp") {
      return sum;
    }

    const armor = armorDb[instance.armor_id];
    if (!armor) return sum;

    const material = instance.material_id
      ? materialDb[instance.material_id]
      : null;

    const resolved = resolveArmorPiece(instance, armor, material);

    return sum + resolved.armor_final_weight;
  }, 0);
}

/**
 * Calculates total armor value (equipped + backpack).
 * Stash and camp are excluded — mirrors the weight convention.
 */
function calculateTotalArmorValue(armorInventory, armorDb, materialDb = {}) {
  return round2(
    armorInventory.reduce((sum, instance) => {
      if (instance.storedAt === "stash" || instance.storedAt === "camp") {
        return sum;
      }

      const armor = armorDb[instance.armor_id];
      if (!armor) return sum;

      const material = instance.material_id
        ? materialDb[instance.material_id]
        : null;

      const resolved = resolveArmorPiece(instance, armor, material);

      return sum + resolved.total_value;
    }, 0),
  );
}

/**
 * Calculates carried armor value (equipped + backpack).
 * Named alias for calculateTotalArmorValue — kept for symmetry with the
 * carried/total weight pair.
 */
function calculateCarriedArmorValue(armorInventory, armorDb, materialDb = {}) {
  return calculateTotalArmorValue(armorInventory, armorDb, materialDb);
}

// Exports

module.exports = {
  applyMaterialToArmor,
  resolveArmorPiece,
  buildEquippedSlots,
  calculateTotalArmorWeight,
  calculateTotalArmorValue,
  calculateCarriedArmorValue,
};
