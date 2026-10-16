// Cross-cutting entity ids the engine hardcodes outside the generic CSV row lookups
// (see helpers/datasets.js for those). Centralized so a dataset id remap is a one-file edit.

// Only the highest-ranked id in each tier group applies — they're mutually exclusive tiers of the same trait.
const WILL_BONUS_TIERS = {
  "ADV-088": 1,
  "ADV-089": 2,
  "ADV-090": 3,
  "ADV-091": 4,
  "ADV-092": 5,
};

const WILL_PENALTY_TIERS = {
  "DIS-100": 1,
  "DIS-101": 2,
  "DIS-102": 3,
  "DIS-103": 4,
  "DIS-104": 5,
};

const HEARING_BONUS_TIERS = {
  "ADV-021": 1,
  "ADV-022": 2,
  "ADV-023": 3,
  "ADV-024": 4,
  "ADV-025": 5,
};

const SMELL_BONUS_TIERS = {
  "ADV-026": 1,
  "ADV-027": 2,
  "ADV-028": 3,
  "ADV-029": 4,
  "ADV-030": 5,
};

const VISION_BONUS_TIERS = {
  "ADV-037": 1,
  "ADV-038": 2,
  "ADV-039": 3,
  "ADV-040": 4,
  "ADV-041": 5,
};

const FULL_SENSE_BONUS_TIERS = {
  "ADV-031": 1,
  "ADV-032": 2,
  "ADV-033": 3,
  "ADV-034": 4,
  "ADV-035": 5,
};

const REFLEXOS_EM_COMBATE_ID = "ADV-055";

// Only the highest-ranked advantage in the group applies — they're mutually exclusive tiers of the same trait.
const MAGIC_APTITUDE_TIERS = {
  "ADV-063": 1,
  "ADV-064": 2,
  "ADV-065": 3,
};

const BROQUEL_SKILL_ID = "SKILL-045";
const ESCUDO_SKILL_ID = "SKILL-082";

// Shield ids that use BROQUEL skill for block (the rest use ESCUDO).
const BROQUEL_SHIELD_IDS = new Set([
  "SHIELD-000",
  "SHIELD-001",
  "SHIELD-002",
  "SHIELD-003",
  "SHIELD-004",
]);

// has_magic_return (rangedResolver.js) keys off this id, not effect_type.
const MAGIC_RETURN_ENCHANTMENT_ID = "ENCHANTMENT-068";

// Weapons that appear in both the melee and ranged tables and are auto-mirrored
// across them. Pairs listed as [meleeId, rangedId] for each tier (Comum → Obra-Prima).
const DUAL_USE_WEAPON_PAIRS = [
  // Lança de Mão
  ["MELEE-215", "RANGED-050"],
  ["MELEE-216", "RANGED-051"],
  ["MELEE-217", "RANGED-052"],
  ["MELEE-218", "RANGED-053"],
  ["MELEE-219", "RANGED-054"],

  // Lança de Arremesso
  ["MELEE-220", "RANGED-055"],
  ["MELEE-221", "RANGED-056"],
  ["MELEE-222", "RANGED-057"],
  ["MELEE-223", "RANGED-058"],
  ["MELEE-224", "RANGED-059"],

  // Machadinha
  ["MELEE-280", "RANGED-005"],
  ["MELEE-281", "RANGED-006"],
  ["MELEE-282", "RANGED-007"],
  ["MELEE-283", "RANGED-008"],
  ["MELEE-284", "RANGED-009"],

  // Machado de Arremesso
  ["MELEE-285", "RANGED-010"],
  ["MELEE-286", "RANGED-011"],
  ["MELEE-287", "RANGED-012"],
  ["MELEE-288", "RANGED-013"],
  ["MELEE-289", "RANGED-014"],
];

module.exports = {
  WILL_BONUS_TIERS,
  WILL_PENALTY_TIERS,
  HEARING_BONUS_TIERS,
  SMELL_BONUS_TIERS,
  VISION_BONUS_TIERS,
  FULL_SENSE_BONUS_TIERS,
  REFLEXOS_EM_COMBATE_ID,
  MAGIC_APTITUDE_TIERS,
  BROQUEL_SKILL_ID,
  ESCUDO_SKILL_ID,
  BROQUEL_SHIELD_IDS,
  MAGIC_RETURN_ENCHANTMENT_ID,
  DUAL_USE_WEAPON_PAIRS,
};
