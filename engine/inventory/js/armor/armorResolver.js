const { SLOT_MAP } = require("./armorConstants");
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

// Resolvers

/**
 * Applies material modifiers to armor stats
 */
function applyMaterialToArmor(armor, material) {
  if (!material) {
    return {
      armor_final_damage_resistance: round2(armor.armor_damage_resistance),
      armor_final_weight: round2(armor.armor_weight),
      armor_final_price: round2(armor.armor_price),
      armor_final_hit_points: round2(armor.armor_hit_points),
    };
  }

  return {
    armor_final_damage_resistance: round2(
      armor.armor_damage_resistance +
        Number(material.material_dr_modifier || 0),
    ),

    armor_final_weight: round2(
      armor.armor_weight * Number(material.material_weight_modifier || 1),
    ),

    armor_final_price: round2(
      armor.armor_price * Number(material.material_price_modifier || 1),
    ),

    armor_final_hit_points: round2(
      armor.armor_hit_points *
        Number(material.material_hit_points_modifier || 1),
    ),
  };
}

/**
 * Sums the `value` of every resolved enchantment entry whose
 * enchantment_effect_type is in `types` — shared by the weight and
 * damage-resistance rollups below. Both groups are signed at the
 * validation layer (fortify/add positive, weaken/remove negative), so a
 * plain sum is the net modifier.
 */
function sumEnchantmentValues(enchantments, types) {
  return enchantments
    .filter((entry) => types.includes(entry.enchantment_effect_type))
    .reduce((sum, entry) => sum + Number(entry.value || 0), 0);
}

/**
 * Merges:
 *
 * - armor db record
 * - material db record
 * - runtime instance state
 * - enchantments (Phase 2) applied to this instance
 *
 * into a fully resolved armor piece.
 *
 * `armor_final_weight`/`armor_final_damage_resistance` stay
 * material-derived only (unchanged from Phase 1 — other code may still
 * read them expecting that). `final_weight`/`final_damage_resistance` are
 * the truly-final numbers, mirroring the existing
 * armor_final_hit_points -> final_hit_points (+ hit_points_modifier)
 * pattern: enchantment weight is a percentage of the post-material
 * weight (enchantment_is_percentage is true for add_weight/remove_weight
 * — see enchantmentsConstants.js), applied once after summing every
 * weight enchantment on the item; damage resistance is a flat sum added
 * on top, same as the runtime hit_points_modifier.
 *
 * Enchantment price (enchantments_total_price) is intrinsic to the item
 * and counts toward total_value regardless of equip state, same as
 * accessories/magicGear — see accessoriesResolver.js. The enchantments'
 * MECHANICAL effect on weight/DR is likewise item-intrinsic (applies
 * whether worn or in the backpack); it's only the character-level
 * elemental-resistance effect that's equipped-only, resolved separately
 * in collectEquippedEnchantments.js.
 */
function resolveArmorPiece(
  instance,
  armor,
  material = null,
  enchantmentsDb = {},
  targetsDb = {},
) {
  const finalStats = applyMaterialToArmor(armor, material);

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
    armor_id: armor.armor_id,

    armor_name: armor.armor_name,
    armor_box_name: armor.armor_box_name,
    armor_piece_location: SLOT_MAP[armor.armor_piece_location],
    armor_type: armor.armor_type,
    armor_tier: armor.armor_tier,

    // MATERIAL
    material_id: material?.material_id || null,

    material_name: material?.material_name || null,
    material_type: material?.material_type || null,
    material_tier: material?.material_tier || null,
    material_def_effect: material?.material_def_effect || null,

    // FINAL VALUES (material-derived only — see doc comment above)
    ...finalStats,

    // ENCHANTMENTS
    enchantments,
    enchantments_total_price,
    enchantment_weight_modifier,
    enchantment_damage_resistance_modifier,

    // RUNTIME MODIFIERS
    hit_points_modifier: hitPointsModifier,

    final_hit_points: round2(
      finalStats.armor_final_hit_points + hitPointsModifier,
    ),

    // TRULY-FINAL VALUES (material + enchantments)
    final_weight: round2(
      finalStats.armor_final_weight * (1 + enchantment_weight_modifier),
    ),
    final_damage_resistance: round2(
      finalStats.armor_final_damage_resistance +
        enchantment_damage_resistance_modifier,
    ),

    // VALUE — armor has no quantity; one instance = one piece
    total_value: round2(
      finalStats.armor_final_price + enchantments_total_price,
    ),

    // CUSTOM FIELDS
    armor_custom_name: instance.armor_custom_name?.trim() || null,
    armor_custom_description: instance.armor_custom_description?.trim() || null,
    armor_custom_effect: instance.armor_custom_effect?.trim() || null,

    // RUNTIME
    is_equipped: instance.is_equipped,

    storedAt: instance.storedAt,
    _instanceId: instance._instanceId ?? null,
  };
}

function buildEquippedSlots() {
  return Object.fromEntries(
    Object.values(SLOT_MAP).map((slot) => [slot, null]),
  );
}

/**
 * Calculates total carried armor weight.
 *
 * Only:
 * - equipped
 * - backpack
 *
 * count as carried weight.
 */
function calculateTotalArmorWeight(
  armorInventory,
  armorDb,
  materialDb = {},
  enchantmentsDb = {},
  targetsDb = {},
) {
  return armorInventory.reduce((sum, instance) => {
    if (instance.storedAt === "stash" || instance.storedAt === "camp") {
      return sum;
    }

    const armor = armorDb[instance.armor_id];
    if (!armor) return sum;

    const material = instance.material_id
      ? materialDb[instance.material_id]
      : null;

    const resolved = resolveArmorPiece(
      instance,
      armor,
      material,
      enchantmentsDb,
      targetsDb,
    );

    return sum + resolved.final_weight;
  }, 0);
}

/**
 * Calculates total armor value (equipped + backpack).
 * Stash and camp are excluded — mirrors the weight convention.
 */
function calculateTotalArmorValue(
  armorInventory,
  armorDb,
  materialDb = {},
  enchantmentsDb = {},
  targetsDb = {},
) {
  return round2(
    armorInventory.reduce((sum, instance) => {
      if (instance.storedAt === "stash" || instance.storedAt === "camp") {
        return sum;
      }

      const armor = armorDb[instance.armor_id];
      if (!armor) return sum;

      const material = instance.material_id
        ? materialDb[instance.material_id]
        : null;

      const resolved = resolveArmorPiece(
        instance,
        armor,
        material,
        enchantmentsDb,
        targetsDb,
      );

      return sum + resolved.total_value;
    }, 0),
  );
}

// Exports

module.exports = {
  applyMaterialToArmor,
  resolveArmorPiece,
  buildEquippedSlots,
  calculateTotalArmorWeight,
  calculateTotalArmorValue,
};
