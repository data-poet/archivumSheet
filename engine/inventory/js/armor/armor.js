const path = require("path");

const { loadCSV } = require("../../../../helpers/dataUtils.js");

const { SLOTS, SLOT_MAP, VALID_STORED_AT } = require("./armorConstants.js");

const {
  validateArmorInstance,
  validateSingleEquippedPerSlot,
} = require("./armorValidation.js");

const {
  resolveArmorPiece,
  buildEquippedSlots,
  calculateTotalArmorWeight,
  calculateTotalArmorValue,
} = require("./armorResolver.js");

const { getMaterialsDB } = require("../shared/materialsDB.js");

// ─────────────────────────────────────────────────────────────────────────────
// ARMOR DB
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function buildStorageSlots() {
  return Object.fromEntries(Object.values(SLOT_MAP).map((slot) => [slot, []]));
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────

function buildArmorSlots(armorInventory = []) {
  const armorDb = getArmorDB();

  const materialDb = getMaterialsDB();

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

  // ONLY ONE PER SLOT
  const equipped = buildEquippedSlots();

  // MULTIPLE PER SLOT
  const stash = buildStorageSlots();

  const camp = buildStorageSlots();

  const backpack = buildStorageSlots();

  let carried_armor_weight = 0;
  let carried_armor_value = 0;

  for (const instance of armorInventory) {
    const armor = armorDb[instance.armor_id];

    const material = instance.material_id
      ? materialDb[instance.material_id]
      : null;

    const resolvedArmor = resolveArmorPiece(instance, armor, material);

    const slot = SLOT_MAP[armor.armor_piece_location];

    // EQUIPPED

    if (instance.is_equipped) {
      equipped[slot] = resolvedArmor;

      carried_armor_weight += resolvedArmor.armor_final_weight;
      carried_armor_value += resolvedArmor.total_value;

      continue;
    }

    // STASH

    if (instance.storedAt === "stash") {
      stash[slot].push(resolvedArmor);

      continue;
    }

    // CAMP

    if (instance.storedAt === "camp") {
      camp[slot].push(resolvedArmor);

      continue;
    }

    // BACKPACK

    if (instance.storedAt === "backpack") {
      backpack[slot].push(resolvedArmor);

      carried_armor_weight += resolvedArmor.armor_final_weight;
      carried_armor_value += resolvedArmor.total_value;
    }
  }

  // TOTALS

  const total_armor_weight = calculateTotalArmorWeight(
    armorInventory,
    armorDb,
    materialDb,
  );

  const total_armor_value = calculateTotalArmorValue(
    armorInventory,
    armorDb,
    materialDb,
  );

  return {
    equipped,
    stash,
    camp,
    backpack,
    total_armor_weight,
    carried_armor_weight,
    total_armor_value,
    carried_armor_value,
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
  _getMaterialDB: getMaterialsDB,
  _validateArmorInstance: validateArmorInstance,
  _validateSingleEquippedPerSlot: validateSingleEquippedPerSlot,
};
