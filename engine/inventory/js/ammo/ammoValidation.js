const {
  VALID_CONTAINER_STORED_AT,
  VALID_LOOSE_STORED_AT,
} = require("./ammoConstants");

// ─────────────────────────────────────────────────────────────────────────────
// CONTAINER INSTANCE VALIDATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validates a single container instance object (shape only, no DB lookups).
 * Returns an array of error strings (empty = valid).
 */
function validateContainerInstance(instance, index) {
  const errors = [];
  const prefix = `ammoContainerInventory[${index}]`;

  if (!instance || typeof instance !== "object") {
    return [`${prefix}: must be an object`];
  }

  if (typeof instance.container_id !== "string" || !instance.container_id) {
    errors.push(`${prefix}: container_id is required`);
  }

  if (
    typeof instance._instanceId !== "string" ||
    !instance._instanceId
  ) {
    errors.push(`${prefix}: _instanceId is required`);
  }

  if (!VALID_CONTAINER_STORED_AT.includes(instance.storedAt)) {
    errors.push(
      `${prefix}: storedAt must be one of [${VALID_CONTAINER_STORED_AT.join(", ")}]`,
    );
  }

  if (!Array.isArray(instance.contents)) {
    errors.push(`${prefix}: contents must be an array`);
  } else {
    instance.contents.forEach((entry, i) => {
      const ep = `${prefix}.contents[${i}]`;

      if (!entry || typeof entry !== "object") {
        errors.push(`${ep}: must be an object`);
        return;
      }

      if (typeof entry.ammo_id !== "string" || !entry.ammo_id) {
        errors.push(`${ep}: ammo_id is required`);
      }

      if (
        typeof entry.quantity !== "number" ||
        !Number.isInteger(entry.quantity) ||
        entry.quantity <= 0
      ) {
        errors.push(`${ep}: quantity must be a positive integer`);
      }
    });
  }

  return errors;
}

// ─────────────────────────────────────────────────────────────────────────────
// LOOSE AMMO INSTANCE VALIDATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validates a single loose ammo instance object (shape only, no DB lookups).
 * Returns an array of error strings (empty = valid).
 */
function validateLooseAmmoInstance(instance, index) {
  const errors = [];
  const prefix = `looseAmmoInventory[${index}]`;

  if (!instance || typeof instance !== "object") {
    return [`${prefix}: must be an object`];
  }

  if (typeof instance.ammo_id !== "string" || !instance.ammo_id) {
    errors.push(`${prefix}: ammo_id is required`);
  }

  if (
    typeof instance.quantity !== "number" ||
    !Number.isInteger(instance.quantity) ||
    instance.quantity <= 0
  ) {
    errors.push(`${prefix}: quantity must be a positive integer`);
  }

  if (!VALID_LOOSE_STORED_AT.includes(instance.storedAt)) {
    errors.push(
      `${prefix}: storedAt must be one of [${VALID_LOOSE_STORED_AT.join(", ")}]`,
    );
  }

  return errors;
}

// ─────────────────────────────────────────────────────────────────────────────
// CROSS-INSTANCE RULES VALIDATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validates cross-instance rules against the container DB:
 *
 * - is_carriable must be true for equipped/backpack
 * - max 1 instance per container_id at equipped
 * - max 1 instance per container_id at backpack
 * - ammo types in contents must match container_ammo_type
 *
 * Returns an array of error strings (empty = valid).
 */
function validateContainerCrossRules(ammoContainerInventory, containerDb, ammoDb) {
  const errors = [];

  // Tally equipped and backpack counts per container_id
  const equippedCount = {};
  const backpackCount = {};

  for (const [index, instance] of ammoContainerInventory.entries()) {
    const prefix = `ammoContainerInventory[${index}]`;
    const container = containerDb[instance.container_id];

    // Unknown container_id — skip further checks for this instance
    if (!container) continue;

    const { storedAt, container_id } = instance;

    // is_carriable rule
    if (
      (storedAt === "equipped" || storedAt === "backpack") &&
      !container.is_carriable
    ) {
      errors.push(
        `${prefix}: container_id "${container_id}" is not carriable and cannot be stored at "${storedAt}"`,
      );
    }

    // Tally for uniqueness check
    if (storedAt === "equipped") {
      equippedCount[container_id] = (equippedCount[container_id] || 0) + 1;
    }

    if (storedAt === "backpack") {
      backpackCount[container_id] = (backpackCount[container_id] || 0) + 1;
    }

    // Ammo type compatibility
    if (Array.isArray(instance.contents)) {
      instance.contents.forEach((entry, i) => {
        const ep = `${prefix}.contents[${i}]`;
        const ammo = ammoDb[entry.ammo_id];

        if (!ammo) return; // unknown ammo_id is caught elsewhere

        if (ammo.ammo_type !== container.container_ammo_type) {
          errors.push(
            `${ep}: ammo_id "${entry.ammo_id}" has type "${ammo.ammo_type}" but container "${container_id}" only accepts "${container.container_ammo_type}"`,
          );
        }
      });
    }
  }

  // Uniqueness checks
  for (const [container_id, count] of Object.entries(equippedCount)) {
    if (count > 1) {
      errors.push(
        `ammoContainerInventory: container_id "${container_id}" appears ${count} times at "equipped" — max 1 allowed`,
      );
    }
  }

  for (const [container_id, count] of Object.entries(backpackCount)) {
    if (count > 1) {
      errors.push(
        `ammoContainerInventory: container_id "${container_id}" appears ${count} times at "backpack" — max 1 allowed`,
      );
    }
  }

  return errors;
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  validateContainerInstance,
  validateLooseAmmoInstance,
  validateContainerCrossRules,
};
