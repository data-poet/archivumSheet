const path = require("path");
const { loadCSV } = require("../../../helpers/dataUtils.js");

/**
 * Build disadvantages + total cost from selected IDs
 *
 * EXPECTS:
 * selectedIds = ["DIS-001", "DIS-002"]
 */
function buildDisadvantages(selectedIds = []) {
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

    const cost = Number(row.disadvantage_cost);

    disadvantages[id] = {
      name: row.disadvantage_name,
      category: row.disadvantage_type || null,
      points: cost,
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
