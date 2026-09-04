// Groups db_magic_enchantments.csv's enchantment_effect_type values by how they're priced/resolved.

const ATTRIBUTE_EFFECT_TYPES = ["fortify_attribute", "weaken_attribute"];

// Price scales with the picked trait's own point cost.
const POINT_EFFECT_TYPES = ["advantage", "disadvantage"];

const SKILL_EFFECT_TYPES = ["skill", "fortify_skill", "weaken_skill"];

// target is a player-picked spell name, not a spell_id — see enchantmentTargetsDB.js.
const SPELL_EFFECT_TYPES = ["spell", "fortify_spell", "weaken_spell"];

// skills + spells share the same F/M/D/MD pricing formula.
const DIFFICULTY_EFFECT_TYPES = [...SKILL_EFFECT_TYPES, ...SPELL_EFFECT_TYPES];

// Modifies the item's own weight, not a character attribute; value is a decimal fraction (0.1 = 10%) of post-material weight — see armorResolver.js.
const WEIGHT_EFFECT_TYPES = ["add_weight", "remove_weight"];

// Same "modifies the item itself" shape as WEIGHT_EFFECT_TYPES, but flat (not a percentage).
const DAMAGE_RESISTANCE_EFFECT_TYPES = [
  "fortify_damage_resistance",
  "weaken_damage_resistance",
];

// Modifies a CHARACTER-level elemental resistance; which element is fixed per DB row, not player-picked — see collectEquippedEnchantments.js. Value is a decimal fraction (0.05 = 5%).
const ELEMENTAL_RESISTANCE_EFFECT_TYPES = [
  "fortify_resistance",
  "weaken_resistance",
];

// Targets a fixed weapon damage stat (BAL/GDP), flat like damage-resistance.
const DAMAGE_EFFECT_TYPES = ["fortify_damage", "weaken_damage"];

// Modifies a fixed weapon requisite stat (Min Strength/PREC/TR); "add"/"remove" naming but same signed-magnitude shape as fortify/weaken.
const REQUISITE_EFFECT_TYPES = ["add_requisite", "remove_requisite"];

// Presence/absence on the item IS the effect — no value/target/extraPoints, so it's excluded from VALUE_EFFECT_TYPES' price formula.
const FLAT_EFFECT_TYPES = ["special_effect"];

// Effect types whose entry carries a magnitude `value` (vs. POINT_EFFECT_TYPES' `target` or DIFFICULTY_EFFECT_TYPES' `target`+`extraPoints`); share one price formula in resolveEnchantmentPrice.
const VALUE_EFFECT_TYPES = [
  ...ATTRIBUTE_EFFECT_TYPES,
  ...WEIGHT_EFFECT_TYPES,
  ...DAMAGE_RESISTANCE_EFFECT_TYPES,
  ...ELEMENTAL_RESISTANCE_EFFECT_TYPES,
  ...DAMAGE_EFFECT_TYPES,
  ...REQUISITE_EFFECT_TYPES,
];

// fortify/add types must be positive, weaken/remove negative. "skill"/"spell" grants aren't in either group — their extraPoints is unsigned, not a direction.
const FORTIFY_EFFECT_TYPES = [
  "fortify_attribute",
  "fortify_skill",
  "fortify_spell",
  "add_weight",
  "fortify_damage_resistance",
  "fortify_resistance",
  "fortify_damage",
  "add_requisite",
];
const WEAKEN_EFFECT_TYPES = [
  "weaken_attribute",
  "weaken_skill",
  "weaken_spell",
  "remove_weight",
  "weaken_damage_resistance",
  "weaken_resistance",
  "weaken_damage",
  "remove_requisite",
];

const DIFFICULTY_TIER = {
  F: 1,
  M: 2,
  D: 3,
  MD: 4,
};

module.exports = {
  ATTRIBUTE_EFFECT_TYPES,
  POINT_EFFECT_TYPES,
  SKILL_EFFECT_TYPES,
  SPELL_EFFECT_TYPES,
  DIFFICULTY_EFFECT_TYPES,
  WEIGHT_EFFECT_TYPES,
  DAMAGE_RESISTANCE_EFFECT_TYPES,
  ELEMENTAL_RESISTANCE_EFFECT_TYPES,
  DAMAGE_EFFECT_TYPES,
  REQUISITE_EFFECT_TYPES,
  FLAT_EFFECT_TYPES,
  VALUE_EFFECT_TYPES,
  FORTIFY_EFFECT_TYPES,
  WEAKEN_EFFECT_TYPES,
  DIFFICULTY_TIER,
};
