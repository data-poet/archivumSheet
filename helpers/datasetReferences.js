// Columns whose cells hold ids of another dataset. `check:data` verifies them and
// `scripts/remapReferences.js` repoints them when the target dataset is renumbered.
const WEAPON_DATASETS = ["MELEE_WEAPONS", "RANGED_WEAPONS", "FIREARMS"];

const REFERENCES = [
  ...WEAPON_DATASETS.map((dataset) => ({
    dataset,
    column: "weapon_skill_id",
    target: "SKILLS",
  })),
  {
    dataset: "RACES",
    column: "race_innate_advantage_id",
    target: "ADVANTAGES",
  },
  {
    dataset: "RACES",
    column: "race_innate_disadvantage_id",
    target: "DISADVANTAGES",
  },
  {
    dataset: "META_RACES",
    column: "meta_race_innate_advantage_id",
    target: "ADVANTAGES",
  },
  {
    dataset: "META_RACES",
    column: "meta_race_innate_disadvantage_id",
    target: "DISADVANTAGES",
  },
  // "SKILL-044:-2;SKILL-095:-3": the ids are the parts before each colon.
  { dataset: "SKILLS", column: "skill_defaults", target: "SKILLS" },
];

const ID_TOKEN = /[A-Z][A-Z_]*(?:-[A-Z]+)*-\d{3,4}/g;

function idsInCell(cell) {
  return String(cell ?? "").match(ID_TOKEN) ?? [];
}

// Replaces every id in the cell through `mapId`, keeping separators and spacing as they were.
function mapIdsInCell(cell, mapId) {
  return String(cell ?? "").replace(ID_TOKEN, (id) => mapId(id) ?? id);
}

module.exports = { REFERENCES, idsInCell, mapIdsInCell };
