const path = require("path");

const { loadCSV } = require("../../../../helpers/dataUtils.js");

const { VALID_STORED_AT } = require("./meleeConstants.js");

const { validateMeleeInstance } = require("./meleeValidation.js");

const {
  resolveMeleeWeapons,
  calculateTotalMeleeWeight,
} = require("./meleeResolver.js");

// ─────────────────────────────────────────────────────────────────────────────
// SHIELD DB
// ─────────────────────────────────────────────────────────────────────────────

let _meleeDB = null;

function getMeleeDB() {
  if (_meleeDB) {
    return _meleeDB;
  }

  const filePath = path.join(
    process.cwd(),
    "data",
    "db_equipment_melee_weapons.csv",
  );

  const rows = loadCSV(filePath);

  _meleeDB = {};

  for (const row of rows) {
    _meleeDB[row.weapon_id] = {
      weapon_id: row.weapon_id,

      weapon_box_name: row.weapon_box_name,
      weapon_name: row.weapon_name,
      weapon_skill: row.weapon_skill,
      weapon_type: row.weapon_type,
      weapon_tier: row.weapon_tier,
      weapon_length: row.weapon_length,
      weapon_bal_modifier: Number(row.weapon_bal_modifier),
      weapon_gdp_modifier: Number(row.weapon_gdp_modifier),
      weapon_weight: Number(row.weapon_weight),
      weapon_price: Number(row.weapon_price),
      weapon_hit_points: Number(row.weapon_hit_points),
    };
  }

  return _meleeDB;
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
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

// Shields have no slots — storage buckets are flat arrays.
function buildStorageBucket() {
  return [];
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────

function buildMeleeSlots(meleeInventory = []) {
  const meleeDb = getMeleeDB();

  const materialDb = getMaterialDB();

  // VALIDATE INSTANCES

  const instanceErrors = meleeInventory.flatMap((instance, index) =>
    validateMeleeInstance(instance, index),
  );

  if (instanceErrors.length > 0) {
    throw new Error(
      `[buildMeleeSlots] Invalid melee inventory:\n${instanceErrors.join("\n")}`,
    );
  }

  // VALIDATE MELEE IDS

  const unknownMeleeIds = meleeInventory
    .filter((instance) => !meleeDb[instance.weapon_id])
    .map((instance) => instance.weapon_id);

  if (unknownMeleeIds.length > 0) {
    throw new Error(
      `[buildMeleeSlots] Unknown weapon_id(s): ${unknownMeleeIds.join(", ")}`,
    );
  }

  // VALIDATE MATERIAL IDS

  const unknownMaterialIds = meleeInventory
    .filter(
      (instance) => instance.material_id && !materialDb[instance.material_id],
    )
    .map((instance) => instance.material_id);

  if (unknownMaterialIds.length > 0) {
    throw new Error(
      `[buildMeleeSlots] Unknown material_id(s): ${unknownMaterialIds.join(", ")}`,
    );
  }

  // BUILD INVENTORY

  // Storage buckets are flat arrays — no slot keying.
  const equipped = buildStorageBucket();
  const stash = buildStorageBucket();
  const camp = buildStorageBucket();
  const backpack = buildStorageBucket();

  let carried_melee_weapons_weight = 0;

  for (const instance of meleeInventory) {
    const melee = meleeDb[instance.weapon_id];

    const material = instance.material_id
      ? materialDb[instance.material_id]
      : null;

    const resolvedMelee = resolveMeleeWeapons(instance, melee, material);

    // EQUIPPED

    if (instance.is_equipped) {
      equipped.push(resolvedMelee);

      carried_melee_weapons_weight += resolvedMelee.weapon_final_weight;

      continue;
    }

    // STASH

    if (instance.storedAt === "stash") {
      stash.push(resolvedMelee);

      continue;
    }

    // CAMP

    if (instance.storedAt === "camp") {
      camp.push(resolvedMelee);

      continue;
    }

    // BACKPACK

    if (instance.storedAt === "backpack") {
      backpack.push(resolvedMelee);

      carried_melee_weapons_weight += resolvedMelee.weapon_final_weight;
    }
  }

  // TOTALS

  const total_melee_weight = calculateTotalMeleeWeight(
    meleeInventory,
    meleeDb,
    materialDb,
  );

  return {
    equipped,
    stash,
    camp,
    backpack,
    total_melee_weight,
    carried_melee_weapons_weight,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  buildMeleeSlots,
  VALID_STORED_AT,
  _getMeleeDB: getMeleeDB,
  _getMaterialDB: getMaterialDB,
  _validateMeleeInstance: validateMeleeInstance,
};
