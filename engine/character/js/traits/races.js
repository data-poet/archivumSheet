const { loadDataset } = require("../../../../helpers/datasets.js");
const { ELEMENTAL_TYPES } = require("../attributes/elementalResistances");
const { multiplierOf } = require("../shared/multiplierOf");
const { toList } = require("../../../../helpers/rowParsers.js");

const MODIFIER_COLUMNS = {
  ST: "race_st_modifier",
  DX: "race_dx_modifier",
  IQ: "race_iq_modifier",
  HT: "race_ht_modifier",
};

const multiplierColumn = (type) =>
  `race_${type.toLowerCase()}_damage_multiplier`;

// Builds what the rest of the engine reads about a race from its db_yrth_races.csv row. {} when there is no
// race (none chosen, or an id the dataset no longer has).
function resolveRace(raceId) {
  const row = raceId
    ? loadDataset("RACES").find((r) => r.race_id === raceId)
    : null;
  if (!row) return {};

  return {
    race_id: row.race_id,
    race_name: row.race_name,
    race_sub_name: row.race_sub_name || null,
    race_physical_maturity: row.race_physical_maturity || null,
    race_mental_maturity: row.race_mental_maturity || null,
    race_life_expectancy: row.race_life_expectancy || null,
    modifiers: Object.fromEntries(
      Object.entries(MODIFIER_COLUMNS).map(([attr, column]) => [
        attr,
        Number(row[column]) || 0,
      ]),
    ),
    elemental_modifiers: Object.fromEntries(
      ELEMENTAL_TYPES.map((type) => [
        type,
        multiplierOf(row[multiplierColumn(type)]),
      ]),
    ),
    innate_advantage_ids: toList(row.race_innate_advantage_id),
    innate_disadvantage_ids: toList(row.race_innate_disadvantage_id),
    innate_advantage_names: toList(row.race_innate_advantage_name),
    innate_disadvantage_names: toList(row.race_innate_disadvantage_name),
  };
}

// A race in the dataset is always read fresh from it, so a stored snapshot never goes stale; a snapshot of
// a race the dataset does not have (a custom ally race) is used as it is.
function pickRace({ race_id = null, race = null } = {}) {
  const fromDataset = resolveRace(race_id ?? race?.race_id);
  return fromDataset.race_id ? fromDataset : (race ?? {});
}

module.exports = { resolveRace, pickRace, multiplierColumn };
