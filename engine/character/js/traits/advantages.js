const { buildTrait } = require("./buildTrait.js");

function buildAdvantages(
  selectedIds = [],
  innateIds = [],
  enchantmentIds = [],
  metaRaceIds = [],
) {
  return buildTrait({
    datasetKey: "ADVANTAGES",
    idField: "advantage_id",
    nameField: "advantage_name",
    typeField: "advantage_type",
    costField: "advantage_cost",
    resultKey: "advantages",
    pointsKey: "advantages",
    selectedIds,
    innateIds,
    enchantmentIds,
    metaRaceIds,
  });
}

module.exports = {
  buildAdvantages,
};
