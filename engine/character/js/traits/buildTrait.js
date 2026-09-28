const path = require("path");
const { loadCSV } = require("../../../../helpers/dataUtils.js");

// Precedence when an id qualifies from more than one free-grant source (cost is 0 either way,
// this only decides which badge shows): race-innate → meta-race → enchantment.
function buildTrait({
  csvFileName,
  idField,
  nameField,
  typeField,
  costField,
  resultKey,
  pointsKey,
  selectedIds = [],
  innateIds = [],
  enchantmentIds = [],
  metaRaceIds = [],
}) {
  const filePath = path.join(process.cwd(), "data", csvFileName);
  const rows = loadCSV(filePath);

  const traits = {};
  let totalCost = 0;

  for (const row of rows) {
    const id = row[idField];

    if (!selectedIds.includes(id)) continue;

    const isInnate = innateIds.includes(id);
    const isMetaRace = !isInnate && metaRaceIds.includes(id);
    const isEnchantment =
      !isInnate && !isMetaRace && enchantmentIds.includes(id);
    const cost =
      isInnate || isMetaRace || isEnchantment ? 0 : Number(row[costField]);

    traits[id] = {
      name: row[nameField],
      category: row[typeField] || null,
      points: cost,
      is_race_innate: isInnate,
      is_meta_race: isMetaRace,
      is_enchantment: isEnchantment,
    };

    totalCost += cost;
  }

  return {
    [resultKey]: traits,
    character_points: {
      [pointsKey]: totalCost,
    },
  };
}

module.exports = {
  buildTrait,
};
