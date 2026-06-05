const { VALID_STORED_AT } = require("./customInventoryConstants");

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validates a single custom inventory instance.
 * All data lives on the instance itself — there is no DB to look up.
 * Returns an array of error strings (empty = valid).
 */
function validateCustomInventoryInstance(instance, index) {
  const errors = [];
  const prefix = `customInventory[${index}]`;

  if (!instance || typeof instance !== "object") {
    return [`${prefix}: must be an object`];
  }

  // custom_item_id — client-generated, must be a non-empty string
  if (
    typeof instance.custom_item_id !== "string" ||
    instance.custom_item_id.trim() === ""
  ) {
    errors.push(`${prefix}: custom_item_id must be a non-empty string`);
  }

  // name — required, non-empty string
  if (typeof instance.name !== "string" || instance.name.trim() === "") {
    errors.push(`${prefix}: name must be a non-empty string`);
  }

  // weight — required, finite number >= 0
  if (
    typeof instance.weight !== "number" ||
    !isFinite(instance.weight) ||
    instance.weight < 0
  ) {
    errors.push(`${prefix}: weight must be a number >= 0`);
  }

  // price — required, finite number >= 0
  if (
    typeof instance.price !== "number" ||
    !isFinite(instance.price) ||
    instance.price < 0
  ) {
    errors.push(`${prefix}: price must be a number >= 0`);
  }

  // quantity — required, positive integer
  if (
    typeof instance.quantity !== "number" ||
    !Number.isInteger(instance.quantity) ||
    instance.quantity <= 0
  ) {
    errors.push(`${prefix}: quantity must be a positive integer`);
  }

  // description — optional; if present must be a string
  if (
    instance.description !== null &&
    instance.description !== undefined &&
    typeof instance.description !== "string"
  ) {
    errors.push(`${prefix}: description must be a string or null`);
  }

  // storedAt
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
  validateCustomInventoryInstance,
};
