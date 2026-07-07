// ─────────────────────────────────────────────────────────────────────────────
// MATERIALS DB
//
// Single shared loader for db_crafting_materials.csv, used by every
// inventory category that supports material overrides (armor, shield,
// melee, ranged). Previously each of those files kept its own private,
// near-identical copy of this loader — consolidated here so there is one
// cache and one place to update if the material schema changes.
// ─────────────────────────────────────────────────────────────────────────────

const path = require("path");

const { loadCSV } = require("../../../../helpers/dataUtils.js");

let _materialsDB = null;

function getMaterialsDB() {
  if (_materialsDB) {
    return _materialsDB;
  }

  const filePath = path.join(
    process.cwd(),
    "data",
    "db_crafting_materials.csv",
  );

  const rows = loadCSV(filePath);

  _materialsDB = {};

  for (const row of rows) {
    _materialsDB[row.material_id] = {
      material_id: row.material_id,

      material_name: row.material_name,
      material_type: row.material_type,
      material_tier: row.material_tier,
      material_gdp_modifier: Number(row.material_gdp_modifier || 0),
      material_bal_modifier: Number(row.material_bal_modifier || 0),
      material_dr_modifier: Number(row.material_dr_modifier || 0),
      material_atk_effect: row.material_atk_effect || null,
      material_def_effect: row.material_def_effect || null,
      material_weight_modifier: Number(row.material_weight_modifier || 1),
      material_price_modifier: Number(row.material_price_modifier || 1),
      material_hit_points_modifier: Number(
        row.material_hit_points_modifier || 0,
      ),
    };
  }

  return _materialsDB;
}

module.exports = {
  getMaterialsDB,
};
