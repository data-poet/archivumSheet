// Shared validate -> unknown-id checks -> resolve -> bucket-by-storedAt -> sum-weight/value pipeline
// used by armor/shield/melee/ranged/firearms. Each category supplies its own DB, id key, resolver,
// instance validator, any extra validation steps (slot conflicts, enchantments), and equipped-slot
// shape (single object, array, or per-slot map) via `equippedContainer`.
function buildEquipmentSlots({
  label,
  entityLabel,
  inventory = [],
  idKey,
  db,
  materialDb,
  validateInstance,
  extraValidationSteps = [],
  resolveInstance,
  equippedContainer,
  storageBucket = {
    init: () => [],
    place: (bucket, resolved) => {
      bucket.push(resolved);
      return bucket;
    },
  },
  weightKey = "final_weight",
  valueKey = "total_value",
  fieldNames,
}) {
  const instanceErrors = inventory.flatMap((instance, index) =>
    validateInstance(instance, index),
  );

  if (instanceErrors.length > 0) {
    throw new Error(
      `[${label}] Invalid ${entityLabel} inventory:\n${instanceErrors.join("\n")}`,
    );
  }

  const unknownIds = inventory
    .filter((instance) => !db[instance[idKey]])
    .map((instance) => instance[idKey]);

  if (unknownIds.length > 0) {
    throw new Error(`[${label}] Unknown ${idKey}(s): ${unknownIds.join(", ")}`);
  }

  const unknownMaterialIds = inventory
    .filter(
      (instance) => instance.material_id && !materialDb[instance.material_id],
    )
    .map((instance) => instance.material_id);

  if (unknownMaterialIds.length > 0) {
    throw new Error(
      `[${label}] Unknown material_id(s): ${unknownMaterialIds.join(", ")}`,
    );
  }

  for (const step of extraValidationSteps) {
    const errors = step.validate();
    if (errors.length > 0) {
      throw new Error(`[${label}] ${step.message}:\n${errors.join("\n")}`);
    }
  }

  let equipped = equippedContainer.init();
  let stash = storageBucket.init();
  let camp = storageBucket.init();
  let backpack = storageBucket.init();

  let carriedWeight = 0;
  let carriedValue = 0;

  for (const instance of inventory) {
    const item = db[instance[idKey]];
    const material = instance.material_id
      ? materialDb[instance.material_id]
      : null;

    const resolved = resolveInstance(instance, item, material);

    if (instance.is_equipped) {
      equipped = equippedContainer.place(equipped, resolved, instance, item);

      carriedWeight += resolved[weightKey];
      carriedValue += resolved[valueKey];

      continue;
    }

    if (instance.storedAt === "stash") {
      stash = storageBucket.place(stash, resolved, instance, item);

      continue;
    }

    if (instance.storedAt === "camp") {
      camp = storageBucket.place(camp, resolved, instance, item);

      continue;
    }

    if (instance.storedAt === "backpack") {
      backpack = storageBucket.place(backpack, resolved, instance, item);

      carriedWeight += resolved[weightKey];
      carriedValue += resolved[valueKey];
    }
  }

  // totalWeight/totalValue duplicate carriedWeight/carriedValue exactly — no consumer reads the
  // total_* keys today, but they're a tested contract on every category's builder, so both stay.
  return {
    equipped,
    stash,
    camp,
    backpack,
    [fieldNames.totalWeight]: carriedWeight,
    [fieldNames.carriedWeight]: carriedWeight,
    [fieldNames.totalValue]: carriedValue,
    [fieldNames.carriedValue]: carriedValue,
  };
}

module.exports = {
  buildEquipmentSlots,
};
