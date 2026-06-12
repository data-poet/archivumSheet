// ─────────────────────────────────────────────────────────────────────────────
// AMMO RESOLVER
// ─────────────────────────────────────────────────────────────────────────────

function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTAINER RESOLVER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Merges a container DB record + instance state into a fully resolved container.
 */
function resolveContainer(instance, container, ammoDb) {
  const resolvedContents = instance.contents.map((entry) => {
    const ammo = ammoDb[entry.ammo_id];
    return {
      ammo_id: entry.ammo_id,
      quantity: entry.quantity,
      weight: round2(ammo.ammo_weight * entry.quantity),
    };
  });

  const used_capacity = resolvedContents.reduce(
    (sum, entry) => sum + entry.quantity,
    0,
  );

  const contents_weight = round2(
    resolvedContents.reduce((sum, entry) => sum + entry.weight, 0),
  );

  const total_weight = round2(container.container_weight + contents_weight);

  const contents_value = resolvedContents.reduce((sum, entry) => {
    const ammo = ammoDb[entry.ammo_id];
    return sum + round2((ammo?.ammo_price ?? 0) * entry.quantity);
  }, 0);

  const total_value = round2(container.container_price + contents_value);

  return {
    // CONTAINER BASE
    _instanceId: instance._instanceId,
    container_id: container.container_id,
    container_name: container.container_name,
    container_box_name: container.container_box_name,
    container_type: container.container_type,
    container_ammo_type: container.container_ammo_type,
    container_capacity: container.container_capacity,
    container_weight: container.container_weight,
    container_price: container.container_price,
    is_carriable: container.is_carriable,

    // RUNTIME
    storedAt: instance.storedAt,

    // CONTENTS
    contents: resolvedContents,
    used_capacity,
    remaining_capacity: container.container_capacity - used_capacity,
    contents_weight,
    total_weight,
    total_value,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// LOOSE AMMO RESOLVER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Merges an ammo DB record + loose instance state into a fully resolved loose entry.
 */
function resolveLooseAmmo(instance, ammo) {
  const total_weight = round2(ammo.ammo_weight * instance.quantity);
  const total_value  = round2(ammo.ammo_price  * instance.quantity);

  return {
    // AMMO BASE
    ammo_id: ammo.ammo_id,
    ammo_name: ammo.ammo_name,
    ammo_type: ammo.ammo_type,
    ammo_category: ammo.ammo_category,
    ammo_weight: ammo.ammo_weight,
    ammo_price: ammo.ammo_price,
    ammo_effect: ammo.ammo_effect,
    ammo_description: ammo.ammo_description,

    // RUNTIME
    quantity: instance.quantity,
    storedAt: instance.storedAt,
    total_weight,
    total_value,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// TOTAL EQUIPPED AMMO
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Aggregates total ammo quantities by ammo_type across all equipped containers.
 */
function calculateTotalEquippedAmmo(equippedContainers, ammoDb) {
  const totals = {};

  for (const container of equippedContainers) {
    for (const entry of container.contents) {
      const ammo = ammoDb[entry.ammo_id];
      if (!ammo) continue;

      const type = ammo.ammo_type;
      totals[type] = (totals[type] || 0) + entry.quantity;
    }
  }

  return totals;
}

// ─────────────────────────────────────────────────────────────────────────────
// CARRIED AMMO WEIGHT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sums the total weight that counts toward carry:
 * - equipped containers (container + contents)
 * - backpack containers (container + contents)
 * - backpack loose ammo
 *
 * Stash and camp are excluded.
 */
function calculateCarriedAmmoWeight(
  equippedContainers,
  backpackContainers,
  looseBackpack,
) {
  const containerWeight = [...equippedContainers, ...backpackContainers].reduce(
    (sum, c) => sum + c.total_weight,
    0,
  );

  const looseWeight = looseBackpack.reduce((sum, l) => sum + l.total_weight, 0);

  return (
    Math.round((containerWeight + looseWeight + Number.EPSILON) * 100) / 100
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CARRIED AMMO VALUE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sums the total value that counts toward carried inventory:
 * - equipped containers (container + contents)
 * - backpack containers (container + contents)
 * - backpack loose ammo
 *
 * Stash and camp are excluded — mirrors the weight convention.
 */
function calculateCarriedAmmoValue(
  equippedContainers,
  backpackContainers,
  looseBackpack,
) {
  const containerValue = [...equippedContainers, ...backpackContainers].reduce(
    (sum, c) => sum + c.total_value,
    0,
  );

  const looseValue = looseBackpack.reduce((sum, l) => sum + l.total_value, 0);

  return (
    Math.round((containerValue + looseValue + Number.EPSILON) * 100) / 100
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  resolveContainer,
  resolveLooseAmmo,
  calculateTotalEquippedAmmo,
  calculateCarriedAmmoWeight,
  calculateCarriedAmmoValue,
};
