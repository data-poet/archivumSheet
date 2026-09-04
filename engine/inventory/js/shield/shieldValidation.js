const { VALID_STORED_AT } = require("./shieldConstants");

const {
  validateEnchantmentEntryShape,
  validateEnchantmentEntryApplication,
} = require("../shared/enchantmentsValidation.js");

// Shields have no slot system, so this is one fixed constant rather than a per-instance lookup like armor's armor_piece_location.
const SHIELD_ITEM_CATEGORY = "Escudos";

function validateShieldInstance(instance, index) {
  const errors = [];
  const prefix = `shieldInventory[${index}]`;

  if (!instance || typeof instance !== "object") {
    return [`${prefix}: must be an object`];
  }

  if (typeof instance.shield_id !== "string" || !instance.shield_id) {
    errors.push(`${prefix}: shield_id is required`);
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

function validateShieldEnchantments(
  shieldInventory,
  enchantmentsDb,
  targetsDb,
) {
  const errors = [];

  shieldInventory.forEach((instance, index) => {
    const prefix = `shieldInventory[${index}]`;
    const entries = instance.enchantments || [];

    entries.forEach((entry, entryIndex) => {
      errors.push(
        ...validateEnchantmentEntryApplication(
          entry,
          enchantmentsDb,
          targetsDb,
          SHIELD_ITEM_CATEGORY,
          entryIndex,
          prefix,
        ),
      );
    });
  });

  return errors;
}

function validateSingleEquippedShield(instances) {
  const errors = [];
  const equipped = [];

  for (const instance of instances) {
    if (!instance.is_equipped) {
      continue;
    }

    equipped.push(instance.shield_id);
  }

  if (equipped.length > 1) {
    errors.push(
      `Only one shield can be equipped at a time (conflict: ${equipped.join(", ")})`,
    );
  }

  return errors;
}

module.exports = {
  validateShieldInstance,
  validateSingleEquippedShield,
  validateShieldEnchantments,
  SHIELD_ITEM_CATEGORY,
};
