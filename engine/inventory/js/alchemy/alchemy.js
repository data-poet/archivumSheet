const path = require("path");

const { loadCSV } = require("../../../../helpers/dataUtils.js");

const { VALID_STORED_AT } = require("./alchemyConstants.js");

const { validateAlchemyInstance } = require("./alchemyValidation.js");

const {
  resolveAlchemyConsumable,
  calculateCarriedAlchemyWeight,
  calculateCarriedAlchemyValue,
} = require("./alchemyResolver.js");

// ─────────────────────────────────────────────────────────────────────────────
// ALCHEMY DB
// ─────────────────────────────────────────────────────────────────────────────

let _alchemyDB = null;

function getAlchemyDB() {
  if (_alchemyDB) return _alchemyDB;

  const filePath = path.join(
    process.cwd(),
    "data",
    "db_alchemy_consumables.csv",
  );

  const rows = loadCSV(filePath);

  _alchemyDB = {};

  for (const row of rows) {
    _alchemyDB[row.consumable_id] = {
      consumable_id: row.consumable_id,
      consumable_name: row.consumable_name,
      consumable_box_name: row.consumable_box_name,
      consumable_tier: row.consumable_tier,
      consumable_type: row.consumable_type,
      consumable_category: row.consumable_category,
      consumable_ingredients: row.consumable_ingredients || null,
      consumable_duration: row.consumable_duration || null,
      consumable_effect: row.consumable_effect || null,
      consumable_toxicity: row.consumable_toxicity
        ? Number(row.consumable_toxicity)
        : null,
      consumable_price: Number(row.consumable_price),
      consumable_weight: Number(row.consumable_weight),
      consumable_method: row.consumable_method || null,
      consumable_effect_area: row.consumable_effect_area || null,
    };
  }

  return _alchemyDB;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function buildStorageBucket() {
  return [];
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Builds the resolved alchemy inventory, distributed across storage locations.
 *
 * Only backpack consumables contribute to carried weight.
 */
function buildAlchemySlots(alchemyInventory = []) {
  const alchemyDb = getAlchemyDB();

  // ── VALIDATE INSTANCES (shape) ────────────────────────────────────────────

  const instanceErrors = alchemyInventory.flatMap((instance, index) =>
    validateAlchemyInstance(instance, index),
  );

  if (instanceErrors.length > 0) {
    throw new Error(
      `[buildAlchemySlots] Invalid alchemyInventory:\n${instanceErrors.join("\n")}`,
    );
  }

  // ── VALIDATE UNKNOWN IDS ──────────────────────────────────────────────────

  const unknownIds = alchemyInventory
    .filter((instance) => !alchemyDb[instance.consumable_id])
    .map((instance) => instance.consumable_id);

  if (unknownIds.length > 0) {
    throw new Error(
      `[buildAlchemySlots] Unknown consumable_id(s): ${unknownIds.join(", ")}`,
    );
  }

  // ── BUILD BUCKETS ─────────────────────────────────────────────────────────

  const stash = buildStorageBucket();
  const camp = buildStorageBucket();
  const backpack = buildStorageBucket();

  for (const instance of alchemyInventory) {
    const consumable = alchemyDb[instance.consumable_id];
    const resolved = resolveAlchemyConsumable(instance, consumable);

    if (instance.storedAt === "stash") {
      stash.push(resolved);
      continue;
    }

    if (instance.storedAt === "camp") {
      camp.push(resolved);
      continue;
    }

    if (instance.storedAt === "backpack") {
      backpack.push(resolved);
    }
  }

  // ── TOTALS ────────────────────────────────────────────────────────────────

  const carried_alchemy_weight = calculateCarriedAlchemyWeight(backpack);
  const carried_alchemy_value = calculateCarriedAlchemyValue(backpack);

  return {
    stash,
    camp,
    backpack,
    carried_alchemy_weight,
    carried_alchemy_value,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  buildAlchemySlots,
  VALID_STORED_AT,
  _getAlchemyDB: getAlchemyDB,
};
