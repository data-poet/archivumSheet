
const {
  resolveItemEnchantments,
} = require("../shared/enchantmentsResolver.js");
const {
  WEIGHT_EFFECT_TYPES,
  DAMAGE_RESISTANCE_EFFECT_TYPES,
} = require("../shared/enchantmentsConstants.js");

function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function applyMaterialToShield(shield, material) {
  if (!material) {
    return {
      shield_final_damage_resistance: round2(shield.shield_damage_resistance),
      shield_final_weight: round2(shield.shield_weight),
      shield_final_price: round2(shield.shield_price),
      shield_final_hit_points: round2(shield.shield_hit_points),
    };
  }

  return {
    shield_final_damage_resistance: round2(
      shield.shield_damage_resistance +
        Number(material.material_dr_modifier || 0),
    ),
    shield_final_weight: round2(
      shield.shield_weight * Number(material.material_weight_modifier || 1),
    ),
    shield_final_price: round2(
      shield.shield_price * Number(material.material_price_modifier || 1),
    ),
    shield_final_hit_points: round2(
      shield.shield_hit_points *
        Number(material.material_hit_points_modifier || 1),
    ),
  };
}

// Values are signed at the validation layer (fortify/add positive, weaken/remove negative), so a plain sum is the net modifier.
function sumEnchantmentValues(enchantments, types) {
  return enchantments
    .filter((entry) => types.includes(entry.enchantment_effect_type))
    .reduce((sum, entry) => sum + Number(entry.value || 0), 0);
}

// shield_final_weight/shield_final_damage_resistance stay material-derived only; final_weight/final_damage_resistance layer enchantments on top, mirroring armorResolver.js.
function resolveShieldPiece(
  instance,
  shield,
  material = null,
  enchantmentsDb = {},
  targetsDb = {},
) {
  const finalStats = applyMaterialToShield(shield, material);

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

    hit_points_modifier: hitPointsModifier,
    final_hit_points: round2(
      finalStats.shield_final_hit_points + hitPointsModifier,
    ),

    final_weight: round2(
      finalStats.shield_final_weight * (1 + enchantment_weight_modifier),
    ),
    final_damage_resistance: round2(
      finalStats.shield_final_damage_resistance +
        enchantment_damage_resistance_modifier,
    ),

    total_value: round2(
      finalStats.shield_final_price + enchantments_total_price,
    ),

    shield_custom_name: instance.shield_custom_name?.trim() || null,
    shield_custom_description:
      instance.shield_custom_description?.trim() || null,
    shield_custom_effect: instance.shield_custom_effect?.trim() || null,

    is_equipped: instance.is_equipped,
    storedAt: instance.storedAt,
    _instanceId: instance._instanceId ?? null,
  };
}

// Only equipped + backpack count as carried weight.
function calculateTotalShieldWeight(
  shieldInventory,
  shieldDb,
  materialDb = {},
  enchantmentsDb = {},
  targetsDb = {},
) {
  return shieldInventory.reduce((sum, instance) => {
    if (instance.storedAt === "stash" || instance.storedAt === "camp") {
      return sum;
    }

    const shield = shieldDb[instance.shield_id];
    if (!shield) return sum;

    const material = instance.material_id
      ? materialDb[instance.material_id]
      : null;

    const resolved = resolveShieldPiece(
      instance,
      shield,
      material,
      enchantmentsDb,
      targetsDb,
    );

    return sum + resolved.final_weight;
  }, 0);
}

function calculateTotalShieldValue(
  shieldInventory,
  shieldDb,
  materialDb = {},
  enchantmentsDb = {},
  targetsDb = {},
) {
  return round2(
    shieldInventory.reduce((sum, instance) => {
      if (instance.storedAt === "stash" || instance.storedAt === "camp") {
        return sum;
      }

      const shield = shieldDb[instance.shield_id];
      if (!shield) return sum;

      const material = instance.material_id
        ? materialDb[instance.material_id]
        : null;

      const resolved = resolveShieldPiece(
        instance,
        shield,
        material,
        enchantmentsDb,
        targetsDb,
      );

      return sum + resolved.total_value;
    }, 0),
  );
}

module.exports = {
  applyMaterialToShield,
  resolveShieldPiece,
  calculateTotalShieldWeight,
  calculateTotalShieldValue,
};
