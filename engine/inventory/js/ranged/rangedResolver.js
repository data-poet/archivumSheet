// ─────────────────────────────────────────────────────────────────────────────
// RANGED RESOLVER
// ─────────────────────────────────────────────────────────────────────────────

const {
  resolveItemEnchantments,
  hasEnchantment,
} = require("../shared/enchantmentsResolver.js");
const {
  WEIGHT_EFFECT_TYPES,
  DAMAGE_EFFECT_TYPES,
  REQUISITE_EFFECT_TYPES,
} = require("../shared/enchantmentsConstants.js");
const { MAGIC_RETURN_ENCHANTMENT_ID } = require("./rangedConstants.js");

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
 * Sums the `value` of every resolved enchantment entry whose
 * enchantment_effect_type is in `types` AND whose (resolved) `target`
 * matches — used to isolate GDP, Min Strength, PREC, and TR (all four
 * share DAMAGE_EFFECT_TYPES/REQUISITE_EFFECT_TYPES, distinguished only by
 * target). Both groups are signed at the validation layer (fortify/add
 * positive, weaken/remove negative), so a plain sum is the net modifier —
 * same convention as meleeResolver.js's sumEnchantmentValuesByTarget.
 */
function sumEnchantmentValuesByTarget(enchantments, types, target) {
  return enchantments
    .filter(
      (entry) =>
        types.includes(entry.enchantment_effect_type) &&
        entry.target === target,
    )
    .reduce((sum, entry) => sum + Number(entry.value || 0), 0);
}

/**
 * Sums the `value` of every resolved enchantment entry whose
 * enchantment_effect_type is in `types`, regardless of target — used for
 * weight, which has no target at all.
 */
function sumEnchantmentValues(enchantments, types) {
  return enchantments
    .filter((entry) => types.includes(entry.enchantment_effect_type))
    .reduce((sum, entry) => sum + Number(entry.value || 0), 0);
}

/**
 * Merges:
 *
 * - weapon db record
 * - material db record
 * - runtime instance state
 * - enchantments (Phase 3) applied to this instance
 *
 * into a fully resolved weapon piece.
 *
 * GDP, Min Strength, PREC, and TR enchantment deltas are applied directly
 * onto `weapon_final_gdp_modifier`/`weapon_min_strength`/`weapon_prec`/
 * `weapon_tr` — same "no separate truly-final tier" reasoning as melee's
 * BAL/GDP/Min-Strength (see meleeResolver.js doc comment); these are the
 * terminal fields consumed downstream. Weight keeps the two-tier
 * material-only (`weapon_final_weight`) vs. truly-final (`final_weight`)
 * split, mirroring melee/armor/shield.
 *
 * `special_effect` (Retorno Mágico, row 066) has no magnitude at all — its
 * presence/absence on the resolved enchantments list IS the effect, so it
 * surfaces as a boolean `has_magic_return` flag rather than a numeric
 * delta. Keyed by enchantment_id (MAGIC_RETURN_ENCHANTMENT_ID), not
 * effect_type — a future special_effect row must not also flip this flag.
 *
 * Enchantment price (enchantments_total_price) is intrinsic to the item
 * and counts toward total_value regardless of equip state, same as every
 * other equipment type.
 */
