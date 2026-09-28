const { VALID_STORED_AT } = require("./shieldConstants");

const {
  validateEnchantmentEntryApplication,
} = require("../shared/enchantmentsValidation.js");
const {
  validateEquippableInstance,
} = require("../shared/equippableValidation.js");

// Shields have no slot system, so this is one fixed constant rather than a per-instance lookup like armor's armor_piece_location.
const SHIELD_ITEM_CATEGORY = "Escudos";

function validateShieldInstance(instance, index) {
  return validateEquippableInstance(instance, index, {
    idField: "shield_id",
    prefix: `shieldInventory[${index}]`,
    validStoredAt: VALID_STORED_AT,
  });
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
