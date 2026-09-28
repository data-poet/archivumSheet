const { VALID_STORED_AT } = require("./armorConstants");

const {
  validateEnchantmentEntryApplication,
} = require("../shared/enchantmentsValidation.js");
const {
  validateEquippableInstance,
} = require("../shared/equippableValidation.js");

function validateArmorInstance(instance, index) {
  return validateEquippableInstance(instance, index, {
    idField: "armor_id",
    prefix: `armorInventory[${index}]`,
    validStoredAt: VALID_STORED_AT,
  });
}

// Unlike accessories' single fixed category, armor's itemCategory is per-instance (each piece's own armor_piece_location) — a helmet enchantment isn't necessarily allowed on boots.
function validateArmorEnchantments(
  armorInventory,
  armorDb,
  enchantmentsDb,
  targetsDb,
) {
  const errors = [];

  armorInventory.forEach((instance, index) => {
    const armor = armorDb[instance.armor_id];
    if (!armor) return;

    const prefix = `armorInventory[${index}]`;
    const entries = instance.enchantments || [];
    const itemCategory = armor.armor_piece_location;

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

function validateSingleEquippedPerSlot(instances, db) {
  const errors = [];

  const equippedPerSlot = {};

  for (const instance of instances) {
    if (!instance.is_equipped) {
      continue;
    }

    const armor = db[instance.armor_id];

    if (!armor) {
      continue;
    }

    const slot = armor.armor_piece_location;

    if (equippedPerSlot[slot]) {
      errors.push(
        `Slot "${slot}": only one armor piece can be equipped at a time ` +
          `(conflict: ${equippedPerSlot[slot]} and ${instance.armor_id})`,
      );

      continue;
    }

    equippedPerSlot[slot] = instance.armor_id;
  }

  return errors;
}

module.exports = {
  validateArmorInstance,
  validateSingleEquippedPerSlot,
  validateArmorEnchantments,
};
