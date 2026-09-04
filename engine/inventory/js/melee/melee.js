const path = require("path");

const { loadCSV } = require("../../../../helpers/dataUtils.js");

const { VALID_STORED_AT } = require("./meleeConstants.js");

const {
  isMeleeDualUse,
  getRangedCounterpart,
} = require("../shared/dualUseWeapons.js");

const {
  validateMeleeInstance,
  validateMeleeEnchantments,
} = require("./meleeValidation.js");

const {
  resolveMeleeWeapons,
  calculateTotalMeleeWeight,
  calculateTotalMeleeValue,
} = require("./meleeResolver.js");

const { getMaterialsDB } = require("../shared/materialsDB.js");
const { getEnchantmentsDB } = require("../shared/enchantmentsDB.js");
const {
  getEnchantmentTargetsDB,
} = require("../shared/enchantmentTargetsDB.js");

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
      weapon_damage_type: row.weapon_damage_type,
      weapon_min_strength: Number(row.weapon_min_strength),
      weapon_bal_modifier: Number(row.weapon_bal_modifier),
      weapon_gdp_modifier: Number(row.weapon_gdp_modifier),
      weapon_weight: Number(row.weapon_weight),
      weapon_price: Number(row.weapon_price),
      weapon_hit_points: Number(row.weapon_hit_points),
    };
  }

  return _meleeDB;
}

function buildStorageBucket() {
  return [];
}

function buildMeleeSlots(meleeInventory = []) {
  const meleeDb = getMeleeDB();

  const materialDb = getMaterialsDB();

  const enchantmentsDb = getEnchantmentsDB();
  const targetsDb = getEnchantmentTargetsDB();

  const instanceErrors = meleeInventory.flatMap((instance, index) =>
    validateMeleeInstance(instance, index),
  );

  if (instanceErrors.length > 0) {
    throw new Error(
      `[buildMeleeSlots] Invalid melee inventory:\n${instanceErrors.join("\n")}`,
    );
  }

  const unknownMeleeIds = meleeInventory
    .filter((instance) => !meleeDb[instance.weapon_id])
    .map((instance) => instance.weapon_id);

  if (unknownMeleeIds.length > 0) {
    throw new Error(
      `[buildMeleeSlots] Unknown weapon_id(s): ${unknownMeleeIds.join(", ")}`,
    );
  }

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

  const enchantmentErrors = validateMeleeEnchantments(
    meleeInventory,
    enchantmentsDb,
    targetsDb,
  );

  if (enchantmentErrors.length > 0) {
    throw new Error(
      `[buildMeleeSlots] Invalid enchantments:\n${enchantmentErrors.join("\n")}`,
    );
  }

  const equipped = buildStorageBucket();
  const stash = buildStorageBucket();
  const camp = buildStorageBucket();
  const backpack = buildStorageBucket();

  let carried_melee_weapons_weight = 0;
  let carried_melee_weapons_value = 0;

  for (const instance of meleeInventory) {
    const melee = meleeDb[instance.weapon_id];

    const material = instance.material_id
      ? materialDb[instance.material_id]
      : null;

    const resolvedMelee = resolveMeleeWeapons(
      instance,
      melee,
      material,
      enchantmentsDb,
      targetsDb,
    );

    if (instance.is_equipped) {
      equipped.push(resolvedMelee);

      carried_melee_weapons_weight += resolvedMelee.final_weight;
      carried_melee_weapons_value += resolvedMelee.total_value;

      continue;
    }

    if (instance.storedAt === "stash") {
      stash.push(resolvedMelee);

      continue;
    }

    if (instance.storedAt === "camp") {
      camp.push(resolvedMelee);

      continue;
    }

    if (instance.storedAt === "backpack") {
      backpack.push(resolvedMelee);

      carried_melee_weapons_weight += resolvedMelee.final_weight;
      carried_melee_weapons_value += resolvedMelee.total_value;
    }
  }

  const total_melee_weight = calculateTotalMeleeWeight(
    meleeInventory,
    meleeDb,
    materialDb,
    enchantmentsDb,
    targetsDb,
  );

  const total_melee_value = calculateTotalMeleeValue(
    meleeInventory,
    meleeDb,
    materialDb,
    enchantmentsDb,
    targetsDb,
  );

  return {
    equipped,
    stash,
    camp,
    backpack,
    total_melee_weight,
    carried_melee_weapons_weight,
    total_melee_value,
    carried_melee_weapons_value,
  };
}

module.exports = {
  buildMeleeSlots,
  VALID_STORED_AT,
  _getMeleeDB: getMeleeDB,
  _getMaterialDB: getMaterialsDB,
  _validateMeleeInstance: validateMeleeInstance,
  _isMeleeDualUse: isMeleeDualUse,
  _getRangedCounterpart: getRangedCounterpart,
};
