const path = require("path");

const { loadCSV } = require("../../../helpers/dataUtils.js");

const { SLOTS, VALID_STORED_AT } = require("./equipmentArmorConstants");

const {
  validateArmorInstance,
  validateSingleEquippedPerSlot,
} = require("./equipmentArmorValidation");

const {
  resolveArmorPiece,
  buildEquippedSlots,
  calculateTotalArmorWeight,
} = require("./equipmentArmorResolver");

// ─────────────────────────────────────────────────────────────────────────────
// ARMOR DB
// ─────────────────────────────────────────────────────────────────────────────

let _armorDB = null;

function getArmorDB() {
  if (_armorDB) {
    return _armorDB;
  }

  const csvPath = path.resolve(
    __dirname,
    "../../../data/db_equipment_armors.csv",
  );

  const rows = loadCSV(csvPath);

  _armorDB = {};

  for (const row of rows) {
    _armorDB[row.armor_id] = {
      armor_id: row.armor_id,

      armor_box_name: row.armor_box_name,
      armor_name: row.armor_name,
      armor_piece_location: row.armor_piece_location,
      armor_type: row.armor_type,
      armor_tier: row.armor_tier,
      armor_damage_resistence: Number(row.armor_damage_resistence),
      armor_weight: Number(row.armor_weight),
      armor_price: Number(row.armor_price),
      armor_hit_points: Number(row.armor_hit_points),
    };
  }

  return _armorDB;
}

// ─────────────────────────────────────────────────────────────────────────────
// MATERIAL DB
// ─────────────────────────────────────────────────────────────────────────────

let _materialDB = null;

function getMaterialDB() {
  if (_materialDB) {
    return _materialDB;
  }

  const csvPath = path.resolve(
    __dirname,
    "../../../data/db_crafting_materials.csv",
  );

  const rows = loadCSV(csvPath);

  _materialDB = {};

  for (const row of rows) {
    _materialDB[row.material_id] = {
      material_id: row.material_id,

      material_name: row.material_name,
      material_type: row.material_type,
      material_tier: row.material_tier,
      material_dr_modifier: Number(row.material_dr_modifier || 0),
      material_def_effect: row.material_def_effect || null,
      material_weight_modifier: Number(row.material_weight_modifier || 1),
      material_price_modifier: Number(row.material_price_modifier || 1),
      material_hit_points_modifier: Number(
        row.material_hit_points_modifier || 0,
      ),
    };
  }

  return _materialDB;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────

function buildArmorSlots(armorInventory = []) {
  const armorDb = getArmorDB();

  const materialDb = getMaterialDB();

  // VALIDATE INSTANCES

  const instanceErrors = armorInventory.flatMap((instance, index) =>
    validateArmorInstance(instance, index),
  );

  if (instanceErrors.length > 0) {
    throw new Error(
      `[buildArmorSlots] Invalid armor inventory:\n${instanceErrors.join("\n")}`,
    );
  }

  // VALIDATE ARMOR IDS

  const unknownArmorIds = armorInventory
    .filter((instance) => !armorDb[instance.armor_id])
    .map((instance) => instance.armor_id);

  if (unknownArmorIds.length > 0) {
    throw new Error(
      `[buildArmorSlots] Unknown armor_id(s): ${unknownArmorIds.join(", ")}`,
    );
  }

  // VALIDATE MATERIAL IDS

  const unknownMaterialIds = armorInventory
    .filter(
      (instance) => instance.material_id && !materialDb[instance.material_id],
    )
    .map((instance) => instance.material_id);

  if (unknownMaterialIds.length > 0) {
    throw new Error(
      `[buildArmorSlots] Unknown material_id(s): ${unknownMaterialIds.join(", ")}`,
    );
  }

  // VALIDATE EQUIPPED SLOTS

  const slotErrors = validateSingleEquippedPerSlot(armorInventory, armorDb);

  if (slotErrors.length > 0) {
    throw new Error(
      `[buildArmorSlots] Slot conflict:\n${slotErrors.join("\n")}`,
    );
  }

  // BUILD INVENTORY

  const equipped = buildEquippedSlots();

  const carried = [];

  let carried_armor_weight = 0;

  for (const instance of armorInventory) {
    const armor = armorDb[instance.armor_id];

    const material = instance.material_id
      ? materialDb[instance.material_id]
      : null;

    const resolvedArmor = resolveArmorPiece(instance, armor, material);

    // EQUIPPED

    if (instance.is_equipped) {
      equipped[armor.armor_piece_location] = resolvedArmor;

      carried_armor_weight += resolvedArmor.armor_final_weight;

      continue;
    }

    carried.push(resolvedArmor);

    // BACKPACK COUNTS AS CARRIED

    if (instance.storedAt === "backpack") {
      carried_armor_weight += resolvedArmor.armor_final_weight;
    }
  }

  // TOTALS

  const total_armor_weight = calculateTotalArmorWeight(
    armorInventory,
    armorDb,
    materialDb,
  );

  return {
    equipped,
    carried,
    total_armor_weight,
    carried_armor_weight,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  buildArmorSlots,
  SLOTS,
  VALID_STORED_AT,
  _getArmorDB: getArmorDB,
  _getMaterialDB: getMaterialDB,
  _validateArmorInstance: validateArmorInstance,
  _validateSingleEquippedPerSlot: validateSingleEquippedPerSlot,
};
