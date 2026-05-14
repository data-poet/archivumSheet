const { VALID_STORED_AT } = require("./armorConstants");

// Validation

/**
 * Validates a single armor instance object.
 * Returns an array of error strings (empty = valid).
 */
function validateArmorInstance(instance, index) {
  const errors = [];

  const prefix = `armorInventory[${index}]`;

  if (!instance || typeof instance !== "object") {
    return [`${prefix}: must be an object`];
  }

  if (typeof instance.armor_id !== "string" || !instance.armor_id) {
    errors.push(`${prefix}: armor_id is required`);
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

  return errors;
}

/**
 * Ensures at most one item per slot is equipped.
 * Returns an array of error strings (empty = valid).
 */
function validateSingleEquippedPerSlot(instances, db) {
  const errors = [];

  const equippedPerSlot = {};

  for (const instance of instances) {
    if (!instance.is_equipped) {
      continue;
    }

    const armor = db[instance.armor_id];

    // Unknown ids are validated elsewhere
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

// Exports

module.exports = {
  validateArmorInstance,
  validateSingleEquippedPerSlot,
};
