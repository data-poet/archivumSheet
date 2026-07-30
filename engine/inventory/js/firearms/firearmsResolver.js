const { formatDamageString } = require("../shared/weaponDamage.js");

// ─────────────────────────────────────────────────────────────────────────────
// FIREARMS RESOLVER
// ─────────────────────────────────────────────────────────────────────────────

function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

// ─────────────────────────────────────────────────────────────────────────────
// RESOLVERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Applies material modifiers to firearm stats.
 *
 * Unlike ranged/melee weapons, firearms never have their damage influenced
 * by materials — only weight, price, and hit points are affected. There is
 * no `weapon_final_gdp_modifier` here; GDP resolution is handled separately
 * in resolveFirearmWeapon, driven by the weapon's own dice + modifiers.
 */
function applyMaterialToFirearm(weapon, material) {
  if (!material) {
    return {
      weapon_final_weight: round2(weapon.weapon_weight),
      weapon_final_price: round2(weapon.weapon_price),
      weapon_final_hit_points: round2(weapon.weapon_hit_points),
    };
  }

  return {
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
 * - firearm db record
 * - material db record
 * - runtime instance state
 *
 * into a fully resolved firearm piece.
 *
 * Firearms do not depend on character ST at all: damage comes from the
 * weapon's own dice (weapon_gdp_dice), distances are flat values already
 * expressed in meters, and combat stats (GDP modifier, TR, PREC, magazine
 * size) are each a base value from the CSV plus a player-editable runtime
 * modifier — giving artificer builds room to tinker with their firearms.
 */
function resolveFirearmWeapon(instance, weapon, material = null) {
  const finalStats = applyMaterialToFirearm(weapon, material);

  const hitPointsModifier = Number(instance.hit_points_modifier || 0);

  const gdpModifier = Number(instance.gdp_modifier || 0);
  const trModifier = Number(instance.tr_modifier || 0);
  const precModifier = Number(instance.prec_modifier || 0);
  const magazineSizeModifier = Number(instance.magazine_size_modifier || 0);

  const finalGdpModifier = Number(weapon.weapon_gdp_modifier || 0) + gdpModifier;
  const finalTr = Number(weapon.weapon_tr || 0) + trModifier;
  const finalPrec = Number(weapon.weapon_prec || 0) + precModifier;
  const finalMagazineSize = Math.max(
    0,
    Number(weapon.weapon_magazine_size || 0) + magazineSizeModifier,
  );

  const roundsLoaded = Math.min(
    Math.max(Number(instance.rounds_loaded || 0), 0),
    finalMagazineSize,
  );

  return {
    // WEAPON BASE
    weapon_id: weapon.weapon_id,
    weapon_name: weapon.weapon_name,
    weapon_type: weapon.weapon_type,
    weapon_skill: weapon.weapon_skill,
    weapon_tier: weapon.weapon_tier,
    weapon_min_strength: weapon.weapon_min_strength,
    weapon_damage_type: weapon.weapon_damage_type,
    weapon_length: weapon.weapon_length,
    weapon_reload_speed: weapon.weapon_reload_speed,
    weapon_cdt: weapon.weapon_cdt,

    // GDP DICE (raw, exposed for UI reference)
    weapon_gdp_dice: weapon.weapon_gdp_dice,

    // RESOLVED DISTANCES — flat values from the CSV, no ST formula
    weapon_half_distance: weapon.weapon_half_distance,
    weapon_max_distance: weapon.weapon_max_distance,

    // MATERIAL
    material_id: material?.material_id || null,
    material_name: material?.material_name || null,
    material_type: material?.material_type || null,
    material_tier: material?.material_tier || null,
    material_atk_effect: material?.material_atk_effect || null,

    // FINAL VALUES (material-adjusted weight/price/HP + base+runtime combat stats)
    ...finalStats,
    weapon_final_gdp_modifier: finalGdpModifier,
    weapon_final_tr: finalTr,
    weapon_final_prec: finalPrec,
    weapon_final_magazine_size: finalMagazineSize,
    weapon_gdp_damage: formatDamageString(
      weapon.weapon_gdp_dice,
      finalGdpModifier,
    ),

    // RUNTIME MODIFIERS
    hit_points_modifier: hitPointsModifier,
    final_hit_points: round2(
      finalStats.weapon_final_hit_points + hitPointsModifier,
    ),
    gdp_modifier: gdpModifier,
    tr_modifier: trModifier,
    prec_modifier: precModifier,
    magazine_size_modifier: magazineSizeModifier,
    rounds_loaded: roundsLoaded,

    // VALUE — one instance = one piece
    total_value: round2(finalStats.weapon_final_price),

    // CUSTOM FIELDS
    weapon_custom_name: instance.weapon_custom_name?.trim() || null,
    weapon_custom_description: instance.weapon_custom_description?.trim() || null,
    weapon_custom_effect: instance.weapon_custom_effect?.trim() || null,

    // RUNTIME
    is_equipped: instance.is_equipped,
    storedAt: instance.storedAt,
    _instanceId: instance._instanceId ?? null,
  };
}

/**
 * Calculates total carried firearm weight.
 *
 * Only:
 * - equipped
 * - backpack
 *
 * count as carried weight.
 */
function calculateTotalFirearmsWeight(
  firearmsInventory,
  firearmsDb,
  materialDb = {},
) {
  return firearmsInventory.reduce((sum, instance) => {
    if (instance.storedAt === "stash" || instance.storedAt === "camp") {
      return sum;
    }

    const weapon = firearmsDb[instance.weapon_id];
    if (!weapon) return sum;

    const material = instance.material_id
      ? materialDb[instance.material_id]
      : null;

    const resolved = resolveFirearmWeapon(instance, weapon, material);

    return sum + resolved.weapon_final_weight;
  }, 0);
}

/**
 * Calculates total firearms value (equipped + backpack).
 * Stash and camp are excluded — mirrors the weight convention.
 */
function calculateTotalFirearmsValue(
  firearmsInventory,
  firearmsDb,
  materialDb = {},
) {
  return round2(
    firearmsInventory.reduce((sum, instance) => {
      if (instance.storedAt === "stash" || instance.storedAt === "camp") {
        return sum;
      }

      const weapon = firearmsDb[instance.weapon_id];
      if (!weapon) return sum;

      const material = instance.material_id
        ? materialDb[instance.material_id]
        : null;

      const resolved = resolveFirearmWeapon(instance, weapon, material);

      return sum + resolved.total_value;
    }, 0),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  applyMaterialToFirearm,
  resolveFirearmWeapon,
  calculateTotalFirearmsWeight,
  calculateTotalFirearmsValue,
};
