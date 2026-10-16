const { STORED_AT } = require("../../../../helpers/storage.js");
const { loadDataset } = require("../../../../helpers/datasets.js");

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

  const rows = loadDataset("MAGIC_GEAR");

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

// Each instance is a distinct item (no quantity) that may carry its own custom name/description/effect. Only equipped and
// backpack items count toward carried value and weight. Equip limits are per magic_gear_type (see MAGIC_GEAR_EQUIP_LIMITS).
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

    if (instance.storedAt === STORED_AT.STASH) {
      stash.push(resolved);
      continue;
    }

    if (instance.storedAt === STORED_AT.CAMP) {
      camp.push(resolved);
      continue;
    }

    if (instance.storedAt === STORED_AT.BACKPACK) {
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
