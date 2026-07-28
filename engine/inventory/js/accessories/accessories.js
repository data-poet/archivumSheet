const path = require("path");

const { loadCSV } = require("../../../../helpers/dataUtils.js");

const { VALID_STORED_AT } = require("./accessoriesConstants.js");

const {
  validateAccessoryInstance,
  validateAccessoryEquipLimits,
} = require("./accessoriesValidation.js");

const {
  resolveAccessoryItem,
  calculateCarriedAccessoryValue,
} = require("./accessoriesResolver.js");

// ─────────────────────────────────────────────────────────────────────────────
// ACCESSORIES DB
// ─────────────────────────────────────────────────────────────────────────────

let _accessoriesDB = null;

function getAccessoriesDB() {
  if (_accessoriesDB) return _accessoriesDB;

  const filePath = path.join(
    process.cwd(),
    "data",
    "db_itens_accessories.csv",
  );

  const rows = loadCSV(filePath);

  _accessoriesDB = {};

  for (const row of rows) {
    _accessoriesDB[row.accessory_id] = {
      accessory_id: row.accessory_id,
      accessory_name: row.accessory_name,
      accessory_equip_limit: Number(row.accessory_equip_limit),
    };
  }

  return _accessoriesDB;
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
 * Builds the resolved accessories inventory, distributed across storage
 * locations. Each instance is a distinct physical item (no quantity), since
 * every accessory may carry its own custom name/description/effect.
 *
 * Only equipped + backpack items contribute to carried value.
 * Accessories have no weight and never contribute to carry weight.
 */
function buildAccessorySlots(accessoryInventory = []) {
  const accessoriesDb = getAccessoriesDB();

  // ── VALIDATE INSTANCES (shape) ────────────────────────────────────────────

  const instanceErrors = accessoryInventory.flatMap((instance, index) =>
    validateAccessoryInstance(instance, index),
  );

  if (instanceErrors.length > 0) {
    throw new Error(
      `[buildAccessorySlots] Invalid accessoryInventory:\n${instanceErrors.join("\n")}`,
    );
  }

  // ── VALIDATE UNKNOWN IDS ──────────────────────────────────────────────────

  const unknownIds = accessoryInventory
    .filter((instance) => !accessoriesDb[instance.accessory_id])
    .map((instance) => instance.accessory_id);

  if (unknownIds.length > 0) {
    throw new Error(
      `[buildAccessorySlots] Unknown accessory_id(s): ${unknownIds.join(", ")}`,
    );
  }

  // ── VALIDATE EQUIP LIMITS ──────────────────────────────────────────────────

  const equipLimitErrors = validateAccessoryEquipLimits(
    accessoryInventory,
    accessoriesDb,
  );

  if (equipLimitErrors.length > 0) {
    throw new Error(
      `[buildAccessorySlots] Equip limit exceeded:\n${equipLimitErrors.join("\n")}`,
    );
  }

  // ── BUILD BUCKETS ─────────────────────────────────────────────────────────

  const equipped = buildStorageBucket();
  const stash = buildStorageBucket();
  const camp = buildStorageBucket();
  const backpack = buildStorageBucket();

  for (const instance of accessoryInventory) {
    const accessory = accessoriesDb[instance.accessory_id];
    const resolved = resolveAccessoryItem(instance, accessory);

    if (instance.is_equipped) {
      equipped.push(resolved);
      continue;
    }

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

  const carried_accessory_value = calculateCarriedAccessoryValue(
    equipped,
    backpack,
  );

  return {
    equipped,
    stash,
    camp,
    backpack,
    carried_accessory_value,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  buildAccessorySlots,
  VALID_STORED_AT,
  _getAccessoriesDB: getAccessoriesDB,
};
