const { VALID_STORED_AT, RANGED_ITEM_CATEGORY } = require("./rangedConstants");
const { MELEE_ITEM_CATEGORY } = require("../melee/meleeConstants");
const {
  isRangedDualUse,
  resolveDualUseEnchantmentCategory,
} = require("../shared/dualUseWeapons.js");

const {
  validateEnchantmentEntryShape,
  validateEnchantmentEntryApplication,
} = require("../shared/enchantmentsValidation.js");

function validateRangedInstance(instance, index) {
  const errors = [];
  const prefix = `rangedInventory[${index}]`;

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
