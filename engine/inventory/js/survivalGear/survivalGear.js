const path = require("path");

const { loadCSV } = require("../../../../helpers/dataUtils.js");

const { VALID_STORED_AT } = require("./survivalGearConstants.js");

const { validateSurvivalGearInstance } = require("./survivalGearValidation.js");

const {
  resolveSurvivalGearItem,
  calculateCarriedSurvivalGearWeight,
} = require("./survivalGearResolver.js");

// ─────────────────────────────────────────────────────────────────────────────
// SURVIVAL GEAR DB
// ─────────────────────────────────────────────────────────────────────────────

let _survivalGearDB = null;

function getSurvivalGearDB() {
  if (_survivalGearDB) return _survivalGearDB;

  const filePath = path.join(
    process.cwd(),
    "data",
    "db_itens_adventure_gear.csv",
  );

  const rows = loadCSV(filePath);

  _survivalGearDB = {};

  for (const row of rows) {
    _survivalGearDB[row.adventure_gear_id] = {
      adventure_gear_id: row.adventure_gear_id,
      adventure_gear_name: row.adventure_gear_name,
      adventure_gear_type: row.adventure_gear_type,
      adventure_gear_price: Number(row.adventure_gear_price),
      adventure_gear_weight: Number(row.adventure_gear_weight),
      adventure_gear_observation: row.adventure_gear_observation || null,
    };
  }

  return _survivalGearDB;
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
 * Builds the resolved survival gear inventory, distributed across storage locations.
 *
 * Only backpack items contribute to carried weight.
 */
function buildSurvivalGearSlots(survivalGearInventory = []) {
  const survivalGearDb = getSurvivalGearDB();

  // ── VALIDATE INSTANCES (shape) ────────────────────────────────────────────

  const instanceErrors = survivalGearInventory.flatMap((instance, index) =>
    validateSurvivalGearInstance(instance, index),
  );

  if (instanceErrors.length > 0) {
    throw new Error(
      `[buildSurvivalGearSlots] Invalid survivalGearInventory:\n${instanceErrors.join("\n")}`,
    );
  }

  // ── VALIDATE UNKNOWN IDS ──────────────────────────────────────────────────

  const unknownIds = survivalGearInventory
    .filter((instance) => !survivalGearDb[instance.adventure_gear_id])
    .map((instance) => instance.adventure_gear_id);

  if (unknownIds.length > 0) {
    throw new Error(
      `[buildSurvivalGearSlots] Unknown adventure_gear_id(s): ${unknownIds.join(", ")}`,
    );
  }

  // ── BUILD BUCKETS ─────────────────────────────────────────────────────────

  const stash = buildStorageBucket();
  const camp = buildStorageBucket();
  const backpack = buildStorageBucket();

  for (const instance of survivalGearInventory) {
    const gear = survivalGearDb[instance.adventure_gear_id];
    const resolved = resolveSurvivalGearItem(instance, gear);

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

  const carried_survival_gear_weight =
    calculateCarriedSurvivalGearWeight(backpack);

  return {
    stash,
    camp,
    backpack,
    carried_survival_gear_weight,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  buildSurvivalGearSlots,
  VALID_STORED_AT,
  _getSurvivalGearDB: getSurvivalGearDB,
};
