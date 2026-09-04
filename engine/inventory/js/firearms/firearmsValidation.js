const {
  VALID_STORED_AT,
  FIREARMS_ITEM_CATEGORY,
} = require("./firearmsConstants");

const {
  validateEnchantmentEntryShape,
  validateEnchantmentEntryApplication,
} = require("../shared/enchantmentsValidation.js");

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validates a single firearm instance object.
 * Returns an array of error strings (empty = valid).
 */
function validateFirearmInstance(instance, index) {
  const errors = [];
  const prefix = `firearmsInventory[${index}]`;

  if (!instance || typeof instance !== "object") {
    return [`${prefix}: must be an object`];
  }

  if (typeof instance.weapon_id !== "string" || !instance.weapon_id) {
    errors.push(`${prefix}: weapon_id is required`);
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

  // enchantments — optional; unlimited count, no slot system (same
  // shape-only pass as melee/ranged/shield/accessories/magicGear/armor —
  // see meleeValidation.js)
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
 * checks above, same split melee/ranged/shield/accessories/magicGear/armor
 * use.
 *
 * itemCategory is the fixed FIREARMS_ITEM_CATEGORY constant — firearms
 * aren't part of any dual-use pairing, so no union-category resolution is
 * needed here (unlike melee/ranged — see meleeValidation.js/
 * rangedValidation.js).
 */
function validateFirearmEnchantments(
  firearmsInventory,
  enchantmentsDb,
  targetsDb,
) {
  const errors = [];

  firearmsInventory.forEach((instance, index) => {
    const prefix = `firearmsInventory[${index}]`;
    const entries = instance.enchantments || [];

    entries.forEach((entry, entryIndex) => {
      errors.push(
        ...validateEnchantmentEntryApplication(
          entry,
          enchantmentsDb,
          targetsDb,
          FIREARMS_ITEM_CATEGORY,
          entryIndex,
          prefix,
        ),
      );
    });
  });

  return errors;
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  validateFirearmInstance,
  validateFirearmEnchantments,
};
