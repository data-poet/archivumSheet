const {
  VALID_STORED_AT,
  MAGIC_GEAR_EQUIP_LIMITS,
} = require("./magicGearConstants");

const {
  validateEnchantmentEntryShape,
  validateEnchantmentEntryApplication,
} = require("../shared/enchantmentsValidation.js");

const MAGIC_GEAR_ITEM_CATEGORY = "Instrumentos Mágicos";

// Unlike accessories, price/weight are not user-input here — they come entirely from the DB catalog row, so no price field is validated on the instance.
function validateMagicGearInstance(instance, index) {
  const errors = [];
  const prefix = `magicGearInventory[${index}]`;

  if (!instance || typeof instance !== "object") {
    return [`${prefix}: must be an object`];
  }

  if (typeof instance.magic_gear_id !== "string" || !instance.magic_gear_id) {
    errors.push(`${prefix}: magic_gear_id is required`);
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

  for (const field of [
    "magic_gear_custom_name",
    "magic_gear_custom_description",
    "magic_gear_custom_effect",
  ]) {
    if (
      instance[field] !== null &&
      instance[field] !== undefined &&
      typeof instance[field] !== "string"
    ) {
      errors.push(`${prefix}: ${field} must be a string or null`);
    }
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

function validateMagicGearEnchantments(
  magicGearInventory,
  enchantmentsDb,
  targetsDb,
) {
  const errors = [];

  magicGearInventory.forEach((instance, index) => {
    const prefix = `magicGearInventory[${index}]`;
    const entries = instance.enchantments || [];

    entries.forEach((entry, entryIndex) => {
      errors.push(
        ...validateEnchantmentEntryApplication(
          entry,
          enchantmentsDb,
          targetsDb,
          MAGIC_GEAR_ITEM_CATEGORY,
          entryIndex,
          prefix,
        ),
      );
    });
  });

  return errors;
}

// Unlike accessories' per-accessory_id limit, this is scoped to TYPE (Arcano, Musical, ...), shared across every magic_gear_id of that type.
function validateMagicGearEquipLimits(instances, magicGearDb) {
  const equippedCountByType = {};

  instances
    .filter((instance) => instance.is_equipped)
    .forEach((instance) => {
      const type = magicGearDb[instance.magic_gear_id]?.magic_gear_type;
      if (!type) return;
      equippedCountByType[type] = (equippedCountByType[type] || 0) + 1;
    });

  const errors = [];

  Object.entries(equippedCountByType).forEach(([type, count]) => {
    const limit = MAGIC_GEAR_EQUIP_LIMITS[type];
    if (limit != null && count > limit) {
      errors.push(
        `${count} "${type}" magic gear items equipped exceeds the limit of ${limit}`,
      );
    }
  });

  return errors;
}

module.exports = {
  validateMagicGearInstance,
  validateMagicGearEquipLimits,
  validateMagicGearEnchantments,
  MAGIC_GEAR_ITEM_CATEGORY,
};
