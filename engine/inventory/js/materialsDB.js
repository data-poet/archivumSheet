const path = require("path");

const { loadCSV } = require("../../../helpers/dataUtils.js");

let _materialsDB = null;

function getMaterialsDB() {
  if (_materialsDB) {
    return _materialsDB;
  }

  const csvPath = path.resolve(
    __dirname,
    "../../../data/db_crafting_materials.csv",
  );

  const rows = loadCSV(csvPath);

  _materialsDB = {};

  for (const row of rows) {
    _materialsDB[row.material_id] = {
      material_id: row.material_id,

      material_name: row.material_name,
      material_type: row.material_type,
      material_tier: row.material_tier,
      material_gdp_modifier: Number(row.material_gdp_modifier),
      material_bal_modifier: Number(row.material_bal_modifier),
      material_dr_modifier: Number(row.material_dr_modifier),
      material_atk_effect: row.material_atk_effect,
      material_def_effect: row.material_def_effect,
      material_weight_modifier: Number(row.material_weight_modifier),
      material_price_modifier: Number(row.material_price_modifier),
      material_hit_points_modifier: Number(row.material_hit_points_modifier),
    };
  }

  return _materialsDB;
}

module.exports = {
  getMaterialsDB,
};
