// ─────────────────────────────────────────────────────────────────────────────
// SHIELD RESOLVER
// ─────────────────────────────────────────────────────────────────────────────

function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

// ─────────────────────────────────────────────────────────────────────────────
// RESOLVERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Applies material modifiers to shield stats.
 */
function applyMaterialToShield(shield, material) {
  if (!material) {
    return {
      shield_final_damage_resistence: round2(shield.shield_damage_resistence),
      shield_final_weight: round2(shield.shield_weight),
      shield_final_price: round2(shield.shield_price),
      shield_final_hit_points: round2(shield.shield_hit_points),
    };
  }

  return {
    shield_final_damage_resistence: round2(
      shield.shield_damage_resistence +
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

/**
 * Merges:
 *
 * - shield db record
 * - material db record
 * - runtime instance state
 *
 * into a fully resolved shield piece.
 */
function resolveShieldPiece(instance, shield, material = null) {
  const finalStats = applyMaterialToShield(shield, material);

  const hitPointsModifier = Number(instance.hit_points_modifier || 0);

  return {
    // SHIELD BASE
    shield_id: shield.shield_id,
    shield_name: shield.shield_name,
    shield_box_name: shield.shield_box_name,
    shield_type: shield.shield_type,
    shield_tier: shield.shield_tier,
    shield_damage_resistence: shield.shield_damage_resistence,
    shield_weight: shield.shield_weight,
    shield_price: shield.shield_price,
    shield_hit_points: shield.shield_hit_points,

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
      finalStats.shield_final_hit_points + hitPointsModifier,
    ),

    // VALUE — one instance = one piece
    total_value: round2(finalStats.shield_final_price),

    // RUNTIME
    is_equipped: instance.is_equipped,
    storedAt: instance.storedAt,
    _instanceId: instance._instanceId ?? null,
  };
}

/**
 * Calculates total carried shield weight.
 *
 * Only:
 * - equipped
 * - backpack
 *
 * count as carried weight.
 */
function calculateTotalShieldWeight(
  shieldInventory,
  shieldDb,
  materialDb = {},
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

    const resolved = resolveShieldPiece(instance, shield, material);

    return sum + resolved.shield_final_weight;
  }, 0);
}

/**
 * Calculates total shield value (equipped + backpack).
 * Stash and camp are excluded — mirrors the weight convention.
 */
function calculateTotalShieldValue(shieldInventory, shieldDb, materialDb = {}) {
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

      const resolved = resolveShieldPiece(instance, shield, material);

      return sum + resolved.total_value;
    }, 0),
  );
}

/**
 * Calculates carried shield value (equipped + backpack).
 * Named alias for calculateTotalShieldValue — kept for symmetry with the
 * carried/total weight pair.
 */
function calculateCarriedShieldValue(
  shieldInventory,
  shieldDb,
  materialDb = {},
) {
  return calculateTotalShieldValue(shieldInventory, shieldDb, materialDb);
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  applyMaterialToShield,
  resolveShieldPiece,
  calculateTotalShieldWeight,
  calculateTotalShieldValue,
  calculateCarriedShieldValue,
};
