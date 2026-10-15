// Controlled-vocabulary strings matched against CSV columns (damage types, skill
// categories, enchantment attribute targets). Centralized alongside helpers/ids.js
// and helpers/datasets.js so a dataset revamp that renames a category is a one-file edit.

const DAMAGE_TYPES = {
  PERFURACAO: "Perfuração",
  CONTUSAO: "Contusão",
  CORTE: "Corte",
};

// skill_category values that support isTrainedWithMaster and the actions formula.
const MASTER_ELIGIBLE_CATEGORIES = new Set(["Armas e Combate", "Mágicas"]);

// CSV target strings that don't match the engine's internal attribute keys 1:1.
const ATTRIBUTE_TARGET_MAP = {
  "Basic Speed": "BasicSpeed",
};

module.exports = {
  DAMAGE_TYPES,
  MASTER_ELIGIBLE_CATEGORIES,
  ATTRIBUTE_TARGET_MAP,
};
