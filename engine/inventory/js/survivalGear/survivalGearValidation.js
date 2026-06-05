const { VALID_STORED_AT } = require("./survivalGearConstants");

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validates a single survival gear instance object (shape only, no DB lookups).
 * Returns an array of error strings (empty = valid).
 */
function validateSurvivalGearInstance(instance, index) {
  const errors = [];
  const prefix = `survivalGearInventory[${index}]`;

  if (!instance || typeof instance !== "object") {
    return [`${prefix}: must be an object`];
  }

  if (
    typeof instance.adventure_gear_id !== "string" ||
    !instance.adventure_gear_id
  ) {
    errors.push(`${prefix}: adventure_gear_id is required`);
  }

  if (
    typeof instance.quantity !== "number" ||
    !Number.isInteger(instance.quantity) ||
    instance.quantity <= 0
  ) {
    errors.push(`${prefix}: quantity must be a positive integer`);
  }

  if (!VALID_STORED_AT.includes(instance.storedAt)) {
    errors.push(
      `${prefix}: storedAt must be one of [${VALID_STORED_AT.join(", ")}]`,
    );
  }

  return errors;
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  validateSurvivalGearInstance,
};
