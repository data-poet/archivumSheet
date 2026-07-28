const { VALID_STORED_AT } = require("./accessoriesConstants");

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validates a single accessory instance object (shape only, no DB lookups).
 * Returns an array of error strings (empty = valid).
 */
function validateAccessoryInstance(instance, index) {
  const errors = [];
  const prefix = `accessoryInventory[${index}]`;

  if (!instance || typeof instance !== "object") {
    return [`${prefix}: must be an object`];
  }

  if (typeof instance.accessory_id !== "string" || !instance.accessory_id) {
    errors.push(`${prefix}: accessory_id is required`);
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

  // price — user-input, required, finite number >= 0
  if (
    typeof instance.price !== "number" ||
    !isFinite(instance.price) ||
    instance.price < 0
  ) {
    errors.push(`${prefix}: price must be a number >= 0`);
  }

  // custom fields — optional; if present must be a string or null
  for (const field of [
    "accessory_custom_name",
    "accessory_custom_description",
    "accessory_custom_effect",
  ]) {
    if (
      instance[field] !== null &&
      instance[field] !== undefined &&
      typeof instance[field] !== "string"
    ) {
      errors.push(`${prefix}: ${field} must be a string or null`);
    }
  }

  return errors;
}

/**
 * Ensures the number of equipped instances per accessory_id never exceeds
 * that accessory's accessory_equip_limit.
 *
 * Unlike armor's single-slot check, multiple *different* accessory types can
 * be equipped simultaneously — the cap is a per-type count, not a shared slot.
 *
 * Returns an array of error strings (empty = valid).
 */
function validateAccessoryEquipLimits(instances, db) {
  const errors = [];

  const equippedCountById = {};

  for (const instance of instances) {
    if (!instance.is_equipped) {
      continue;
    }

    const accessory = db[instance.accessory_id];

    // Unknown ids are validated elsewhere
    if (!accessory) {
      continue;
    }

    equippedCountById[instance.accessory_id] =
      (equippedCountById[instance.accessory_id] || 0) + 1;
  }

  for (const [accessoryId, count] of Object.entries(equippedCountById)) {
    const accessory = db[accessoryId];
    const limit = Number(accessory.accessory_equip_limit);

    if (count > limit) {
      errors.push(
        `Accessory "${accessory.accessory_name}" (${accessoryId}): ` +
          `${count} equipped exceeds limit of ${limit}`,
      );
    }
  }

  return errors;
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  validateAccessoryInstance,
  validateAccessoryEquipLimits,
};
