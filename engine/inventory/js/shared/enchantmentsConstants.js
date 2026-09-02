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

// Phase 2 (armor). Unlike ATTRIBUTE_EFFECT_TYPES, `value` here modifies the
// ITEM's own stats (weight), not a character attribute — no target at all,
// picked or fixed. enchantment_is_percentage is TRUE for these two: value
// is a decimal fraction (0.1 = 10%) applied against the item's own
// (post-material) weight, not an absolute unit — see armorResolver.js.
const WEIGHT_EFFECT_TYPES = ["add_weight", "remove_weight"];

// Phase 2 (armor). Same "modifies the item itself" shape as
// WEIGHT_EFFECT_TYPES, but flat (enchantment_is_percentage is FALSE) —
// value adds directly to the item's own damage resistance stat.
const DAMAGE_RESISTANCE_EFFECT_TYPES = [
  "fortify_damage_resistance",
  "weaken_damage_resistance",
];

// Phase 2 (armor). Modifies a CHARACTER-level elemental resistance (Fire,
// Ice, ...), same enchantment_modifier bridge as ATTRIBUTE_EFFECT_TYPES use
// for primary/secondary attributes — see collectEquippedEnchantments.js.
// Non-parametric: which element a row affects is baked into that row's own
// enchantment_target (Fire/Ice/...), not player-picked, same convention as
// the fixed attribute targets in ATTRIBUTE_EFFECT_TYPES rows.
// enchantment_is_percentage is TRUE — value is a decimal fraction (0.05 =
// 5%) added directly to the resistance's enchantment_modifier.
const ELEMENTAL_RESISTANCE_EFFECT_TYPES = [
  "fortify_resistance",
  "weaken_resistance",
];

// Every effect type whose application entry carries a magnitude `value`
// (as opposed to POINT_EFFECT_TYPES' `target` or DIFFICULTY_EFFECT_TYPES'
// `target` + `extraPoints`). Shared by resolveEnchantmentPrice's
// base_price + extraSteps × price_per_extra_value formula, which is
// identical across all five of these groups — only the DB-defined
// base_value/step magnitudes differ (whole numbers for
// attribute/damage-resistance, decimal fractions for
// weight/elemental-resistance).
const VALUE_EFFECT_TYPES = [
  ...ATTRIBUTE_EFFECT_TYPES,
  ...WEIGHT_EFFECT_TYPES,
  ...DAMAGE_RESISTANCE_EFFECT_TYPES,
  ...ELEMENTAL_RESISTANCE_EFFECT_TYPES,
];

// Sign convention (applies to attribute/weight/damage-resistance/
// elemental-resistance `value` AND skill/spell `extraPoints`): fortify
// types must be positive, weaken types negative. "skill"/"spell" (the
// ADD/grant type, no fortify/weaken prefix) are NOT in either group —
// their extraPoints stays unsigned ≥ 0, since granting isn't a direction,
// just an investment above the granted base level.
const FORTIFY_EFFECT_TYPES = [
  "fortify_attribute",
  "fortify_skill",
  "fortify_spell",
  "add_weight",
  "fortify_damage_resistance",
  "fortify_resistance",
];
const WEAKEN_EFFECT_TYPES = [
  "weaken_attribute",
  "weaken_skill",
  "weaken_spell",
  "remove_weight",
  "weaken_damage_resistance",
  "weaken_resistance",
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
  VALUE_EFFECT_TYPES,
  FORTIFY_EFFECT_TYPES,
  WEAKEN_EFFECT_TYPES,
  DIFFICULTY_TIER,
};
