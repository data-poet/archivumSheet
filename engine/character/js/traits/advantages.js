const path = require("path");
const { loadCSV } = require("../../../../helpers/dataUtils.js");

/**
 * Build advantages + total cost
 *
 * EXPECTS:
 * selectedAdvantages = ["ADV-001", "ADV-002"]
 * innateIds = ["ADV-001"]  — these get is_race_innate: true and cost 0
 * enchantmentIds = ["ADV-003"]  — these get is_enchantment: true and cost 0,
 *   from equipped item enchantments (see collectEquippedEnchantments.js).
 *   If an id is somehow in both innateIds and enchantmentIds, innate wins
 *   (is_race_innate takes priority; either way cost is 0).
 */
function buildAdvantages(
  selectedIds = [],
  innateIds = [],
  enchantmentIds = [],
) {
  const filePath = path.join(process.cwd(), "data", "db_traits_advantages.csv");
  const rows = loadCSV(filePath);

  const advantages = {};
  let totalCost = 0;

  for (const row of rows) {
    const id = row.advantage_id;

    if (!selectedIds.includes(id)) continue;

    const isInnate = innateIds.includes(id);
    const isEnchantment = !isInnate && enchantmentIds.includes(id);
    const cost = isInnate || isEnchantment ? 0 : Number(row.advantage_cost);

    advantages[id] = {
      name: row.advantage_name,
      category: row.advantage_type || null,
      points: cost,
      is_race_innate: isInnate,
      is_enchantment: isEnchantment,
    };

    totalCost += cost;
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
