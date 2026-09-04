const {
  VALID_STORED_AT,
  FIREARMS_ITEM_CATEGORY,
} = require("./firearmsConstants");

const {
  validateEnchantmentEntryShape,
  validateEnchantmentEntryApplication,
} = require("../shared/enchantmentsValidation.js");

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

// Firearms aren't part of any dual-use pairing, so itemCategory is a fixed constant — no union-category resolution needed here (unlike melee/ranged).
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

module.exports = {
  validateFirearmInstance,
  validateFirearmEnchantments,
};
