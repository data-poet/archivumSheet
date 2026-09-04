
function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

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

    storedAt: instance.storedAt,

    contents: resolvedContents,
    used_capacity,
    remaining_capacity: container.container_capacity - used_capacity,
    contents_weight,
    total_weight,
    total_value,
  };
}

function resolveLooseAmmo(instance, ammo) {
  const total_weight = round2(ammo.ammo_weight * instance.quantity);
  const total_value  = round2(ammo.ammo_price  * instance.quantity);

  return {
    ammo_id: ammo.ammo_id,
    ammo_name: ammo.ammo_name,
    ammo_type: ammo.ammo_type,
    ammo_category: ammo.ammo_category,
    ammo_weight: ammo.ammo_weight,
    ammo_price: ammo.ammo_price,
    ammo_effect: ammo.ammo_effect,
    ammo_description: ammo.ammo_description,

    quantity: instance.quantity,
    storedAt: instance.storedAt,
    total_weight,
    total_value,
  };
}

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

// Equipped/backpack containers + backpack loose ammo count toward carry; stash and camp are excluded.
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

module.exports = {
  resolveContainer,
  resolveLooseAmmo,
  calculateTotalEquippedAmmo,
  calculateCarriedAmmoWeight,
  calculateCarriedAmmoValue,
};
