const path = require("path");

const { loadCSV } = require("../../../../helpers/dataUtils.js");

const { VALID_STORED_AT } = require("./meleeConstants.js");

const {
  isMeleeDualUse,
  getRangedCounterpart,
} = require("../shared/dualUseWeapons.js");

const {
  validateMeleeInstance,
  validateMeleeEnchantments,
} = require("./meleeValidation.js");

const { resolveMeleeWeapons } = require("./meleeResolver.js");

const { getMaterialsDB } = require("../shared/materialsDB.js");
const { getEnchantmentsDB } = require("../shared/enchantmentsDB.js");
const {
  getEnchantmentTargetsDB,
} = require("../shared/enchantmentTargetsDB.js");
const { buildEquipmentSlots } = require("../shared/buildEquipmentSlots.js");

let _meleeDB = null;

function getMeleeDB() {
  if (_meleeDB) {
    return _meleeDB;
  }

  const filePath = path.join(
    process.cwd(),
    "data",
    "db_equipment_melee_weapons.csv",
  );

  const rows = loadCSV(filePath);

  _meleeDB = {};

  for (const row of rows) {
    _meleeDB[row.weapon_id] = {
      weapon_id: row.weapon_id,

      weapon_box_name: row.weapon_box_name,
      weapon_name: row.weapon_name,
      weapon_skill: row.weapon_skill,
      weapon_type: row.weapon_type,
      weapon_tier: row.weapon_tier,
      weapon_length: row.weapon_length,
      weapon_damage_type: row.weapon_damage_type,
      weapon_min_strength: Number(row.weapon_min_strength),
      weapon_bal_modifier: Number(row.weapon_bal_modifier),
      weapon_gdp_modifier: Number(row.weapon_gdp_modifier),
      weapon_weight: Number(row.weapon_weight),
      weapon_price: Number(row.weapon_price),
      weapon_hit_points: Number(row.weapon_hit_points),
    };
  }

  return _meleeDB;
}

function buildMeleeSlots(meleeInventory = []) {
  const meleeDb = getMeleeDB();

  const materialDb = getMaterialsDB();

  const enchantmentsDb = getEnchantmentsDB();
  const targetsDb = getEnchantmentTargetsDB();

  return buildEquipmentSlots({
    label: "buildMeleeSlots",
    entityLabel: "melee",
    inventory: meleeInventory,
    idKey: "weapon_id",
    db: meleeDb,
    materialDb,
    validateInstance: validateMeleeInstance,
    extraValidationSteps: [
      {
        message: "Invalid enchantments",
        validate: () =>
          validateMeleeEnchantments(meleeInventory, enchantmentsDb, targetsDb),
      },
    ],
    resolveInstance: (instance, melee, material) =>
      resolveMeleeWeapons(instance, melee, material, enchantmentsDb, targetsDb),
    equippedContainer: {
      init: () => [],
      place: (bucket, resolved) => {
        bucket.push(resolved);
        return bucket;
      },
    },
    fieldNames: {
      totalWeight: "total_melee_weight",
      carriedWeight: "carried_melee_weapons_weight",
      totalValue: "total_melee_value",
      carriedValue: "carried_melee_weapons_value",
    },
  });
}

module.exports = {
  buildMeleeSlots,
  VALID_STORED_AT,
  _getMeleeDB: getMeleeDB,
  _getMaterialDB: getMaterialsDB,
  _validateMeleeInstance: validateMeleeInstance,
  _isMeleeDualUse: isMeleeDualUse,
  _getRangedCounterpart: getRangedCounterpart,
};
