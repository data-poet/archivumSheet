const { VALID_STORED_AT, MELEE_ITEM_CATEGORY } = require("./meleeConstants");
const { RANGED_ITEM_CATEGORY } = require("../ranged/rangedConstants");
const {
  isMeleeDualUse,
  resolveDualUseEnchantmentCategory,
} = require("../shared/dualUseWeapons.js");

const {
  validateEnchantmentEntryShape,
  validateEnchantmentEntryApplication,
} = require("../shared/enchantmentsValidation.js");

function validateMeleeInstance(instance, index) {
  const errors = [];
  const prefix = `meleeInventory[${index}]`;

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

// For a dual-use weapon, itemCategory is [MELEE_ITEM_CATEGORY, RANGED_ITEM_CATEGORY] — an entry added via the ranged side (e.g. PREC) ends up on this melee mirror too, so validating against melee's category alone would wrongly reject it.
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
