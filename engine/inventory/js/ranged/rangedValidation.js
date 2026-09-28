const { VALID_STORED_AT, RANGED_ITEM_CATEGORY } = require("./rangedConstants");
const { MELEE_ITEM_CATEGORY } = require("../melee/meleeConstants");
const {
  isRangedDualUse,
  resolveDualUseEnchantmentCategory,
} = require("../shared/dualUseWeapons.js");

const {
  validateEnchantmentEntryApplication,
} = require("../shared/enchantmentsValidation.js");
const {
  validateEquippableInstance,
} = require("../shared/equippableValidation.js");

function validateRangedInstance(instance, index) {
  return validateEquippableInstance(instance, index, {
    idField: "weapon_id",
    prefix: `rangedInventory[${index}]`,
    validStoredAt: VALID_STORED_AT,
  });
}

// For a dual-use weapon, itemCategory is [RANGED_ITEM_CATEGORY, MELEE_ITEM_CATEGORY] — an entry added via the melee side (e.g. BAL) ends up on this ranged mirror too, so validating against ranged's category alone would wrongly reject it.
function validateRangedEnchantments(
  rangedInventory,
  enchantmentsDb,
  targetsDb,
) {
  const errors = [];

  rangedInventory.forEach((instance, index) => {
    const prefix = `rangedInventory[${index}]`;
    const entries = instance.enchantments || [];

    const itemCategory = resolveDualUseEnchantmentCategory(
      instance.weapon_id,
      RANGED_ITEM_CATEGORY,
      MELEE_ITEM_CATEGORY,
      isRangedDualUse,
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
  validateRangedInstance,
  validateRangedEnchantments,
};
