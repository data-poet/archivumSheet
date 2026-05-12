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

// Armor DB (lazy cache)

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

// Main

/**
 * Builds the armor section of the inventory.
 *
 * @param {Array} armorInventory
 *
 * [
 *   {
 *     armor_id: string,
 *     is_equipped: boolean,
 *     storedAt:
 *       null |
 *       "camp" |
 *       "stash" |
 *       "backpack",
 *   }
 * ]
 *
 * @returns {{
 *   equipped: Record<string, object | null>,
 *   carried: object[],
 *   total_armor_weight: number,
 *   carried_armor_weight: number,
 * }}
 */
function buildArmorSlots(armorInventory = []) {
  const db = getArmorDB();

  // ───────────────────────────────────────────────────────────────────────────
  // Validate instances
  // ───────────────────────────────────────────────────────────────────────────

  const instanceErrors = armorInventory.flatMap((instance, index) =>
    validateArmorInstance(instance, index),
  );

  if (instanceErrors.length > 0) {
    throw new Error(
      `[buildArmorSlots] Invalid armor inventory:\n${instanceErrors.join("\n")}`,
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Validate armor ids
  // ───────────────────────────────────────────────────────────────────────────

  const unknownArmorIds = armorInventory
    .filter((instance) => !db[instance.armor_id])
    .map((instance) => instance.armor_id);

  if (unknownArmorIds.length > 0) {
    throw new Error(
      `[buildArmorSlots] Unknown armor_id(s): ${unknownArmorIds.join(", ")}`,
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Validate equipped conflicts
  // ───────────────────────────────────────────────────────────────────────────

  const slotErrors = validateSingleEquippedPerSlot(armorInventory, db);

  if (slotErrors.length > 0) {
    throw new Error(
      `[buildArmorSlots] Slot conflict:\n${slotErrors.join("\n")}`,
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Build inventory
  // ───────────────────────────────────────────────────────────────────────────

  const equipped = buildEquippedSlots();

  const carried = [];

  let carried_armor_weight = 0;

  for (const instance of armorInventory) {
    const armor = db[instance.armor_id];

    const resolvedArmor = resolveArmorPiece(instance, armor);

    // Equipped armor counts as carried
    if (instance.is_equipped) {
      equipped[armor.armor_piece_location] = resolvedArmor;

      carried_armor_weight += armor.armor_weight;

      continue;
    }

    carried.push(resolvedArmor);

    // Backpack armor counts as carried
    if (instance.storedAt === "backpack") {
      carried_armor_weight += armor.armor_weight;
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Totals
  // ───────────────────────────────────────────────────────────────────────────

  const total_armor_weight = calculateTotalArmorWeight(armorInventory, db);

  return {
    equipped,
    carried,

    total_armor_weight,
    carried_armor_weight,
  };
}

// Exports

module.exports = {
  buildArmorSlots,

  SLOTS,
  VALID_STORED_AT,

  // Testing internals
  _getArmorDB: getArmorDB,

  _validateArmorInstance: validateArmorInstance,

  _validateSingleEquippedPerSlot: validateSingleEquippedPerSlot,
};
