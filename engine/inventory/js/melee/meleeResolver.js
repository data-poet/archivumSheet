
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

function calculateHex(length) {
  if (length < 1) {
    return 1;
  }

  return Math.floor((length + 1) / 2) + 1;
}

function applyMaterialToMelee(weapon, material) {
  if (!material) {
    return {
      weapon_final_bal_modifier: round2(weapon.weapon_bal_modifier),
      weapon_final_gdp_modifier: round2(weapon.weapon_gdp_modifier),
      weapon_final_weight: round2(weapon.weapon_weight),
      weapon_final_price: round2(weapon.weapon_price),
      weapon_final_hit_points: round2(weapon.weapon_hit_points),
    };
  }

  return {
    weapon_final_bal_modifier: round2(
      weapon.weapon_bal_modifier + Number(material.material_bal_modifier || 0),
    ),
    weapon_final_gdp_modifier: round2(
      weapon.weapon_gdp_modifier + Number(material.material_gdp_modifier || 0),
    ),
    weapon_final_weight: round2(
      weapon.weapon_weight * Number(material.material_weight_modifier || 1),
    ),
    weapon_final_price: round2(
      weapon.weapon_price * Number(material.material_price_modifier || 1),
    ),
    weapon_final_hit_points: round2(
      weapon.weapon_hit_points *
        Number(material.material_hit_points_modifier || 1),
    ),
  };
}

// BAL/GDP/Min Strength enchantment deltas apply directly onto the terminal fields (weaponDamage.js/render.js/buildSheet.js read these directly, no separate truly-final tier). Weight is the exception: it keeps a two-tier material-only vs. truly-final split, mirroring armor's final_weight calc.
function resolveMeleeWeapons(
  instance,
  weapon,
  material = null,
  enchantmentsDb = {},
  targetsDb = {},
) {
  const finalStats = applyMaterialToMelee(weapon, material);

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
    weapon_box_name: weapon.weapon_box_name,
    weapon_type: weapon.weapon_type,
    weapon_skill: weapon.weapon_skill,
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

    hit_points_modifier: hitPointsModifier,
    final_hit_points: round2(
      finalStats.weapon_final_hit_points + hitPointsModifier,
    ),

    final_weight: round2(
      finalStats.weapon_final_weight * (1 + enchantment_weight_modifier),
    ),

    total_value: round2(
      finalStats.weapon_final_price + enchantments_total_price,
    ),

    weapon_custom_name: instance.weapon_custom_name?.trim() || null,
    weapon_custom_description:
      instance.weapon_custom_description?.trim() || null,
    weapon_custom_effect: instance.weapon_custom_effect?.trim() || null,

    is_equipped: instance.is_equipped,
    storedAt: instance.storedAt,
    _instanceId: instance._instanceId ?? null,
  };
}

module.exports = {
  applyMaterialToMelee,
  resolveMeleeWeapons,
  calculateHex,
};
