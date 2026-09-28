const {
  VALID_STORED_AT,
  FIREARMS_ITEM_CATEGORY,
} = require("./firearmsConstants");

const {
  validateEnchantmentEntryApplication,
} = require("../shared/enchantmentsValidation.js");
const {
  validateEquippableInstance,
} = require("../shared/equippableValidation.js");

function validateFirearmInstance(instance, index) {
  return validateEquippableInstance(instance, index, {
    idField: "weapon_id",
    prefix: `firearmsInventory[${index}]`,
    validStoredAt: VALID_STORED_AT,
  });
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
