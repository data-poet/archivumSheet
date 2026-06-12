const {
  VALID_COIN_TYPES,
  VALID_STORED_AT,
} = require("./coinPurseConstants");

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validates a single coin instance object (shape only).
 * Returns an array of error strings (empty = valid).
 */
function validateCoinInstance(instance, index) {
  const errors = [];
  const prefix = `coinInventory[${index}]`;

  if (!instance || typeof instance !== "object") {
    return [`${prefix}: must be an object`];
  }

  if (!VALID_COIN_TYPES.includes(instance.coin_type)) {
    errors.push(
      `${prefix}: coin_type must be one of [${VALID_COIN_TYPES.join(", ")}]`,
    );
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
  validateCoinInstance,
};
