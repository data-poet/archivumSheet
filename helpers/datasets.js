const fs = require("fs");
const path = require("path");
const { loadCSV } = require("./dataUtils.js");

// One filename per dataset the app reads from data/. Renaming, moving or splitting a CSV during a
// dataset revamp is a one-line edit here instead of a grep across engine/ and dev/server.js.
const DATASETS = {
  SKILLS: "db_skills.csv",
  ADVANTAGES: "db_traits_advantages.csv",
  DISADVANTAGES: "db_traits_disadvantages.csv",
  RACES: "db_yrth_races.csv",
  META_RACES: "db_yrth_meta_races.csv",
  ARMORS: "db_equipment_armors.csv",
  SHIELDS: "db_equipment_shields.csv",
  MELEE_WEAPONS: "db_equipment_melee_weapons.csv",
  RANGED_WEAPONS: "db_equipment_ranged_weapons.csv",
  FIREARMS: "db_equipment_firearms_weapons.csv",
  AMMO: "db_equipment_ammo.csv",
  AMMO_CONTAINERS: "db_equipment_ammo_containers.csv",
  ALCHEMY: "db_alchemy_consumables.csv",
  ADVENTURE_GEAR: "db_itens_adventure_gear.csv",
  ACCESSORIES: "db_itens_accessories.csv",
  MAGIC_GEAR: "db_magic_gear.csv",
  ENCHANTMENTS: "db_magic_enchantments.csv",
  GRIMOIRE: "db_magic_grimoire.csv",
  CRAFTING_MATERIALS: "db_crafting_materials.csv",
};

function datasetPath(key) {
  const fileName = DATASETS[key];
  if (!fileName) throw new Error(`[datasets] Unknown dataset key: ${key}`);
  return path.join(process.cwd(), "data", fileName);
}

// Parsed once per file and reused until the file changes on disk (its size or modification time), so a
// sheet build or an API request never re-parses a CSV and an edited CSV is picked up without a restart.
// Callers share the same rows, so they are frozen: copy before changing.
const cache = new Map();

function deepFreeze(rows) {
  rows.forEach((row) => Object.freeze(row));
  return Object.freeze(rows);
}

function loadDataset(key) {
  const file = datasetPath(key);
  const { mtimeMs, size } = fs.statSync(file);
  const stamp = `${mtimeMs}:${size}`;
  const cached = cache.get(file);
  if (cached?.stamp === stamp) return cached.rows;

  const rows = deepFreeze(loadCSV(file));
  cache.set(file, { stamp, rows });
  return rows;
}

module.exports = {
  DATASETS,
  datasetPath,
  loadDataset,
};
