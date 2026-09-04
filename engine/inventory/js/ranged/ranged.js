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

const {
  resolveRangedWeapons,
  calculateTotalRangedWeight,
  calculateTotalRangedValue,
} = require("./rangedResolver.js");

const { getMaterialsDB } = require("../shared/materialsDB.js");
const { getEnchantmentsDB } = require("../shared/enchantmentsDB.js");
const {
  getEnchantmentTargetsDB,
} = require("../shared/enchantmentTargetsDB.js");

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

function buildStorageBucket() {
  return [];
}

function buildRangedSlots(rangedInventory = [], ST = 0) {
  const rangedDb = getRangedDB();

  const materialDb = getMaterialsDB();

  const enchantmentsDb = getEnchantmentsDB();
  const targetsDb = getEnchantmentTargetsDB();

  const instanceErrors = rangedInventory.flatMap((instance, index) =>
    validateRangedInstance(instance, index),
  );

  if (instanceErrors.length > 0) {
    throw new Error(
      `[buildRangedSlots] Invalid ranged inventory:\n${instanceErrors.join("\n")}`,
    );
  }

  const unknownRangedIds = rangedInventory
    .filter((instance) => !rangedDb[instance.weapon_id])
    .map((instance) => instance.weapon_id);

  if (unknownRangedIds.length > 0) {
    throw new Error(
      `[buildMeleeSlots] Unknown weapon_id(s): ${unknownRangedIds.join(", ")}`,
    );
  }

  const unknownMaterialIds = rangedInventory
    .filter(
      (instance) => instance.material_id && !materialDb[instance.material_id],
    )
    .map((instance) => instance.material_id);

  if (unknownMaterialIds.length > 0) {
    throw new Error(
      `[buildRangedSlots] Unknown material_id(s): ${unknownMaterialIds.join(", ")}`,
    );
  }

  const enchantmentErrors = validateRangedEnchantments(
    rangedInventory,
    enchantmentsDb,
    targetsDb,
  );

  if (enchantmentErrors.length > 0) {
    throw new Error(
      `[buildRangedSlots] Invalid enchantments:\n${enchantmentErrors.join("\n")}`,
    );
  }

  const equipped = buildStorageBucket();
  const stash = buildStorageBucket();
  const camp = buildStorageBucket();
  const backpack = buildStorageBucket();

  let carried_ranged_weapons_weight = 0;
  let carried_ranged_weapons_value = 0;

  for (const instance of rangedInventory) {
    const ranged = rangedDb[instance.weapon_id];

    const material = instance.material_id
      ? materialDb[instance.material_id]
      : null;

    const resolvedRanged = resolveRangedWeapons(
      instance,
      ranged,
      material,
      ST,
      enchantmentsDb,
      targetsDb,
    );

    if (instance.is_equipped) {
      equipped.push(resolvedRanged);

      carried_ranged_weapons_weight += resolvedRanged.final_weight;
      carried_ranged_weapons_value += resolvedRanged.total_value;

      continue;
    }

    if (instance.storedAt === "stash") {
      stash.push(resolvedRanged);

      continue;
    }

    if (instance.storedAt === "camp") {
      camp.push(resolvedRanged);

      continue;
    }

    if (instance.storedAt === "backpack") {
      backpack.push(resolvedRanged);

      carried_ranged_weapons_weight += resolvedRanged.final_weight;
      carried_ranged_weapons_value += resolvedRanged.total_value;
    }
  }

  const total_ranged_weight = calculateTotalRangedWeight(
    rangedInventory,
    rangedDb,
    materialDb,
    ST,
    enchantmentsDb,
    targetsDb,
  );

  const total_ranged_value = calculateTotalRangedValue(
    rangedInventory,
    rangedDb,
    materialDb,
    ST,
    enchantmentsDb,
    targetsDb,
  );

  return {
    equipped,
    stash,
    camp,
    backpack,
    total_ranged_weight,
    carried_ranged_weapons_weight,
    total_ranged_value,
    carried_ranged_weapons_value,
  };
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
