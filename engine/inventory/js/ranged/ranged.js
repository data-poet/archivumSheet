const path = require("path");

const { loadCSV } = require("../../../../helpers/dataUtils.js");

const { VALID_STORED_AT } = require("./rangedConstants.js");

const { validateRangedInstance } = require("./rangedValidation.js");

const {
  resolveRangedWeapons,
  calculateTotalRangedWeight,
  calculateTotalRangedValue,
  calculateCarriedRangedValue,
} = require("./rangedResolver.js");

// ─────────────────────────────────────────────────────────────────────────────
// RANGED DB
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// MATERIAL DB
// ─────────────────────────────────────────────────────────────────────────────

let _materialDB = null;

function getMaterialDB() {
  if (_materialDB) {
    return _materialDB;
  }

  const filePath = path.join(
    process.cwd(),
    "data",
    "db_crafting_materials.csv",
  );

  const rows = loadCSV(filePath);

  _materialDB = {};

  for (const row of rows) {
    _materialDB[row.material_id] = {
      material_id: row.material_id,

      material_name: row.material_name,
      material_type: row.material_type,
      material_tier: row.material_tier,
      material_bal_modifier: Number(row.material_bal_modifier || 0),
      material_gdp_modifier: Number(row.material_gdp_modifier || 0),
      material_dr_modifier: Number(row.material_dr_modifier || 0),
      material_atk_effect: row.material_atk_effect || null,
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
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

// Shields have no slots — storage buckets are flat arrays.
function buildStorageBucket() {
  return [];
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────

function buildRangedSlots(rangedInventory = [], ST = 0) {
  const rangedDb = getRangedDB();

  const materialDb = getMaterialDB();

  // VALIDATE INSTANCES

  const instanceErrors = rangedInventory.flatMap((instance, index) =>
    validateRangedInstance(instance, index),
  );

  if (instanceErrors.length > 0) {
    throw new Error(
      `[buildRangedSlots] Invalid ranged inventory:\n${instanceErrors.join("\n")}`,
    );
  }

  // VALIDATE RANGED IDS

  const unknownRangedIds = rangedInventory
    .filter((instance) => !rangedDb[instance.weapon_id])
    .map((instance) => instance.weapon_id);

  if (unknownRangedIds.length > 0) {
    throw new Error(
      `[buildMeleeSlots] Unknown weapon_id(s): ${unknownRangedIds.join(", ")}`,
    );
  }

  // VALIDATE MATERIAL IDS

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

  // BUILD INVENTORY

  // Storage buckets are flat arrays — no slot keying.
  const equipped = buildStorageBucket();
  const stash = buildStorageBucket();
  const camp = buildStorageBucket();
  const backpack = buildStorageBucket();

  let carried_ranged_weapons_weight = 0;
  let carried_ranged_weapons_value  = 0;

  for (const instance of rangedInventory) {
    const ranged = rangedDb[instance.weapon_id];

    const material = instance.material_id
      ? materialDb[instance.material_id]
      : null;

    const resolvedRanged = resolveRangedWeapons(instance, ranged, material, ST);

    // EQUIPPED

    if (instance.is_equipped) {
      equipped.push(resolvedRanged);

      carried_ranged_weapons_weight += resolvedRanged.weapon_final_weight;
      carried_ranged_weapons_value  += resolvedRanged.total_value;

      continue;
    }

    // STASH

    if (instance.storedAt === "stash") {
      stash.push(resolvedRanged);

      continue;
    }

    // CAMP

    if (instance.storedAt === "camp") {
      camp.push(resolvedRanged);

      continue;
    }

    // BACKPACK

    if (instance.storedAt === "backpack") {
      backpack.push(resolvedRanged);

      carried_ranged_weapons_weight += resolvedRanged.weapon_final_weight;
      carried_ranged_weapons_value  += resolvedRanged.total_value;
    }
  }

  // TOTALS

  const total_ranged_weight = calculateTotalRangedWeight(
    rangedInventory,
    rangedDb,
    materialDb,
    ST,
  );

  const total_ranged_value = calculateTotalRangedValue(
    rangedInventory,
    rangedDb,
    materialDb,
    ST,
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

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  buildRangedSlots,
  VALID_STORED_AT,
  _getRangedDB: getRangedDB,
  _getMaterialDB: getMaterialDB,
  _validateRangedInstance: validateRangedInstance,
};
