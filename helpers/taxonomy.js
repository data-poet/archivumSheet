// Controlled-vocabulary strings matched against CSV columns (damage types, skill
// categories, enchantment attribute targets). Centralized alongside helpers/ids.js
// and helpers/datasets.js so a dataset revamp that renames a category is a one-file edit.

// GURPS 4e damage types (sigla used in weapon_damage_type cells, see B16/B271).
const DAMAGE_TYPES = {
  CRUSHING: "cr",
  CUTTING: "cut",
  IMPALING: "imp",
  PIERCING_SMALL: "pi-",
  PIERCING: "pi",
  PIERCING_LARGE: "pi+",
  PIERCING_HUGE: "pi++",
};

// Only crushing and cutting roll off swing (BAL); every other type rolls off thrust (GDP),
// or a dice value defined directly on the weapon row (e.g. firearms' weapon_gdp_dice).
const BAL_DAMAGE_TYPES = [DAMAGE_TYPES.CRUSHING, DAMAGE_TYPES.CUTTING];

// skill_category values that support isTrainedWithMaster and the actions formula.
const MASTER_ELIGIBLE_CATEGORIES = new Set(["Armas e Combate", "Mágicas"]);

// CSV target strings that don't match the engine's internal attribute keys 1:1.
const ATTRIBUTE_TARGET_MAP = {
  "Basic Speed": "BasicSpeed",
};

module.exports = {
  DAMAGE_TYPES,
  BAL_DAMAGE_TYPES,
  MASTER_ELIGIBLE_CATEGORIES,
  ATTRIBUTE_TARGET_MAP,
};