function resolveRangedWeapons(
  instance,
  weapon,
  material = null,
  ST = 0,
  enchantmentsDb = {},
  targetsDb = {},
) {
  const finalStats = applyMaterialToRanged(weapon, material);

  const hitPointsModifier = Number(instance.hit_points_modifier || 0);

  const halfDistance = resolveDistanceFormula(weapon.weapon_half_distance, ST);

  const maxDistance = resolveDistanceFormula(weapon.weapon_max_distance, ST);

  const { resolved: enchantments, total_price: enchantments_total_price } =
    resolveItemEnchantments(
      instance.enchantments || [],
      enchantmentsDb,
      targetsDb,
    );

  const enchantment_weight_modifier = round2(
    sumEnchantmentValues(enchantments, WEIGHT_EFFECT_TYPES),
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

  const enchantment_prec_modifier = sumEnchantmentValuesByTarget(
    enchantments,
    REQUISITE_EFFECT_TYPES,
    "PREC",
  );

  const enchantment_tr_modifier = sumEnchantmentValuesByTarget(
    enchantments,
    REQUISITE_EFFECT_TYPES,
    "TR",
  );

  const has_magic_return = hasEnchantment(
    enchantments,
    MAGIC_RETURN_ENCHANTMENT_ID,
  );

  return {
    // WEAPON BASE
    weapon_id: weapon.weapon_id,
    weapon_name: weapon.weapon_name,
    weapon_box_name: weapon.weapon_box_name,
    weapon_type: weapon.weapon_type,
    weapon_skill: weapon.weapon_skill,
    weapon_tier: weapon.weapon_tier,
    weapon_damage_type: weapon.weapon_damage_type,

    // RESOLVED DISTANCES
    weapon_half_distance: halfDistance,
    weapon_max_distance: maxDistance,

    // MATERIAL
    material_id: material?.material_id || null,
    material_name: material?.material_name || null,
    material_type: material?.material_type || null,
    material_tier: material?.material_tier || null,
    material_atk_effect: material?.material_atk_effect || null,

    // FINAL VALUES (GDP/Min Strength/PREC/TR include the enchantment delta
    // — see doc comment above; weight stays material-derived only, same as
    // melee's weapon_final_weight convention)
    ...finalStats,
    weapon_final_gdp_modifier: round2(
      finalStats.weapon_final_gdp_modifier + enchantment_gdp_modifier,
    ),
    weapon_min_strength: round2(
      weapon.weapon_min_strength + enchantment_min_strength_modifier,
    ),
    weapon_prec: round2(weapon.weapon_prec + enchantment_prec_modifier),
    weapon_tr: round2(weapon.weapon_tr + enchantment_tr_modifier),

    // ENCHANTMENTS
    enchantments,
    enchantments_total_price,
    enchantment_weight_modifier,
    has_magic_return,

    // RUNTIME MODIFIERS
    hit_points_modifier: hitPointsModifier,
    final_hit_points: round2(
      finalStats.weapon_final_hit_points + hitPointsModifier,
    ),

    // TRULY-FINAL VALUES (material + enchantments)
    final_weight: round2(
      finalStats.weapon_final_weight * (1 + enchantment_weight_modifier),
    ),

    // VALUE — one instance = one piece
    total_value: round2(
      finalStats.weapon_final_price + enchantments_total_price,
    ),

    // CUSTOM FIELDS
    weapon_custom_name: instance.weapon_custom_name?.trim() || null,
    weapon_custom_description:
      instance.weapon_custom_description?.trim() || null,
    weapon_custom_effect: instance.weapon_custom_effect?.trim() || null,

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
  enchantmentsDb = {},
  targetsDb = {},
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

    const resolved = resolveRangedWeapons(
      instance,
      weapon,
      material,
      ST,
      enchantmentsDb,
      targetsDb,
    );

    return sum + resolved.final_weight;
  }, 0);
}

/**
 * Calculates total ranged value (equipped + backpack).
 * Stash and camp are excluded — mirrors the weight convention.
 */
function calculateTotalRangedValue(
  rangedInventory,
  rangedDb,
  materialDb = {},
  ST = 0,
  enchantmentsDb = {},
  targetsDb = {},
) {
  return round2(
    rangedInventory.reduce((sum, instance) => {
      if (instance.storedAt === "stash" || instance.storedAt === "camp") {
        return sum;
      }

      const weapon = rangedDb[instance.weapon_id];
      if (!weapon) return sum;

      const material = instance.material_id
        ? materialDb[instance.material_id]
        : null;

      const resolved = resolveRangedWeapons(
        instance,
        weapon,
        material,
        ST,
        enchantmentsDb,
        targetsDb,
      );

      return sum + resolved.total_value;
    }, 0),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  applyMaterialToRanged,
  resolveRangedWeapons,
  calculateTotalRangedWeight,
  calculateTotalRangedValue,
  resolveDistanceFormula,
};
