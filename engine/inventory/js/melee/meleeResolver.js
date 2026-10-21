const {
  resolveItemEnchantments,
} = require("../shared/enchantmentsResolver.js");
const {
  WEIGHT_EFFECT_TYPES,
  DAMAGE_EFFECT_TYPES,
  REQUISITE_EFFECT_TYPES,
} = require("../shared/enchantmentsConstants.js");
const {
  round2,
  sumEnchantmentValues,
  sumEnchantmentValuesByTarget,
} = require("../shared/enchantmentMath.js");
const {
  applyMaterialModifiers,
  resolveCommonEquippableTail,
} = require("../shared/equippableResolution.js");

const MATERIAL_FIELDS = [
  { key: "bal_modifier", materialField: "material_bal_modifier", mode: "add" },
  { key: "gdp_modifier", materialField: "material_gdp_modifier", mode: "add" },
  { key: "weight", materialField: "material_weight_modifier", mode: "multiply" },
  { key: "price", materialField: "material_price_modifier", mode: "multiply" },
  {
    key: "hit_points",
    materialField: "material_hit_points_modifier",
    mode: "multiply",
  },
];

function calculateHex(length) {
  if (length < 1) {
    return 1;
  }

  return Math.floor((length + 1) / 2) + 1;
}

function applyMaterialToMelee(weapon, material) {
  return applyMaterialModifiers(weapon, material, "weapon", MATERIAL_FIELDS);
}

// BAL/GDP/Min Strength enchantment deltas apply directly onto the terminal fields (no separate final tier).
// Weight keeps a material-only vs final split, like armor.
function resolveMeleeWeapons(
  instance,
  weapon,
  material = null,
  enchantmentsDb = {},
  targetsDb = {},
) {
  const finalStats = applyMaterialToMelee(weapon, material);

  const { resolved: enchantments, total_price: enchantments_total_price } =
    resolveItemEnchantments(
      instance.enchantments || [],
      enchantmentsDb,
      targetsDb,
    );

  const enchantment_weight_modifier = round2(
    sumEnchantmentValues(enchantments, WEIGHT_EFFECT_TYPES),
  );

  const enchantment_bal_modifier = sumEnchantmentValuesByTarget(
    enchantments,
    DAMAGE_EFFECT_TYPES,
    "BAL",
  );

  const enchantment_gdp_modifier = sumEnchantmentValuesByTarget(
    enchantments,
    DAMAGE_EFFECT_TYPES,
    "GDP",
  );

  const enchantment_min_strength_modifier = sumEnchantmentValuesByTarget(
    enchantments,
    REQUISITE_EFFECT_TYPES,
    "Min Strength",
  );

  return {
    weapon_id: weapon.weapon_id,
    weapon_name: weapon.weapon_name,
    weapon_type: weapon.weapon_type,
    weapon_skill: weapon.weapon_skill,
    weapon_skill_id: weapon.weapon_skill_id ?? null,
    weapon_tier: weapon.weapon_tier,
    weapon_damage_type: weapon.weapon_damage_type,
    weapon_reach: calculateHex(weapon.weapon_length),

    material_id: material?.material_id || null,
    material_name: material?.material_name || null,
    material_type: material?.material_type || null,
    material_tier: material?.material_tier || null,
    material_atk_effect: material?.material_atk_effect || null,

    ...finalStats,
    weapon_final_bal_modifier: round2(
      finalStats.weapon_final_bal_modifier + enchantment_bal_modifier,
    ),
    weapon_final_gdp_modifier: round2(
      finalStats.weapon_final_gdp_modifier + enchantment_gdp_modifier,
    ),
    weapon_min_strength: round2(
      weapon.weapon_min_strength + enchantment_min_strength_modifier,
    ),

    enchantments,
    enchantments_total_price,
    enchantment_weight_modifier,

    ...resolveCommonEquippableTail(instance, finalStats, {
      prefix: "weapon",
      enchantments_total_price,
      enchantment_weight_modifier,
    }),
  };
}

module.exports = {
  applyMaterialToMelee,
  resolveMeleeWeapons,
  calculateHex,
};
