const { VALID_STORED_AT } = require("./shieldConstants");

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validates a single shield instance object.
 * Returns an array of error strings (empty = valid).
 */
function validateShieldInstance(instance, index) {
  const errors = [];
  const prefix = `shieldInventory[${index}]`;

  if (!instance || typeof instance !== "object") {
    return [`${prefix}: must be an object`];
  }

  if (typeof instance.shield_id !== "string" || !instance.shield_id) {
    errors.push(`${prefix}: shield_id is required`);
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
 * Ensures at most one shield is equipped at a time.
 * Returns an array of error strings (empty = valid).
 */
function validateSingleEquippedShield(instances) {
  const errors = [];
  const equipped = [];

  for (const instance of instances) {
    if (!instance.is_equipped) {
      continue;
    }

    equipped.push(instance.shield_id);
  }

  if (equipped.length > 1) {
    errors.push(
      `Only one shield can be equipped at a time (conflict: ${equipped.join(", ")})`,
    );
  }

  return errors;
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  validateShieldInstance,
  validateSingleEquippedShield,
};
