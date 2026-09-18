const path = require("path");

const { loadCSV } = require("../../../../helpers/dataUtils.js");

const { VALID_STORED_AT } = require("./shieldConstants.js");

const {
  validateShieldInstance,
  validateSingleEquippedShield,
  validateShieldEnchantments,
} = require("./shieldValidation.js");

const { resolveShieldPiece } = require("./shieldResolver.js");

const { getMaterialsDB } = require("../shared/materialsDB.js");
const { getEnchantmentsDB } = require("../shared/enchantmentsDB.js");
const {
  getEnchantmentTargetsDB,
} = require("../shared/enchantmentTargetsDB.js");
const { buildEquipmentSlots } = require("../shared/buildEquipmentSlots.js");

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

function buildShieldSlots(shieldInventory = []) {
  const shieldDb = getShieldDB();

  const materialDb = getMaterialsDB();

  const enchantmentsDb = getEnchantmentsDB();
  const targetsDb = getEnchantmentTargetsDB();

  return buildEquipmentSlots({
    label: "buildShieldSlots",
    entityLabel: "shield",
    inventory: shieldInventory,
    idKey: "shield_id",
    db: shieldDb,
    materialDb,
    validateInstance: validateShieldInstance,
    extraValidationSteps: [
      {
        message: "Equipped conflict",
        validate: () => validateSingleEquippedShield(shieldInventory),
      },
      {
        message: "Invalid enchantments",
        validate: () =>
          validateShieldEnchantments(
            shieldInventory,
            enchantmentsDb,
            targetsDb,
          ),
      },
    ],
    resolveInstance: (instance, shield, material) =>
      resolveShieldPiece(instance, shield, material, enchantmentsDb, targetsDb),
    equippedContainer: {
      init: () => null,
      place: (_current, resolved) => resolved,
    },
    fieldNames: {
      totalWeight: "total_shield_weight",
      carriedWeight: "carried_shield_weight",
      totalValue: "total_shield_value",
      carriedValue: "carried_shield_value",
    },
  });
}

module.exports = {
  buildShieldSlots,
  VALID_STORED_AT,
  _getShieldDB: getShieldDB,
  _getMaterialDB: getMaterialsDB,
  _validateShieldInstance: validateShieldInstance,
  _validateSingleEquippedShield: validateSingleEquippedShield,
};
