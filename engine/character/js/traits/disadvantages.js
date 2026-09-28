const { buildTrait } = require("./buildTrait.js");

function buildDisadvantages(
  selectedIds = [],
  innateIds = [],
  enchantmentIds = [],
  metaRaceIds = [],
) {
  return buildTrait({
    csvFileName: "db_traits_disadvantages.csv",
    idField: "disadvantage_id",
    nameField: "disadvantage_name",
    typeField: "disadvantage_type",
    costField: "disadvantage_cost",
    resultKey: "disadvantages",
    pointsKey: "disadvantages",
    selectedIds,
    innateIds,
    enchantmentIds,
    metaRaceIds,
  });
}

module.exports = {
  buildDisadvantages,
};
