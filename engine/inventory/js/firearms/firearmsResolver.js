const { formatDamageString } = require("../shared/weaponDamage.js");
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

// Values are signed at the validation layer (fortify/add positive, weaken/remove negative), so a plain sum is the net modifier.
function sumEnchantmentValuesByTarget(enchantments, types, target) {
  return enchantments
    .filter(
      (entry) =>
        types.includes(entry.enchantment_effect_type) &&
        entry.target === target,
    )
    .reduce((sum, entry) => sum + Number(entry.value || 0), 0);
}

function sumEnchantmentValues(enchantments, types) {
  return enchantments
    .filter((entry) => types.includes(entry.enchantment_effect_type))
    .reduce((sum, entry) => sum + Number(entry.value || 0), 0);
}

// Unlike ranged/melee, firearm damage is never influenced by material — only weight/price/hit points are. GDP is resolved separately in resolveFirearmWeapon.
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

// Firearms don't depend on character ST: damage comes from the weapon's own dice, and combat stats (GDP/TR/PREC/magazine size) are each a CSV base plus a player-editable runtime modifier.
// Enchantment deltas for GDP/TR/PREC stack on top of that runtime modifier; Min Strength has no runtime modifier so its delta applies directly, mirroring rangedResolver.js.
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
    weapon_id: weapon.weapon_id,
    weapon_name: weapon.weapon_name,
    weapon_type: weapon.weapon_type,
    weapon_skill: weapon.weapon_skill,
    weapon_tier: weapon.weapon_tier,
    weapon_damage_type: weapon.weapon_damage_type,
    weapon_length: weapon.weapon_length,
    weapon_reload_speed: weapon.weapon_reload_speed,
    weapon_cdt: weapon.weapon_cdt,

    weapon_gdp_dice: weapon.weapon_gdp_dice,

    weapon_half_distance: weapon.weapon_half_distance,
    weapon_max_distance: weapon.weapon_max_distance,

    material_id: material?.material_id || null,
    material_name: material?.material_name || null,
    material_type: material?.material_type || null,
    material_tier: material?.material_tier || null,
    material_atk_effect: material?.material_atk_effect || null,

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

    enchantments,
    enchantments_total_price,
    enchantment_weight_modifier,

    hit_points_modifier: hitPointsModifier,
    final_hit_points: round2(
      finalStats.weapon_final_hit_points + hitPointsModifier,
    ),
    gdp_modifier: gdpModifier,
    tr_modifier: trModifier,
    prec_modifier: precModifier,
    magazine_size_modifier: magazineSizeModifier,
    rounds_loaded: roundsLoaded,

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

// Only equipped + backpack count as carried weight.
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

module.exports = {
  applyMaterialToFirearm,
  resolveFirearmWeapon,
  calculateTotalFirearmsWeight,
  calculateTotalFirearmsValue,
};
