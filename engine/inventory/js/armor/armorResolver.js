const { SLOT_MAP } = require("./armorConstants");
const {
  resolveItemEnchantments,
} = require("../shared/enchantmentsResolver.js");
const {
  WEIGHT_EFFECT_TYPES,
  DAMAGE_RESISTANCE_EFFECT_TYPES,
} = require("../shared/enchantmentsConstants.js");
const {
  round2,
  sumEnchantmentValues,
} = require("../shared/enchantmentMath.js");

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

// armor_final_* stay material-derived; final_* layer enchantments on top, like hit_points -> final_hit_points.
// Enchantment price/weight/DR effects belong to the item (worn or not); only the elemental-resistance effect is equipped-only (collectEquippedEnchantments.js).
function resolveArmorPiece(
  instance,
  armor,
  material = null,
  enchantmentsDb = {},
  targetsDb = {},
) {
  const finalStats = applyMaterialToArmor(armor, material);

  const hitPointsModifier = Number(instance.hit_points_modifier || 0);

  const { resolved: enchantments, total_price: enchantments_total_price } =
    resolveItemEnchantments(
      instance.enchantments || [],
      enchantmentsDb,
      targetsDb,
    );

  const enchantment_weight_modifier = round2(
    sumEnchantmentValues(enchantments, WEIGHT_EFFECT_TYPES),
  );

  const enchantment_damage_resistance_modifier = round2(
    sumEnchantmentValues(enchantments, DAMAGE_RESISTANCE_EFFECT_TYPES),
  );

  return {
    armor_id: armor.armor_id,

    armor_name: armor.armor_name,
    armor_box_name: armor.armor_box_name,
    armor_piece_location: SLOT_MAP[armor.armor_piece_location],
    armor_type: armor.armor_type,
    armor_tier: armor.armor_tier,

    material_id: material?.material_id || null,

    material_name: material?.material_name || null,
    material_type: material?.material_type || null,
    material_tier: material?.material_tier || null,
    material_def_effect: material?.material_def_effect || null,

    ...finalStats,

    enchantments,
    enchantments_total_price,
    enchantment_weight_modifier,
    enchantment_damage_resistance_modifier,

    hit_points_modifier: hitPointsModifier,

    final_hit_points: round2(
      finalStats.armor_final_hit_points + hitPointsModifier,
    ),

    final_weight: round2(
      finalStats.armor_final_weight * (1 + enchantment_weight_modifier),
    ),
    final_damage_resistance: round2(
      finalStats.armor_final_damage_resistance +
        enchantment_damage_resistance_modifier,
    ),

    total_value: round2(
      finalStats.armor_final_price + enchantments_total_price,
    ),

    armor_custom_name: instance.armor_custom_name?.trim() || null,
    armor_custom_description: instance.armor_custom_description?.trim() || null,
    armor_custom_effect: instance.armor_custom_effect?.trim() || null,

    is_equipped: instance.is_equipped,

    storedAt: instance.storedAt,
    id: instance.id ?? null,
  };
}

function buildEquippedSlots() {
  return Object.fromEntries(
    Object.values(SLOT_MAP).map((slot) => [slot, null]),
  );
}

module.exports = {
  applyMaterialToArmor,
  resolveArmorPiece,
  buildEquippedSlots,
};
