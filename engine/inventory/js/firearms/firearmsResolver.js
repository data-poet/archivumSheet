const { formatDamageString } = require("../shared/weaponDamage.js");
const {
  resolveItemEnchantments,
} = require("../shared/enchantmentsResolver.js");
const {
  WEIGHT_EFFECT_TYPES,
  DAMAGE_EFFECT_TYPES,
  REQUISITE_EFFECT_TYPES,
} = require("../shared/enchantmentsConstants.js");

// ─────────────────────────────────────────────────────────────────────────────
// FIREARMS RESOLVER
// ─────────────────────────────────────────────────────────────────────────────

function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Sums the `value` of every resolved enchantment entry whose
 * enchantment_effect_type is in `types` AND whose (resolved) `target`
 * matches — used to isolate GDP, Min Strength, PREC, and TR. Both groups
 * are signed at the validation layer (fortify/add positive, weaken/remove
 * negative), so a plain sum is the net modifier — same convention as
 * meleeResolver.js/rangedResolver.js's sumEnchantmentValuesByTarget.
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
 * - enchantments (Phase 3) applied to this instance
 *
 * into a fully resolved firearm piece.
 *
 * Firearms do not depend on character ST at all: damage comes from the
 * weapon's own dice (weapon_gdp_dice), distances are flat values already
 * expressed in meters, and combat stats (GDP modifier, TR, PREC, magazine
 * size) are each a base value from the CSV plus a player-editable runtime
 * modifier — giving artificer builds room to tinker with their firearms.
 *
 * Enchantment deltas for GDP/TR/PREC stack on top of that existing
 * player-runtime modifier (both are just additive terms onto the same
 * base), same "no separate truly-final tier for terminal combat-math
 * fields" reasoning as melee/ranged — these ARE the values consumed
 * downstream. Min Strength has no player-runtime modifier field, so its
 * enchantment delta is applied directly onto `weapon_min_strength`,
 * mirroring rangedResolver.js. No BAL or special_effect here — neither is
 * offered to firearms per the CSV's allowed_itens. Weight keeps the
 * two-tier material-only (`weapon_final_weight`) vs. truly-final
 * (`final_weight`) split, mirroring melee/ranged/armor/shield.
 */
function resolveFirearmWeapon(
  instance,
  weapon,
  material = null,
  enchantmentsDb = {},
  targetsDb = {},
) {
  const finalStats = applyMaterialToFirearm(weapon, material);

  const hitPointsModifier = Number(instance.hit_points_modifier || 0);

  const gdpModifier = Number(instance.gdp_modifier || 0);
  const trModifier = Number(instance.tr_modifier || 0);
  const precModifier = Number(instance.prec_modifier || 0);
  const magazineSizeModifier = Number(instance.magazine_size_modifier || 0);

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

  const finalGdpModifier =
    Number(weapon.weapon_gdp_modifier || 0) +
    gdpModifier +
    enchantment_gdp_modifier;
  const finalTr =
    Number(weapon.weapon_tr || 0) + trModifier + enchantment_tr_modifier;
  const finalPrec =
    Number(weapon.weapon_prec || 0) + precModifier + enchantment_prec_modifier;
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

    // FINAL VALUES (material-adjusted weight/price/HP + base+runtime+
    // enchantment combat stats — GDP/TR/PREC include the enchantment delta,
    // see doc comment above; weight stays material-derived only)
    ...finalStats,
    weapon_min_strength: round2(
      weapon.weapon_min_strength + enchantment_min_strength_modifier,
    ),
    weapon_final_gdp_modifier: finalGdpModifier,
    weapon_final_tr: finalTr,
    weapon_final_prec: finalPrec,
    weapon_final_magazine_size: finalMagazineSize,
    weapon_gdp_damage: formatDamageString(
      weapon.weapon_gdp_dice,
      finalGdpModifier,
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
    gdp_modifier: gdpModifier,
    tr_modifier: trModifier,
    prec_modifier: precModifier,
    magazine_size_modifier: magazineSizeModifier,
    rounds_loaded: roundsLoaded,

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
  enchantmentsDb = {},
  targetsDb = {},
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

    const resolved = resolveFirearmWeapon(
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
 * Calculates total firearms value (equipped + backpack).
 * Stash and camp are excluded — mirrors the weight convention.
 */
function calculateTotalFirearmsValue(
  firearmsInventory,
  firearmsDb,
  materialDb = {},
  enchantmentsDb = {},
  targetsDb = {},
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

      const resolved = resolveFirearmWeapon(
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
  applyMaterialToFirearm,
  resolveFirearmWeapon,
  calculateTotalFirearmsWeight,
  calculateTotalFirearmsValue,
};
