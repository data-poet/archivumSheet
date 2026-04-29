const path = require("path");

const { loadCSV } = require("../../../helpers/dataUtils.js");

/**
 * Build advantages + total cost from selected IDs
 */
function buildAdvantages(selectedIds) {
  // Resolve from project root
  const filePath = path.join(process.cwd(), "data", "db_advantages.csv");

  const rows = loadCSV(filePath);

  const advantages = {};
  let totalCost = 0;

  for (const row of rows) {
    const id = row.advantage_id;

    if (selectedIds.includes(id)) {
      const cost = Number(row.advantage_cost);

      advantages[id] = cost;
      totalCost += cost;
    }
  }

  return {
    advantages,
    character_points: {
      advantages: totalCost,
    },
  };
}

module.exports = {
  buildAdvantages,
};
