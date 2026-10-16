const { loadDataset } = require("../../../../helpers/datasets.js");
const { ELEMENTAL_TYPES } = require("../attributes/elementalResistances");
const { multiplierOf } = require("../shared/multiplierOf");
const { toList } = require("../../../../helpers/rowParsers.js");

const ELEMENT_COLUMN = {
  Fire: "meta_race_fire_damage_multiplier",
  Water: "meta_race_water_damage_multiplier",
  Air: "meta_race_air_damage_multiplier",
  Electricity: "meta_race_electricity_damage_multiplier",
  Earth: "meta_race_earth_damage_multiplier",
  Corrosion: "meta_race_corrosion_damage_multiplier",
  Necrotic: "meta_race_necrotic_damage_multiplier",
  Holy: "meta_race_holy_damage_multiplier",
  Void: "meta_race_void_damage_multiplier",
  Arcane: "meta_race_arcane_damage_multiplier",
};

const ATTRIBUTE_COLUMN = {
  ST: "meta_race_st_modifier",
  DX: "meta_race_dx_modifier",
  IQ: "meta_race_iq_modifier",
  HT: "meta_race_ht_modifier",
};

// Resolves selected meta_race_ids against db_yrth_meta_races.csv. Elemental multipliers from every
// selected row multiply together (and later against race's own multiplier — see
// elementalResistances.js); attribute modifiers and advantage/disadvantage ids sum/union instead,
// same treatment race modifiers already get.
function resolveMetaRaces(metaRaceIds = []) {
  const rows = loadDataset("META_RACES");

  const selectedRows = rows.filter((row) =>
    metaRaceIds.includes(row.meta_race_id),
  );

  const innateAdvantageIds = [];
  const innateDisadvantageIds = [];
  const elementalMultipliers = Object.fromEntries(
    ELEMENTAL_TYPES.map((type) => [type, 1]),
  );
  const attributeModifiers = { ST: 0, DX: 0, IQ: 0, HT: 0 };

  for (const row of selectedRows) {
    innateAdvantageIds.push(...toList(row.meta_race_innate_advantage_id));
    innateDisadvantageIds.push(...toList(row.meta_race_innate_disadvantage_id));

    for (const type of ELEMENTAL_TYPES) {
      elementalMultipliers[type] *= multiplierOf(row[ELEMENT_COLUMN[type]]);
    }

    for (const attr of Object.keys(ATTRIBUTE_COLUMN)) {
      attributeModifiers[attr] += Number(row[ATTRIBUTE_COLUMN[attr]]) || 0;
    }
  }

  return {
    innateAdvantageIds: [...new Set(innateAdvantageIds)],
    innateDisadvantageIds: [...new Set(innateDisadvantageIds)],
    elementalMultipliers,
    attributeModifiers,
  };
}

module.exports = {
  ELEMENT_COLUMN,
  resolveMetaRaces,
};
