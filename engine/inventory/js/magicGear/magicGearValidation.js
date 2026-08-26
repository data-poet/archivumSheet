const {
  VALID_STORED_AT,
  MAGIC_GEAR_EQUIP_LIMITS,
} = require("./magicGearConstants");

const {
  validateEnchantmentEntryShape,
  validateEnchantmentEntryApplication,
} = require("../shared/enchantmentsValidation.js");

// enchantment_allowed_itens category for this item type — matches the
// SLOT_MAP-style Portuguese keys convention used by accessories/armor.
const MAGIC_GEAR_ITEM_CATEGORY = "Instrumentos Mágicos";

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validates a single magic gear instance object (shape only, no DB lookups).
 * Returns an array of error strings (empty = valid).
 *
 * Unlike accessories, price and weight are NOT user-input here — they come
 * entirely from the DB catalog row (db_magic_gear.csv), so no price field
 * is validated on the instance.
 */
function validateMagicGearInstance(instance, index) {
  const errors = [];
  const prefix = `magicGearInventory[${index}]`;

  if (!instance || typeof instance !== "object") {
    return [`${prefix}: must be an object`];
  }

  if (typeof instance.magic_gear_id !== "string" || !instance.magic_gear_id) {
    errors.push(`${prefix}: magic_gear_id is required`);
  }

  if (typeof instance.is_equipped !== "boolean") {
    errors.push(`${prefix}: is_equipped must be a boolean`);
  }

  if (instance.is_equipped === true && instance.storedAt !== null) {
    errors.push(`${prefix}: storedAt must be null when is_equipped is true`);
  }

  if (
    instance.is_equipped === false &&
    !VALID_STORED_AT.includes(instance.storedAt)
  ) {
    errors.push(
      `${prefix}: storedAt must be one of [${VALID_STORED_AT.join(", ")}] when not equipped`,
    );
  }

  // custom fields — optional; if present must be a string or null
  for (const field of [
    "magic_gear_custom_name",
    "magic_gear_custom_description",
    "magic_gear_custom_effect",
  ]) {
    if (
      instance[field] !== null &&
      instance[field] !== undefined &&
      typeof instance[field] !== "string"
    ) {
      errors.push(`${prefix}: ${field} must be a string or null`);
    }
  }

  // enchantments — optional; unlimited count, no slot system
  if (instance.enchantments !== undefined) {
    if (!Array.isArray(instance.enchantments)) {
      errors.push(`${prefix}: enchantments must be an array when present`);
    } else {
      instance.enchantments.forEach((entry, entryIndex) => {
        errors.push(
          ...validateEnchantmentEntryShape(entry, entryIndex, prefix),
        );
      });
    }
  }

  return errors;
}

/**
 * DB-dependent enchantment checks (unknown ids, allowed_itens, target
 * existence, value/step alignment) — separate pass from the shape-only
 * checks above, same split accessories/armor/materials use.
 */
function validateMagicGearEnchantments(
  magicGearInventory,
  enchantmentsDb,
  targetsDb,
) {
  const errors = [];

  magicGearInventory.forEach((instance, index) => {
    const prefix = `magicGearInventory[${index}]`;
    const entries = instance.enchantments || [];

    entries.forEach((entry, entryIndex) => {
      errors.push(
        ...validateEnchantmentEntryApplication(
          entry,
          enchantmentsDb,
          targetsDb,
          MAGIC_GEAR_ITEM_CATEGORY,
          entryIndex,
          prefix,
        ),
      );
    });
  });

  return errors;
}

/**
 * Ensures the number of equipped instances of each magic_gear_type never
 * exceeds that type's entry in MAGIC_GEAR_EQUIP_LIMITS. Unlike accessories'
 * per-accessory_id limit, this is scoped to TYPE (Arcano, Musical, ...),
 * shared across every magic_gear_id of that type — 2 wands, or 1 wand + 1
 * staff, both count against the same Arcano limit.
 *
 * Requires magicGearDb (magic_gear_id -> DB row) to resolve each instance's
 * type; callers should run this only after confirming every magic_gear_id
 * is known (unknownIds check in buildMagicGearSlots runs first).
 *
 * Returns an array of error strings (empty = valid).
 */
function validateMagicGearEquipLimits(instances, magicGearDb) {
  const equippedCountByType = {};

  instances
    .filter((instance) => instance.is_equipped)
    .forEach((instance) => {
      const type = magicGearDb[instance.magic_gear_id]?.magic_gear_type;
      if (!type) return;
      equippedCountByType[type] = (equippedCountByType[type] || 0) + 1;
    });

  const errors = [];

  Object.entries(equippedCountByType).forEach(([type, count]) => {
    const limit = MAGIC_GEAR_EQUIP_LIMITS[type];
    if (limit != null && count > limit) {
      errors.push(
        `${count} "${type}" magic gear items equipped exceeds the limit of ${limit}`,
      );
    }
  });

  return errors;
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  validateMagicGearInstance,
  validateMagicGearEquipLimits,
  validateMagicGearEnchantments,
  MAGIC_GEAR_ITEM_CATEGORY,
};
