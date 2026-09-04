const path = require("path");

const { loadCSV } = require("../../../../helpers/dataUtils.js");

const { VALID_STORED_AT } = require("./magicGearConstants.js");

const {
  validateMagicGearInstance,
  validateMagicGearEquipLimits,
  validateMagicGearEnchantments,
} = require("./magicGearValidation.js");

const {
  resolveMagicGearItem,
  calculateCarriedMagicGearValue,
  calculateCarriedMagicGearWeight,
} = require("./magicGearResolver.js");

const { getEnchantmentsDB } = require("../shared/enchantmentsDB.js");
const {
  getEnchantmentTargetsDB,
} = require("../shared/enchantmentTargetsDB.js");

let _magicGearDB = null;

function getMagicGearDB() {
  if (_magicGearDB) return _magicGearDB;

  const filePath = path.join(process.cwd(), "data", "db_magic_gear.csv");

  const rows = loadCSV(filePath);

  _magicGearDB = {};

  for (const row of rows) {
    _magicGearDB[row.magic_gear_id] = {
      magic_gear_id: row.magic_gear_id,
      magic_gear_type: row.magic_gear_type,
      magic_gear_name: row.magic_gear_name,
      magic_gear_price: Number(row.magic_gear_price),
      magic_gear_weight: Number(row.magic_gear_weight),
    };
  }

  return _magicGearDB;
}

function buildStorageBucket() {
  return [];
}

/**
 * Builds the resolved magic gear inventory, distributed across storage
 * locations. Each instance is a distinct physical item (no quantity), since
 * every magic gear item may carry its own custom name/description/effect.
 *
 * Only equipped + backpack items contribute to carried value and weight.
 * Equip limits are PER magic_gear_type (see MAGIC_GEAR_EQUIP_LIMITS) —
 * Arcano allows 2 equipped in any combination, Musical allows only 1.
 */
function buildMagicGearSlots(magicGearInventory = []) {
  const magicGearDb = getMagicGearDB();

  const instanceErrors = magicGearInventory.flatMap((instance, index) =>
    validateMagicGearInstance(instance, index),
  );

  if (instanceErrors.length > 0) {
    throw new Error(
      `[buildMagicGearSlots] Invalid magicGearInventory:\n${instanceErrors.join("\n")}`,
    );
  }

  const unknownIds = magicGearInventory
    .filter((instance) => !magicGearDb[instance.magic_gear_id])
    .map((instance) => instance.magic_gear_id);

  if (unknownIds.length > 0) {
    throw new Error(
      `[buildMagicGearSlots] Unknown magic_gear_id(s): ${unknownIds.join(", ")}`,
    );
  }

  const equipLimitErrors = validateMagicGearEquipLimits(
    magicGearInventory,
    magicGearDb,
  );

  if (equipLimitErrors.length > 0) {
    throw new Error(
      `[buildMagicGearSlots] Equip limit exceeded:\n${equipLimitErrors.join("\n")}`,
    );
  }

  const enchantmentsDb = getEnchantmentsDB();
  const targetsDb = getEnchantmentTargetsDB();

  const enchantmentErrors = validateMagicGearEnchantments(
    magicGearInventory,
    enchantmentsDb,
    targetsDb,
  );

  if (enchantmentErrors.length > 0) {
    throw new Error(
      `[buildMagicGearSlots] Invalid enchantments:\n${enchantmentErrors.join("\n")}`,
    );
  }

  const equipped = buildStorageBucket();
  const stash = buildStorageBucket();
  const camp = buildStorageBucket();
  const backpack = buildStorageBucket();

  for (const instance of magicGearInventory) {
    const magicGear = magicGearDb[instance.magic_gear_id];
    const resolved = resolveMagicGearItem(
      instance,
      magicGear,
      enchantmentsDb,
      targetsDb,
    );

    if (instance.is_equipped) {
      equipped.push(resolved);
      continue;
    }

    if (instance.storedAt === "stash") {
      stash.push(resolved);
      continue;
    }

    if (instance.storedAt === "camp") {
      camp.push(resolved);
      continue;
    }

    if (instance.storedAt === "backpack") {
      backpack.push(resolved);
    }
  }

  const carried_magic_gear_value = calculateCarriedMagicGearValue(
    equipped,
    backpack,
  );

  const carried_magic_gear_weight = calculateCarriedMagicGearWeight(
    equipped,
    backpack,
  );

  return {
    equipped,
    stash,
    camp,
    backpack,
    carried_magic_gear_value,
    carried_magic_gear_weight,
  };
}

module.exports = {
  buildMagicGearSlots,
  VALID_STORED_AT,
  _getMagicGearDB: getMagicGearDB,
  _getEnchantmentsDB: getEnchantmentsDB,
  _getEnchantmentTargetsDB: getEnchantmentTargetsDB,
};
