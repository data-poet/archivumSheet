const {
  VALID_CONTAINER_STORED_AT,
  VALID_LOOSE_STORED_AT,
} = require("./ammoConstants");

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

function validateContainerCrossRules(ammoContainerInventory, containerDb, ammoDb) {
  const errors = [];

  const equippedCount = {};
  const backpackCount = {};

  for (const [index, instance] of ammoContainerInventory.entries()) {
    const prefix = `ammoContainerInventory[${index}]`;
    const container = containerDb[instance.container_id];

    if (!container) continue;

    const { storedAt, container_id } = instance;

    if (
      (storedAt === "equipped" || storedAt === "backpack") &&
      !container.is_carriable
    ) {
      errors.push(
        `${prefix}: container_id "${container_id}" is not carriable and cannot be stored at "${storedAt}"`,
      );
    }

    if (storedAt === "equipped") {
      equippedCount[container_id] = (equippedCount[container_id] || 0) + 1;
    }

    if (storedAt === "backpack") {
      backpackCount[container_id] = (backpackCount[container_id] || 0) + 1;
    }

    if (Array.isArray(instance.contents)) {
      instance.contents.forEach((entry, i) => {
        const ep = `${prefix}.contents[${i}]`;
        const ammo = ammoDb[entry.ammo_id];

        if (!ammo) return;

        if (ammo.ammo_type !== container.container_ammo_type) {
          errors.push(
            `${ep}: ammo_id "${entry.ammo_id}" has type "${ammo.ammo_type}" but container "${container_id}" only accepts "${container.container_ammo_type}"`,
          );
        }
      });
    }
  }

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

module.exports = {
  validateContainerInstance,
  validateLooseAmmoInstance,
  validateContainerCrossRules,
};
