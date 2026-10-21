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
const {
  applyMaterialModifiers,
  resolveCommonEquippableTail,
} = require("../shared/equippableResolution.js");

const MATERIAL_FIELDS = [
  {
    key: "damage_resistance",
    materialField: "material_dr_modifier",
    mode: "add",
  },
  { key: "weight", materialField: "material_weight_modifier", mode: "multiply" },
  { key: "price", materialField: "material_price_modifier", mode: "multiply" },
  {
    key: "hit_points",
    materialField: "material_hit_points_modifier",
    mode: "multiply",
  },
];

function applyMaterialToShield(shield, material) {
  return applyMaterialModifiers(shield, material, "shield", MATERIAL_FIELDS);
}

// shield_final_* stay material-derived; final_* layer enchantments on top, as in armorResolver.js.
function resolveShieldPiece(
  instance,
  shield,
  material = null,
  enchantmentsDb = {},
  targetsDb = {},
) {
  const finalStats = applyMaterialToShield(shield, material);

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
    shield_id: shield.shield_id,
    shield_name: shield.shield_name,
    shield_box_name: shield.shield_box_name,
    shield_type: shield.shield_type,
    shield_tier: shield.shield_tier,

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

    final_damage_resistance: round2(
      finalStats.shield_final_damage_resistance +
        enchantment_damage_resistance_modifier,
    ),

    ...resolveCommonEquippableTail(instance, finalStats, {
      prefix: "shield",
      enchantments_total_price,
      enchantment_weight_modifier,
    }),
  };
}

module.exports = {
  applyMaterialToShield,
  resolveShieldPiece,
};
