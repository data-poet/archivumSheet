const path = require("path");

const { loadCSV } = require("../../../../helpers/dataUtils.js");

const { VALID_STORED_AT } = require("./firearmsConstants.js");

const {
  validateFirearmInstance,
  validateFirearmEnchantments,
} = require("./firearmsValidation.js");

const { resolveFirearmWeapon } = require("./firearmsResolver.js");

const { getMaterialsDB } = require("../shared/materialsDB.js");
const { getEnchantmentsDB } = require("../shared/enchantmentsDB.js");
const {
  getEnchantmentTargetsDB,
} = require("../shared/enchantmentTargetsDB.js");
const { buildEquipmentSlots } = require("../shared/buildEquipmentSlots.js");

let _firearmsDB = null;

function getFirearmsDB() {
  if (_firearmsDB) {
    return _firearmsDB;
  }

  const filePath = path.join(
    process.cwd(),
    "data",
    "db_equipment_firearms_weapons.csv",
  );

  const rows = loadCSV(filePath);

  _firearmsDB = {};

  for (const row of rows) {
    _firearmsDB[row.weapon_id] = {
      weapon_id: row.weapon_id,

      weapon_name: row.weapon_name,
      weapon_type: row.weapon_type,
      weapon_skill: row.weapon_skill,
      weapon_tier: row.weapon_tier,
      weapon_gdp_dice: row.weapon_gdp_dice,
      weapon_gdp_modifier: Number(row.weapon_gdp_modifier),
      weapon_reload_speed: row.weapon_reload_speed,
      weapon_magazine_size: Number(row.weapon_magazine_size),
      weapon_cdt: Number(row.weapon_cdt),
      weapon_weight: Number(row.weapon_weight),
      weapon_price: Number(row.weapon_price),
      weapon_length: Number(row.weapon_length),
      weapon_min_strength: Number(row.weapon_min_strength),
      weapon_damage_type: row.weapon_damage_type,
      weapon_tr: Number(row.weapon_tr),
      weapon_prec: Number(row.weapon_prec),
      weapon_half_distance: Number(row.weapon_half_distance),
      weapon_max_distance: Number(row.weapon_max_distance),
      weapon_hit_points: Number(row.weapon_hit_points),
    };
  }

  return _firearmsDB;
}

function buildFirearmSlots(firearmsInventory = []) {
  const firearmsDb = getFirearmsDB();

  const materialDb = getMaterialsDB();

  const enchantmentsDb = getEnchantmentsDB();
  const targetsDb = getEnchantmentTargetsDB();

  return buildEquipmentSlots({
    label: "buildFirearmSlots",
    entityLabel: "firearms",
    inventory: firearmsInventory,
    idKey: "weapon_id",
    db: firearmsDb,
    materialDb,
    validateInstance: validateFirearmInstance,
    extraValidationSteps: [
      {
        message: "Invalid enchantments",
        validate: () =>
          validateFirearmEnchantments(
            firearmsInventory,
            enchantmentsDb,
            targetsDb,
          ),
      },
    ],
    resolveInstance: (instance, firearm, material) =>
      resolveFirearmWeapon(
        instance,
        firearm,
        material,
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
      totalWeight: "total_firearms_weight",
      carriedWeight: "carried_firearms_weight",
      totalValue: "total_firearms_value",
      carriedValue: "carried_firearms_value",
    },
  });
}

module.exports = {
  buildFirearmSlots,
  VALID_STORED_AT,
  _getFirearmsDB: getFirearmsDB,
  _getMaterialDB: getMaterialsDB,
  _validateFirearmInstance: validateFirearmInstance,
};
