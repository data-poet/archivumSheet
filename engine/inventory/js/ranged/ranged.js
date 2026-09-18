const path = require("path");

const { loadCSV } = require("../../../../helpers/dataUtils.js");

const { VALID_STORED_AT } = require("./rangedConstants.js");

const {
  isRangedDualUse,
  getMeleeCounterpart,
} = require("../shared/dualUseWeapons.js");

const {
  validateRangedInstance,
  validateRangedEnchantments,
} = require("./rangedValidation.js");

const { resolveRangedWeapons } = require("./rangedResolver.js");

const { getMaterialsDB } = require("../shared/materialsDB.js");
const { getEnchantmentsDB } = require("../shared/enchantmentsDB.js");
const {
  getEnchantmentTargetsDB,
} = require("../shared/enchantmentTargetsDB.js");
const { buildEquipmentSlots } = require("../shared/buildEquipmentSlots.js");

let _rangedDB = null;

function getRangedDB() {
  if (_rangedDB) {
    return _rangedDB;
  }

  const filePath = path.join(
    process.cwd(),
    "data",
    "db_equipment_ranged_weapons.csv",
  );

  const rows = loadCSV(filePath);

  _rangedDB = {};

  for (const row of rows) {
    _rangedDB[row.weapon_id] = {
      weapon_id: row.weapon_id,

      weapon_box_name: row.weapon_box_name,
      weapon_name: row.weapon_name,
      weapon_skill: row.weapon_skill,
      weapon_type: row.weapon_type,
      weapon_tier: row.weapon_tier,
      weapon_damage_type: row.weapon_damage_type,
      weapon_half_distance: row.weapon_half_distance,
      weapon_max_distance: row.weapon_max_distance,
      weapon_min_strength: Number(row.weapon_min_strength),
      weapon_gdp_modifier: Number(row.weapon_gdp_modifier),
      weapon_tr: Number(row.weapon_tr),
      weapon_prec: Number(row.weapon_prec),
      weapon_weight: Number(row.weapon_weight),
      weapon_price: Number(row.weapon_price),
      weapon_hit_points: Number(row.weapon_hit_points),
    };
  }

  return _rangedDB;
}

function buildRangedSlots(rangedInventory = [], ST = 0) {
  const rangedDb = getRangedDB();

  const materialDb = getMaterialsDB();

  const enchantmentsDb = getEnchantmentsDB();
  const targetsDb = getEnchantmentTargetsDB();

  return buildEquipmentSlots({
    label: "buildRangedSlots",
    entityLabel: "ranged",
    inventory: rangedInventory,
    idKey: "weapon_id",
    db: rangedDb,
    materialDb,
    validateInstance: validateRangedInstance,
    extraValidationSteps: [
      {
        message: "Invalid enchantments",
        validate: () =>
          validateRangedEnchantments(
            rangedInventory,
            enchantmentsDb,
            targetsDb,
          ),
      },
    ],
    resolveInstance: (instance, ranged, material) =>
      resolveRangedWeapons(
        instance,
        ranged,
        material,
        ST,
        enchantmentsDb,
        targetsDb,
      ),
    equippedContainer: {
      init: () => [],
      place: (bucket, resolved) => {
        bucket.push(resolved);
        return bucket;
      },
    },
    fieldNames: {
      totalWeight: "total_ranged_weight",
      carriedWeight: "carried_ranged_weapons_weight",
      totalValue: "total_ranged_value",
      carriedValue: "carried_ranged_weapons_value",
    },
  });
}

module.exports = {
  buildRangedSlots,
  VALID_STORED_AT,
  _getRangedDB: getRangedDB,
  _getMaterialDB: getMaterialsDB,
  _validateRangedInstance: validateRangedInstance,
  _isRangedDualUse: isRangedDualUse,
  _getMeleeCounterpart: getMeleeCounterpart,
};
