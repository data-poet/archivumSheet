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

function applyMaterialToArmor(armor, material) {
  return applyMaterialModifiers(armor, material, "armor", MATERIAL_FIELDS);
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

    final_damage_resistance: round2(
      finalStats.armor_final_damage_resistance +
        enchantment_damage_resistance_modifier,
    ),

    ...resolveCommonEquippableTail(instance, finalStats, {
      prefix: "armor",
      enchantments_total_price,
      enchantment_weight_modifier,
    }),
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
