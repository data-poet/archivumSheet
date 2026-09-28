const path = require("path");
const { loadCSV } = require("../../../../helpers/dataUtils.js");

// Precedence when an id qualifies from more than one free-grant source (cost is 0 either way,
// this only decides which badge shows): race-innate → meta-race → enchantment.
function buildDisadvantages(
  selectedIds = [],
  innateIds = [],
  enchantmentIds = [],
  metaRaceIds = [],
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
    const isMetaRace = !isInnate && metaRaceIds.includes(id);
    const isEnchantment =
      !isInnate && !isMetaRace && enchantmentIds.includes(id);
    const cost =
      isInnate || isMetaRace || isEnchantment
        ? 0
        : Number(row.disadvantage_cost);

    disadvantages[id] = {
      name: row.disadvantage_name,
      category: row.disadvantage_type || null,
      points: cost,
      is_race_innate: isInnate,
      is_meta_race: isMetaRace,
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
