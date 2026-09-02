const { VALID_STORED_AT } = require("./armorConstants");

const {
  validateEnchantmentEntryShape,
  validateEnchantmentEntryApplication,
} = require("../shared/enchantmentsValidation.js");

// Validation

/**
 * Validates a single armor instance object.
 * Returns an array of error strings (empty = valid).
 */
function validateArmorInstance(instance, index) {
  const errors = [];

  const prefix = `armorInventory[${index}]`;

  if (!instance || typeof instance !== "object") {
    return [`${prefix}: must be an object`];
  }

  if (typeof instance.armor_id !== "string" || !instance.armor_id) {
    errors.push(`${prefix}: armor_id is required`);
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
  // shape-only pass as accessories/magicGear — see accessoriesValidation.js)
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
 * checks above, same split accessories/magicGear use.
 *
 * Unlike accessories' single fixed ACCESSORY_ITEM_CATEGORY, armor's
 * itemCategory is per-instance: each piece's own armor_piece_location
 * (the raw Portuguese SLOT_MAP key, e.g. "Cabeça") — a helmet enchantment
 * isn't necessarily allowed on boots. Instances with an unknown armor_id
 * are skipped here; that's caught separately in armor.js.
 */
function validateArmorEnchantments(
  armorInventory,
  armorDb,
  enchantmentsDb,
  targetsDb,
) {
  const errors = [];

  armorInventory.forEach((instance, index) => {
    const armor = armorDb[instance.armor_id];
    if (!armor) return;

    const prefix = `armorInventory[${index}]`;
    const entries = instance.enchantments || [];
    const itemCategory = armor.armor_piece_location;

    entries.forEach((entry, entryIndex) => {
      errors.push(
        ...validateEnchantmentEntryApplication(
          entry,
          enchantmentsDb,
          targetsDb,
          itemCategory,
          entryIndex,
          prefix,
        ),
      );
    });
  });

  return errors;
}

/**
 * Ensures at most one item per slot is equipped.
 * Returns an array of error strings (empty = valid).
 */
function validateSingleEquippedPerSlot(instances, db) {
  const errors = [];

  const equippedPerSlot = {};

  for (const instance of instances) {
    if (!instance.is_equipped) {
      continue;
    }

    const armor = db[instance.armor_id];

    // Unknown ids are validated elsewhere
    if (!armor) {
      continue;
    }

    const slot = armor.armor_piece_location;

    if (equippedPerSlot[slot]) {
      errors.push(
        `Slot "${slot}": only one armor piece can be equipped at a time ` +
          `(conflict: ${equippedPerSlot[slot]} and ${instance.armor_id})`,
      );

      continue;
    }

    equippedPerSlot[slot] = instance.armor_id;
  }

  return errors;
}

// Exports

module.exports = {
  validateArmorInstance,
  validateSingleEquippedPerSlot,
  validateArmorEnchantments,
};
