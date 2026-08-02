const path = require("path");
const { loadCSV } = require("../../../../helpers/dataUtils.js");

/**
 * Build disadvantages + total cost from selected IDs
 *
 * EXPECTS:
 * selectedIds = ["DIS-001", "DIS-002"]
 * innateIds = ["DIS-001"]  — these get is_race_innate: true and cost 0
 * enchantmentIds = ["DIS-002"]  — these get is_enchantment: true and cost 0,
 *   from equipped item enchantments (see collectEquippedEnchantments.js).
 */
function buildDisadvantages(
  selectedIds = [],
  innateIds = [],
  enchantmentIds = [],
) {
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
    const isEnchantment = !isInnate && enchantmentIds.includes(id);
    const cost = isInnate || isEnchantment ? 0 : Number(row.disadvantage_cost);

    disadvantages[id] = {
      name: row.disadvantage_name,
      category: row.disadvantage_type || null,
      points: cost,
      is_race_innate: isInnate,
      is_enchantment: isEnchantment,
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
