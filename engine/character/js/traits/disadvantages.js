const path = require("path");
const { loadCSV } = require("../../../../helpers/dataUtils.js");

/**
 * Build disadvantages + total cost from selected IDs
 *
 * EXPECTS:
 * selectedIds = ["DIS-001", "DIS-002"]
 * innateIds = ["DIS-001"]  — these get is_race_innate: true and cost 0
 */
function buildDisadvantages(selectedIds = [], innateIds = []) {
  const filePath = path.join(
    process.cwd(),
    "data",
    "db_traits_disadvantages.csv",
  );

  const rows = loadCSV(filePath);

  const disadvantages = {};
  let totalCost = 0;

  for (const row of rows) {
    const id = row.disadvantage_id;

    if (!selectedIds.includes(id)) continue;

    const isInnate = innateIds.includes(id);
    const cost = isInnate ? 0 : Number(row.disadvantage_cost);

    disadvantages[id] = {
      name: row.disadvantage_name,
      category: row.disadvantage_type || null,
      points: cost,
      is_race_innate: isInnate,
    };

    totalCost += cost;
  }

  return {
    disadvantages,
    character_points: {
      disadvantages: totalCost,
    },
  };
}

module.exports = {
  buildDisadvantages,
};
