const { VALID_STORED_AT, MELEE_ITEM_CATEGORY } = require("./meleeConstants");
const { RANGED_ITEM_CATEGORY } = require("../ranged/rangedConstants");
const {
  isMeleeDualUse,
  resolveDualUseEnchantmentCategory,
} = require("../shared/dualUseWeapons.js");

const {
  validateEnchantmentEntryApplication,
} = require("../shared/enchantmentsValidation.js");
const {
  validateEquippableInstance,
} = require("../shared/equippableValidation.js");

function validateMeleeInstance(instance, index) {
  return validateEquippableInstance(instance, index, {
    idField: "weapon_id",
    prefix: `meleeInventory[${index}]`,
    validStoredAt: VALID_STORED_AT,
  });
}

// A dual-use weapon accepts both categories: an entry added on the ranged side is mirrored here.
function validateMeleeEnchantments(meleeInventory, enchantmentsDb, targetsDb) {
  const errors = [];

  meleeInventory.forEach((instance, index) => {
    const prefix = `meleeInventory[${index}]`;
    const entries = instance.enchantments || [];

    const itemCategory = resolveDualUseEnchantmentCategory(
      instance.weapon_id,
      MELEE_ITEM_CATEGORY,
      RANGED_ITEM_CATEGORY,
      isMeleeDualUse,
    );

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

module.exports = {
  validateMeleeInstance,
  validateMeleeEnchantments,
};
