const { VALID_STORED_AT } = require("./accessoriesConstants");

const {
  validateEnchantmentEntryShape,
  validateEnchantmentEntryApplication,
} = require("../shared/enchantmentsValidation.js");

// enchantment_allowed_itens category for this item type — matches
// SLOT_MAP's Portuguese keys convention used by armor
const ACCESSORY_ITEM_CATEGORY = "Acessórios";

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validates a single accessory instance object (shape only, no DB lookups).
 * Returns an array of error strings (empty = valid).
 */
function validateAccessoryInstance(instance, index) {
  const errors = [];
  const prefix = `accessoryInventory[${index}]`;

  if (!instance || typeof instance !== "object") {
    return [`${prefix}: must be an object`];
  }

  if (typeof instance.accessory_id !== "string" || !instance.accessory_id) {
    errors.push(`${prefix}: accessory_id is required`);
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

  // price — user-input, required, finite number >= 0
  if (
    typeof instance.price !== "number" ||
    !isFinite(instance.price) ||
    instance.price < 0
  ) {
    errors.push(`${prefix}: price must be a number >= 0`);
  }

  // custom fields — optional; if present must be a string or null
  for (const field of [
    "accessory_custom_name",
    "accessory_custom_description",
    "accessory_custom_effect",
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
 * checks above, same split armor/materials would need.
 */
function validateAccessoryEnchantments(
  accessoryInventory,
  enchantmentsDb,
  targetsDb,
) {
  const errors = [];

  accessoryInventory.forEach((instance, index) => {
    const prefix = `accessoryInventory[${index}]`;
    const entries = instance.enchantments || [];

    entries.forEach((entry, entryIndex) => {
      errors.push(
        ...validateEnchantmentEntryApplication(
          entry,
          enchantmentsDb,
          targetsDb,
          ACCESSORY_ITEM_CATEGORY,
          entryIndex,
          prefix,
        ),
      );
    });
  });

  return errors;
}

/**
 * Ensures the number of equipped instances per accessory_id never exceeds
 * that accessory's accessory_equip_limit.
 *
 * Unlike armor's single-slot check, multiple *different* accessory types can
 * be equipped simultaneously — the cap is a per-type count, not a shared slot.
 *
 * Returns an array of error strings (empty = valid).
 */
function validateAccessoryEquipLimits(instances, db) {
  const errors = [];

  const equippedCountById = {};

  for (const instance of instances) {
    if (!instance.is_equipped) {
      continue;
    }

    const accessory = db[instance.accessory_id];

    // Unknown ids are validated elsewhere
    if (!accessory) {
      continue;
    }

    equippedCountById[instance.accessory_id] =
      (equippedCountById[instance.accessory_id] || 0) + 1;
  }

  for (const [accessoryId, count] of Object.entries(equippedCountById)) {
    const accessory = db[accessoryId];
    const limit = Number(accessory.accessory_equip_limit);

    if (count > limit) {
      errors.push(
        `Accessory "${accessory.accessory_name}" (${accessoryId}): ` +
          `${count} equipped exceeds limit of ${limit}`,
      );
    }
  }

  return errors;
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  validateAccessoryInstance,
  validateAccessoryEquipLimits,
  validateAccessoryEnchantments,
  ACCESSORY_ITEM_CATEGORY,
};
