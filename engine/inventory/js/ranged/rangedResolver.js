// ─────────────────────────────────────────────────────────────────────────────
// RANGED RESOLVER
// ─────────────────────────────────────────────────────────────────────────────

function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function resolveDistanceFormula(formula, ST = 0) {
  if (formula == null) {
    return 0;
  }

  const clean = String(formula).trim().toUpperCase().replace(/×/g, "X");

  // ST
  if (clean === "ST") {
    return Math.floor(ST);
  }

  // ST x number
  let match = clean.match(/^ST\s*[X*]\s*([\d.]+)$/);

  if (match) {
    return Math.floor(ST * Number(match[1]));
  }

  // ST - number
  match = clean.match(/^ST\s*-\s*([\d.]+)$/);

  if (match) {
    return Math.floor(ST - Number(match[1]));
  }

  // ST + number
  match = clean.match(/^ST\s*\+\s*([\d.]+)$/);

  if (match) {
    return Math.floor(ST + Number(match[1]));
  }

  throw new Error(`[resolveDistanceFormula] Invalid formula "${formula}"`);
}

// ─────────────────────────────────────────────────────────────────────────────
// RESOLVERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Applies material modifiers to weapon stats.
 */
function applyMaterialToRanged(weapon, material) {
  if (!material) {
    return {
      weapon_final_gdp_modifier: round2(weapon.weapon_gdp_modifier),
      weapon_final_weight: round2(weapon.weapon_weight),
      weapon_final_price: round2(weapon.weapon_price),
      weapon_final_hit_points: round2(weapon.weapon_hit_points),
    };
  }

  return {
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
function resolveRangedWeapons(instance, weapon, material = null, ST = 0) {
  const finalStats = applyMaterialToRanged(weapon, material);

  const hitPointsModifier = Number(instance.hit_points_modifier || 0);

  const halfDistance = resolveDistanceFormula(weapon.weapon_half_distance, ST);

  const maxDistance = resolveDistanceFormula(weapon.weapon_max_distance, ST);

  return {
    // WEAPON BASE
    weapon_id: weapon.weapon_id,
    weapon_name: weapon.weapon_name,
    weapon_box_name: weapon.weapon_box_name,
    weapon_type: weapon.weapon_type,
    weapon_skill: weapon.weapon_skill,
    weapon_tier: weapon.weapon_tier,
    weapon_min_strength: weapon.weapon_min_strength,
    weapon_damage_type: weapon.weapon_damage_type,
    weapon_gdp_modifier: weapon.weapon_gdp_modifier,
    weapon_tr: weapon.weapon_tr,
    weapon_prec: weapon.weapon_prec,
    weapon_weight: weapon.weapon_weight,
    weapon_price: weapon.weapon_price,
    weapon_hit_points: weapon.weapon_hit_points,

    // RESOLVED DISTANCES
    weapon_half_distance: halfDistance,
    weapon_max_distance: maxDistance,

    // MATERIAL
    material_id: material?.material_id || null,
    material_name: material?.material_name || null,
    material_type: material?.material_type || null,
    material_tier: material?.material_tier || null,
    material_dr_modifier: Number(material?.material_dr_modifier || 0),
    material_atk_effect: material?.material_atk_effect || null,
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
    _instanceId: instance._instanceId ?? null,
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
function calculateTotalRangedWeight(
  rangedInventory,
  rangedDb,
  materialDb = {},
  ST = 0,
) {
  return rangedInventory.reduce((sum, instance) => {
    if (instance.storedAt === "stash" || instance.storedAt === "camp") {
      return sum;
    }

    const weapon = rangedDb[instance.weapon_id];
    if (!weapon) return sum;

    const material = instance.material_id
      ? materialDb[instance.material_id]
      : null;

    const resolved = resolveRangedWeapons(instance, weapon, material, ST);

    return sum + resolved.weapon_final_weight;
  }, 0);
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  applyMaterialToRanged,
  resolveRangedWeapons,
  calculateTotalRangedWeight,
  resolveDistanceFormula,
};
