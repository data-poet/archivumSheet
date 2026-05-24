// ─────────────────────────────────────────────────────────────────────────────
// MELEE RESOLVER
// ─────────────────────────────────────────────────────────────────────────────

function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function calculateHex(length) {
  if (length < 1) {
    return 1;
  }

  return Math.floor((length + 1) / 2) + 1;
}

// ─────────────────────────────────────────────────────────────────────────────
// RESOLVERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Applies material modifiers to weapon stats.
 */
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

/**
 * Merges:
 *
 * - weapon db record
 * - material db record
 * - runtime instance state
 *
 * into a fully resolved weapon piece.
 */
function resolveMeleeWeapons(instance, weapon, material = null) {
  const finalStats = applyMaterialToMelee(weapon, material);

  const hitPointsModifier = Number(instance.hit_points_modifier || 0);

  return {
    // WEAPON BASE
    weapon_id: weapon.weapon_id,
    weapon_name: weapon.weapon_name,
    weapon_box_name: weapon.weapon_box_name,
    weapon_type: weapon.weapon_type,
    weapon_skill: weapon.weapon_skill,
    weapon_tier: weapon.weapon_tier,
    weapon_length: weapon.weapon_length,
    weapon_reach: calculateHex(weapon.weapon_length),
    weapon_bal_modifier: weapon.weapon_bal_modifier,
    weapon_gdp_modifier: weapon.weapon_gdp_modifier,
    weapon_weight: weapon.weapon_weight,
    weapon_price: weapon.weapon_price,
    weapon_hit_points: weapon.weapon_hit_points,

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
      finalStats.weapon_final_hit_points + hitPointsModifier,
    ),

    // RUNTIME
    is_equipped: instance.is_equipped,
    storedAt: instance.storedAt,
  };
}

/**
 * Calculates total carried weapon weight.
 *
 * Only:
 * - equipped
 * - backpack
 *
 * count as carried weight.
 */
function calculateTotalMeleeWeight(meleeInventory, meleeDb, materialDb = {}) {
  return meleeInventory.reduce((sum, instance) => {
    if (instance.storedAt === "stash" || instance.storedAt === "camp") {
      return sum;
    }

    const weapon = meleeDb[instance.weapon_id];
    if (!weapon) return sum;

    const material = instance.material_id
      ? materialDb[instance.material_id]
      : null;

    const resolved = resolveMeleeWeapons(instance, weapon, material);

    return sum + resolved.weapon_final_weight;
  }, 0);
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  applyMaterialToMelee,
  resolveMeleeWeapons,
  calculateTotalMeleeWeight,
};
