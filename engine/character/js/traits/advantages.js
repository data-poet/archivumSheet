const path = require("path");
const { loadCSV } = require("../../../../helpers/dataUtils.js");

// Precedence when an id qualifies from more than one free-grant source (cost is 0 either way,
// this only decides which badge shows): race-innate → meta-race → enchantment.
function buildAdvantages(
  selectedIds = [],
  innateIds = [],
  enchantmentIds = [],
  metaRaceIds = [],
) {
  const filePath = path.join(process.cwd(), "data", "db_traits_advantages.csv");
  const rows = loadCSV(filePath);

  const advantages = {};
  let totalCost = 0;

  for (const row of rows) {
    const id = row.advantage_id;

    if (!selectedIds.includes(id)) continue;

    const isInnate = innateIds.includes(id);
    const isMetaRace = !isInnate && metaRaceIds.includes(id);
    const isEnchantment =
      !isInnate && !isMetaRace && enchantmentIds.includes(id);
    const cost =
      isInnate || isMetaRace || isEnchantment ? 0 : Number(row.advantage_cost);

    advantages[id] = {
      name: row.advantage_name,
      category: row.advantage_type || null,
      points: cost,
      is_race_innate: isInnate,
      is_meta_race: isMetaRace,
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
