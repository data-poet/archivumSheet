const path = require("path");

const { loadCSV } = require("../../../../helpers/dataUtils.js");

const { VALID_STORED_AT } = require("./shieldConstants.js");

const {
  validateShieldInstance,
  validateSingleEquippedShield,
  validateShieldEnchantments,
} = require("./shieldValidation.js");

const {
  resolveShieldPiece,
  calculateTotalShieldWeight,
  calculateTotalShieldValue,
} = require("./shieldResolver.js");

const { getMaterialsDB } = require("../shared/materialsDB.js");
const { getEnchantmentsDB } = require("../shared/enchantmentsDB.js");
const {
  getEnchantmentTargetsDB,
} = require("../shared/enchantmentTargetsDB.js");

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

function buildStorageBucket() {
  return [];
}

function buildShieldSlots(shieldInventory = []) {
  const shieldDb = getShieldDB();

  const materialDb = getMaterialsDB();

  const enchantmentsDb = getEnchantmentsDB();
  const targetsDb = getEnchantmentTargetsDB();

  const instanceErrors = shieldInventory.flatMap((instance, index) =>
    validateShieldInstance(instance, index),
  );

  if (instanceErrors.length > 0) {
    throw new Error(
      `[buildShieldSlots] Invalid shield inventory:\n${instanceErrors.join("\n")}`,
    );
  }

  const unknownShieldIds = shieldInventory
    .filter((instance) => !shieldDb[instance.shield_id])
    .map((instance) => instance.shield_id);

  if (unknownShieldIds.length > 0) {
    throw new Error(
      `[buildShieldSlots] Unknown shield_id(s): ${unknownShieldIds.join(", ")}`,
    );
  }

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

  const equippedErrors = validateSingleEquippedShield(shieldInventory);

  if (equippedErrors.length > 0) {
    throw new Error(
      `[buildShieldSlots] Equipped conflict:\n${equippedErrors.join("\n")}`,
    );
  }

  const enchantmentErrors = validateShieldEnchantments(
    shieldInventory,
    enchantmentsDb,
    targetsDb,
  );

  if (enchantmentErrors.length > 0) {
    throw new Error(
      `[buildShieldSlots] Invalid enchantments:\n${enchantmentErrors.join("\n")}`,
    );
  }

  let equipped = null;

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

    const resolvedShield = resolveShieldPiece(
      instance,
      shield,
      material,
      enchantmentsDb,
      targetsDb,
    );

    if (instance.is_equipped) {
      equipped = resolvedShield;

      carried_shield_weight += resolvedShield.final_weight;
      carried_shield_value += resolvedShield.total_value;

      continue;
    }

    if (instance.storedAt === "stash") {
      stash.push(resolvedShield);

      continue;
    }

    if (instance.storedAt === "camp") {
      camp.push(resolvedShield);

      continue;
    }

    if (instance.storedAt === "backpack") {
      backpack.push(resolvedShield);

      carried_shield_weight += resolvedShield.final_weight;
      carried_shield_value += resolvedShield.total_value;
    }
  }

  const total_shield_weight = calculateTotalShieldWeight(
    shieldInventory,
    shieldDb,
    materialDb,
    enchantmentsDb,
    targetsDb,
  );

  const total_shield_value = calculateTotalShieldValue(
    shieldInventory,
    shieldDb,
    materialDb,
    enchantmentsDb,
    targetsDb,
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

module.exports = {
  buildShieldSlots,
  VALID_STORED_AT,
  _getShieldDB: getShieldDB,
  _getMaterialDB: getMaterialsDB,
  _validateShieldInstance: validateShieldInstance,
  _validateSingleEquippedShield: validateSingleEquippedShield,
};
