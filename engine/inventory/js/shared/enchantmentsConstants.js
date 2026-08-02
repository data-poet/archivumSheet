// ─────────────────────────────────────────────────────────────────────────────
// ENCHANTMENTS CONSTANTS
//
// Groups db_magic_enchantments.csv's enchantment_effect_type values by how
// they're priced/resolved, plus the F/M/D/MD -> tier index used for
// skill/spell pricing.
// ─────────────────────────────────────────────────────────────────────────────

// value is a magnitude on a fixed (DB-defined) attribute target
const ATTRIBUTE_EFFECT_TYPES = ["fortify_attribute", "weaken_attribute"];

// target is a player-picked advantage/disadvantage id; price scales with
// that trait's own point cost
const POINT_EFFECT_TYPES = ["advantage", "disadvantage"];

// target is a player-picked skill_id
const SKILL_EFFECT_TYPES = ["skill", "fortify_skill", "weaken_skill"];

// target is a player-picked spell name (see enchantmentTargetsDB.js for why
// this is a name, not a spell_id)
const SPELL_EFFECT_TYPES = ["spell", "fortify_spell", "weaken_spell"];

// skills + spells share the same F/M/D/MD pricing formula
const DIFFICULTY_EFFECT_TYPES = [...SKILL_EFFECT_TYPES, ...SPELL_EFFECT_TYPES];

// Sign convention (applies to attribute `value` AND skill/spell
// `extraPoints`): fortify types must be a positive integer, weaken types a
// negative integer. "skill"/"spell" (the ADD/grant type, no fortify/weaken
// prefix) are NOT in either group — their extraPoints stays unsigned ≥ 0,
// since granting isn't a direction, just an investment above the granted
// base level.
const FORTIFY_EFFECT_TYPES = [
  "fortify_attribute",
  "fortify_skill",
  "fortify_spell",
];
const WEAKEN_EFFECT_TYPES = [
  "weaken_attribute",
  "weaken_skill",
  "weaken_spell",
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
  FORTIFY_EFFECT_TYPES,
  WEAKEN_EFFECT_TYPES,
  DIFFICULTY_TIER,
};
