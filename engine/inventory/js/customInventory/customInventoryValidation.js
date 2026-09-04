const { VALID_STORED_AT } = require("./customInventoryConstants");

function validateCustomInventoryInstance(instance, index) {
  const errors = [];
  const prefix = `customInventory[${index}]`;

  if (!instance || typeof instance !== "object") {
    return [`${prefix}: must be an object`];
  }

  if (
    typeof instance.custom_item_id !== "string" ||
    instance.custom_item_id.trim() === ""
  ) {
    errors.push(`${prefix}: custom_item_id must be a non-empty string`);
  }

  if (typeof instance.name !== "string" || instance.name.trim() === "") {
    errors.push(`${prefix}: name must be a non-empty string`);
  }

  if (
    typeof instance.weight !== "number" ||
    !isFinite(instance.weight) ||
    instance.weight < 0
  ) {
    errors.push(`${prefix}: weight must be a number >= 0`);
  }

  if (
    typeof instance.price !== "number" ||
    !isFinite(instance.price) ||
    instance.price < 0
  ) {
    errors.push(`${prefix}: price must be a number >= 0`);
  }

  if (
    typeof instance.quantity !== "number" ||
    !Number.isInteger(instance.quantity) ||
    instance.quantity <= 0
  ) {
    errors.push(`${prefix}: quantity must be a positive integer`);
  }

  if (
    instance.description !== null &&
    instance.description !== undefined &&
    typeof instance.description !== "string"
  ) {
    errors.push(`${prefix}: description must be a string or null`);
  }

  if (!VALID_STORED_AT.includes(instance.storedAt)) {
    errors.push(
      `${prefix}: storedAt must be one of [${VALID_STORED_AT.join(", ")}]`,
    );
  }

  return errors;
}

module.exports = {
  validateCustomInventoryInstance,
};
