// ─────────────────────────────────────────────────────────────────────────────
// MELEE RESOLVER
// ─────────────────────────────────────────────────────────────────────────────

const {
  resolveItemEnchantments,
} = require("../shared/enchantmentsResolver.js");
const {
  WEIGHT_EFFECT_TYPES,
  DAMAGE_EFFECT_TYPES,
  REQUISITE_EFFECT_TYPES,
} = require("../shared/enchantmentsConstants.js");

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
 * Sums the `value` of every resolved enchantment entry whose
 * enchantment_effect_type is in `types` AND whose (resolved) `target`
 * matches — used to isolate BAL vs GDP (both share DAMAGE_EFFECT_TYPES)
 * and Min Strength (REQUISITE_EFFECT_TYPES, the only requisite target
 * melee ever offers — see meleeConstants.js). Both groups are signed at
 * the validation layer (fortify/add positive, weaken/remove negative),
 * so a plain sum is the net modifier — same convention as
 * armorResolver.js's sumEnchantmentValues.
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
 * BAL/GDP and Min Strength enchantment deltas are applied directly onto
 * `weapon_final_bal_modifier`/`weapon_final_gdp_modifier`/
 * `weapon_min_strength` — unlike armor's DR modifier, there's no separate
 * downstream "truly final" field for these on melee (weaponDamage.js,
 * render.js, and buildSheet.js all read these fields directly), so the
 * enchantment delta has to land in the field that's actually consumed.
 * Weight is the exception: it already has a two-tier material-only
 * (`weapon_final_weight`) vs. truly-final (`final_weight`) split, so it
 * mirrors armor's `final_weight` calc exactly — enchantment weight is a
 * percentage of the post-material weight (enchantment_is_percentage is
 * true for add_weight/remove_weight), applied once after summing every
 * weight enchantment on the item.
 *
 * Enchantment price (enchantments_total_price) is intrinsic to the item
 * and counts toward total_value regardless of equip state, same as
 * armor/shield/accessories/magicGear.
 */
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
    // WEAPON BASE
    weapon_id: weapon.weapon_id,
    weapon_name: weapon.weapon_name,
    weapon_box_name: weapon.weapon_box_name,
    weapon_type: weapon.weapon_type,
    weapon_skill: weapon.weapon_skill,
    weapon_tier: weapon.weapon_tier,
    weapon_damage_type: weapon.weapon_damage_type,
    weapon_reach: calculateHex(weapon.weapon_length),

    // MATERIAL
    material_id: material?.material_id || null,
    material_name: material?.material_name || null,
    material_type: material?.material_type || null,
    material_tier: material?.material_tier || null,
    material_atk_effect: material?.material_atk_effect || null,

    // FINAL VALUES (BAL/GDP/Min Strength include the enchantment delta —
    // see doc comment above; weight stays material-derived only, same as
    // armor's *_final_weight convention)
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

    // ENCHANTMENTS
    enchantments,
    enchantments_total_price,
    enchantment_weight_modifier,

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
function calculateTotalMeleeWeight(
  meleeInventory,
  meleeDb,
  materialDb = {},
  enchantmentsDb = {},
  targetsDb = {},
) {
  return meleeInventory.reduce((sum, instance) => {
    if (instance.storedAt === "stash" || instance.storedAt === "camp") {
      return sum;
    }

    const weapon = meleeDb[instance.weapon_id];
    if (!weapon) return sum;

    const material = instance.material_id
      ? materialDb[instance.material_id]
      : null;

    const resolved = resolveMeleeWeapons(
      instance,
      weapon,
      material,
      enchantmentsDb,
      targetsDb,
    );

    return sum + resolved.final_weight;
  }, 0);
}

/**
 * Calculates total melee value (equipped + backpack).
 * Stash and camp are excluded — mirrors the weight convention.
 */
function calculateTotalMeleeValue(
  meleeInventory,
  meleeDb,
  materialDb = {},
  enchantmentsDb = {},
  targetsDb = {},
) {
  return round2(
    meleeInventory.reduce((sum, instance) => {
      if (instance.storedAt === "stash" || instance.storedAt === "camp") {
        return sum;
      }

      const weapon = meleeDb[instance.weapon_id];
      if (!weapon) return sum;

      const material = instance.material_id
        ? materialDb[instance.material_id]
        : null;

      const resolved = resolveMeleeWeapons(
        instance,
        weapon,
        material,
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
  applyMaterialToMelee,
  resolveMeleeWeapons,
  calculateTotalMeleeWeight,
  calculateTotalMeleeValue,
  calculateHex,
};
