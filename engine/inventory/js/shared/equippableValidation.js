const {
  validateEnchantmentEntryShape,
} = require("./enchantmentsValidation.js");

// Shared shape for any equip/storedAt/enchantments item instance (armor, melee, ranged,
// firearms, shield): equipped items have no storedAt, unequipped ones must have a valid one.
function validateEquippableInstance(
  instance,
  index,
  { idField, prefix, validStoredAt },
) {
  const errors = [];

  if (!instance || typeof instance !== "object") {
    return [`${prefix}: must be an object`];
  }

  if (typeof instance[idField] !== "string" || !instance[idField]) {
    errors.push(`${prefix}: ${idField} is required`);
  }

  if (typeof instance.is_equipped !== "boolean") {
    errors.push(`${prefix}: is_equipped must be a boolean`);
  }

  if (instance.is_equipped === true && instance.storedAt !== null) {
    errors.push(`${prefix}: storedAt must be null when is_equipped is true`);
  }

  if (
    instance.is_equipped === false &&
    !validStoredAt.includes(instance.storedAt)
  ) {
    errors.push(
      `${prefix}: storedAt must be one of [${validStoredAt.join(", ")}] when not equipped`,
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

module.exports = {
  validateEquippableInstance,
};
