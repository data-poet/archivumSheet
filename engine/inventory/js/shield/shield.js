const path = require("path");

const { loadCSV } = require("../../../../helpers/dataUtils.js");

const { VALID_STORED_AT } = require("./shieldConstants.js");

const {
  validateShieldInstance,
  validateSingleEquippedShield,
} = require("./shieldValidation.js");

const {
  resolveShieldPiece,
  calculateTotalShieldWeight,
  calculateTotalShieldValue,
} = require("./shieldResolver.js");

const { getMaterialsDB } = require("../shared/materialsDB.js");

// ─────────────────────────────────────────────────────────────────────────────
// SHIELD DB
// ─────────────────────────────────────────────────────────────────────────────

let _shieldDB = null;

function getShieldDB() {
  if (_shieldDB) {
    return _shieldDB;
  }

  const filePath = path.join(process.cwd(), "data", "db_equipment_shields.csv");

  const rows = loadCSV(filePath);

  _shieldDB = {};

  for (const row of rows) {
    _shieldDB[row.shield_id] = {
      shield_id: row.shield_id,

      shield_box_name: row.shield_box_name,
      shield_name: row.shield_name,
      shield_type: row.shield_type,
      shield_tier: row.shield_tier,
      shield_damage_resistance: Number(row.shield_damage_resistance),
      shield_weight: Number(row.shield_weight),
      shield_price: Number(row.shield_price),
      shield_hit_points: Number(row.shield_hit_points),
    };
  }

  return _shieldDB;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

// Shields have no slots — storage buckets are flat arrays.
function buildStorageBucket() {
  return [];
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────

function buildShieldSlots(shieldInventory = []) {
  const shieldDb = getShieldDB();

  const materialDb = getMaterialsDB();

  // VALIDATE INSTANCES

  const instanceErrors = shieldInventory.flatMap((instance, index) =>
    validateShieldInstance(instance, index),
  );

  if (instanceErrors.length > 0) {
    throw new Error(
      `[buildShieldSlots] Invalid shield inventory:\n${instanceErrors.join("\n")}`,
    );
  }

  // VALIDATE SHIELD IDS

  const unknownShieldIds = shieldInventory
    .filter((instance) => !shieldDb[instance.shield_id])
    .map((instance) => instance.shield_id);

  if (unknownShieldIds.length > 0) {
    throw new Error(
      `[buildShieldSlots] Unknown shield_id(s): ${unknownShieldIds.join(", ")}`,
    );
  }

  // VALIDATE MATERIAL IDS

  const unknownMaterialIds = shieldInventory
    .filter(
      (instance) => instance.material_id && !materialDb[instance.material_id],
    )
    .map((instance) => instance.material_id);

  if (unknownMaterialIds.length > 0) {
    throw new Error(
      `[buildShieldSlots] Unknown material_id(s): ${unknownMaterialIds.join(", ")}`,
    );
  }

  // VALIDATE SINGLE EQUIPPED

  const equippedErrors = validateSingleEquippedShield(shieldInventory);

  if (equippedErrors.length > 0) {
    throw new Error(
      `[buildShieldSlots] Equipped conflict:\n${equippedErrors.join("\n")}`,
    );
  }

  // BUILD INVENTORY

  // Only one shield can be equipped — single object, not a slot map.
  let equipped = null;

  // Storage buckets are flat arrays — no slot keying.
  const stash = buildStorageBucket();
  const camp = buildStorageBucket();
  const backpack = buildStorageBucket();

  let carried_shield_weight = 0;
  let carried_shield_value = 0;

  for (const instance of shieldInventory) {
    const shield = shieldDb[instance.shield_id];

    const material = instance.material_id
      ? materialDb[instance.material_id]
      : null;

    const resolvedShield = resolveShieldPiece(instance, shield, material);

    // EQUIPPED

    if (instance.is_equipped) {
      equipped = resolvedShield;

      carried_shield_weight += resolvedShield.shield_final_weight;
      carried_shield_value += resolvedShield.total_value;

      continue;
    }

    // STASH

    if (instance.storedAt === "stash") {
      stash.push(resolvedShield);

      continue;
    }

    // CAMP

    if (instance.storedAt === "camp") {
      camp.push(resolvedShield);

      continue;
    }

    // BACKPACK

    if (instance.storedAt === "backpack") {
      backpack.push(resolvedShield);

      carried_shield_weight += resolvedShield.shield_final_weight;
      carried_shield_value += resolvedShield.total_value;
    }
  }

  // TOTALS

  const total_shield_weight = calculateTotalShieldWeight(
    shieldInventory,
    shieldDb,
    materialDb,
  );

  const total_shield_value = calculateTotalShieldValue(
    shieldInventory,
    shieldDb,
    materialDb,
  );

  return {
    equipped,
    stash,
    camp,
    backpack,
    total_shield_weight,
    carried_shield_weight,
    total_shield_value,
    carried_shield_value,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  buildShieldSlots,
  VALID_STORED_AT,
  _getShieldDB: getShieldDB,
  _getMaterialDB: getMaterialsDB,
  _validateShieldInstance: validateShieldInstance,
  _validateSingleEquippedShield: validateSingleEquippedShield,
};
