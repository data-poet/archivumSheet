const path = require("path");

const { loadCSV } = require("../../../../helpers/dataUtils.js");

const { VALID_STORED_AT } = require("./firearmsConstants.js");

const {
  validateFirearmInstance,
  validateFirearmEnchantments,
} = require("./firearmsValidation.js");

const {
  resolveFirearmWeapon,
  calculateTotalFirearmsWeight,
  calculateTotalFirearmsValue,
} = require("./firearmsResolver.js");

const { getMaterialsDB } = require("../shared/materialsDB.js");
const { getEnchantmentsDB } = require("../shared/enchantmentsDB.js");
const {
  getEnchantmentTargetsDB,
} = require("../shared/enchantmentTargetsDB.js");

// ─────────────────────────────────────────────────────────────────────────────
// FIREARMS DB
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

// Firearms have no slots — storage buckets are flat arrays.
function buildStorageBucket() {
  return [];
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────

function buildFirearmSlots(firearmsInventory = []) {
  const firearmsDb = getFirearmsDB();

  const materialDb = getMaterialsDB();

  const enchantmentsDb = getEnchantmentsDB();
  const targetsDb = getEnchantmentTargetsDB();

  // VALIDATE INSTANCES

  const instanceErrors = firearmsInventory.flatMap((instance, index) =>
    validateFirearmInstance(instance, index),
  );

  if (instanceErrors.length > 0) {
    throw new Error(
      `[buildFirearmSlots] Invalid firearms inventory:\n${instanceErrors.join("\n")}`,
    );
  }

  // VALIDATE FIREARM IDS

  const unknownFirearmIds = firearmsInventory
    .filter((instance) => !firearmsDb[instance.weapon_id])
    .map((instance) => instance.weapon_id);

  if (unknownFirearmIds.length > 0) {
    throw new Error(
      `[buildFirearmSlots] Unknown weapon_id(s): ${unknownFirearmIds.join(", ")}`,
    );
  }

  // VALIDATE MATERIAL IDS

  const unknownMaterialIds = firearmsInventory
    .filter(
      (instance) => instance.material_id && !materialDb[instance.material_id],
    )
    .map((instance) => instance.material_id);

  if (unknownMaterialIds.length > 0) {
    throw new Error(
      `[buildFirearmSlots] Unknown material_id(s): ${unknownMaterialIds.join(", ")}`,
    );
  }

  // VALIDATE ENCHANTMENTS

  const enchantmentErrors = validateFirearmEnchantments(
    firearmsInventory,
    enchantmentsDb,
    targetsDb,
  );

  if (enchantmentErrors.length > 0) {
    throw new Error(
      `[buildFirearmSlots] Invalid enchantments:\n${enchantmentErrors.join("\n")}`,
    );
  }

  // BUILD INVENTORY

  // Storage buckets are flat arrays — no slot keying.
  const equipped = buildStorageBucket();
  const stash = buildStorageBucket();
  const camp = buildStorageBucket();
  const backpack = buildStorageBucket();

  let carried_firearms_weight = 0;
  let carried_firearms_value = 0;

  for (const instance of firearmsInventory) {
    const firearm = firearmsDb[instance.weapon_id];

    const material = instance.material_id
      ? materialDb[instance.material_id]
      : null;

    const resolvedFirearm = resolveFirearmWeapon(
      instance,
      firearm,
      material,
      enchantmentsDb,
      targetsDb,
    );

    // EQUIPPED

    if (instance.is_equipped) {
      equipped.push(resolvedFirearm);

      carried_firearms_weight += resolvedFirearm.final_weight;
      carried_firearms_value += resolvedFirearm.total_value;

      continue;
    }

    // STASH

    if (instance.storedAt === "stash") {
      stash.push(resolvedFirearm);

      continue;
    }

    // CAMP

    if (instance.storedAt === "camp") {
      camp.push(resolvedFirearm);

      continue;
    }

    // BACKPACK

    if (instance.storedAt === "backpack") {
      backpack.push(resolvedFirearm);

      carried_firearms_weight += resolvedFirearm.final_weight;
      carried_firearms_value += resolvedFirearm.total_value;
    }
  }

  // TOTALS

  const total_firearms_weight = calculateTotalFirearmsWeight(
    firearmsInventory,
    firearmsDb,
    materialDb,
    enchantmentsDb,
    targetsDb,
  );

  const total_firearms_value = calculateTotalFirearmsValue(
    firearmsInventory,
    firearmsDb,
    materialDb,
    enchantmentsDb,
    targetsDb,
  );

  return {
    equipped,
    stash,
    camp,
    backpack,
    total_firearms_weight,
    carried_firearms_weight,
    total_firearms_value,
    carried_firearms_value,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  buildFirearmSlots,
  VALID_STORED_AT,
  _getFirearmsDB: getFirearmsDB,
  _getMaterialDB: getMaterialsDB,
  _validateFirearmInstance: validateFirearmInstance,
};
