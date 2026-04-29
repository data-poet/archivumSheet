const path = require("path");

const { loadCSV } = require("engine/helpers/dataUtils.js");

/**
 * Build disadvantages + total cost from selected IDs
 */
function buildDisadvantages(selectedIds) {
  // Resolve from project root
  const filePath = path.join(process.cwd(), "data", "db_disadvantages.csv");

  const rows = loadCSV(filePath);

  const disadvantages = {};
  let totalCost = 0;

  for (const row of rows) {
    const id = row.disadvantage_id;

    if (selectedIds.includes(id)) {
      const cost = Number(row.disadvantage_cost);

      disadvantages[id] = cost;
      totalCost += cost;
    }
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
