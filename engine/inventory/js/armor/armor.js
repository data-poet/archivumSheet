const path = require("path");

const { loadCSV } = require("../../../../helpers/dataUtils.js");

const { SLOTS, SLOT_MAP, VALID_STORED_AT } = require("./armorConstants.js");

const {
  validateArmorInstance,
  validateSingleEquippedPerSlot,
  validateArmorEnchantments,
} = require("./armorValidation.js");

const { resolveArmorPiece, buildEquippedSlots } = require("./armorResolver.js");

const { getMaterialsDB } = require("../shared/materialsDB.js");
const { getEnchantmentsDB } = require("../shared/enchantmentsDB.js");
const {
  getEnchantmentTargetsDB,
} = require("../shared/enchantmentTargetsDB.js");
const { buildEquipmentSlots } = require("../shared/buildEquipmentSlots.js");

let _armorDB = null;

function getArmorDB() {
  if (_armorDB) {
    return _armorDB;
  }

  const filePath = path.join(process.cwd(), "data", "db_equipment_armors.csv");

  const rows = loadCSV(filePath);

  _armorDB = {};

  for (const row of rows) {
    _armorDB[row.armor_id] = {
      armor_id: row.armor_id,

      armor_box_name: row.armor_box_name,
      armor_name: row.armor_name,
      armor_piece_location: row.armor_piece_location,
      armor_type: row.armor_type,
      armor_tier: row.armor_tier,
      armor_damage_resistance: Number(row.armor_damage_resistance),
      armor_weight: Number(row.armor_weight),
      armor_price: Number(row.armor_price),
      armor_hit_points: Number(row.armor_hit_points),
    };
  }

  return _armorDB;
}

function buildStorageSlots() {
  return Object.fromEntries(Object.values(SLOT_MAP).map((slot) => [slot, []]));
}

function buildArmorSlots(armorInventory = []) {
  const armorDb = getArmorDB();

  const materialDb = getMaterialsDB();
  const enchantmentsDb = getEnchantmentsDB();
  const targetsDb = getEnchantmentTargetsDB();

  return buildEquipmentSlots({
    label: "buildArmorSlots",
    entityLabel: "armor",
    inventory: armorInventory,
    idKey: "armor_id",
    db: armorDb,
    materialDb,
    validateInstance: validateArmorInstance,
    extraValidationSteps: [
      {
        message: "Slot conflict",
        validate: () => validateSingleEquippedPerSlot(armorInventory, armorDb),
      },
      {
        message: "Invalid enchantments",
        validate: () =>
          validateArmorEnchantments(
            armorInventory,
            armorDb,
            enchantmentsDb,
            targetsDb,
          ),
      },
    ],
    resolveInstance: (instance, armor, material) =>
      resolveArmorPiece(instance, armor, material, enchantmentsDb, targetsDb),
    equippedContainer: {
      init: () => buildEquippedSlots(),
      place: (bucket, resolved, instance, armor) => {
        bucket[SLOT_MAP[armor.armor_piece_location]] = resolved;
        return bucket;
      },
    },
    storageBucket: {
      init: () => buildStorageSlots(),
      place: (bucket, resolved, instance, armor) => {
        bucket[SLOT_MAP[armor.armor_piece_location]].push(resolved);
        return bucket;
      },
    },
    fieldNames: {
      totalWeight: "total_armor_weight",
      carriedWeight: "carried_armor_weight",
      totalValue: "total_armor_value",
      carriedValue: "carried_armor_value",
    },
  });
}

module.exports = {
  buildArmorSlots,
  SLOTS,
  VALID_STORED_AT,
  _getArmorDB: getArmorDB,
  _getMaterialDB: getMaterialsDB,
  _validateArmorInstance: validateArmorInstance,
  _validateSingleEquippedPerSlot: validateSingleEquippedPerSlot,
};
