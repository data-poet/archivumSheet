// Ids the engine needs for rules that describe particular rows. They are looked up from the datasets by
// stable key (see helpers/ruleKeys.js), so renumbering or reordering a dataset changes nothing here.
const { resolveRuleKeys } = require("./ruleKeys.js");

const resolved = resolveRuleKeys();

// A rule whose key vanished from the data stays inactive instead of crashing the server;
// `npm run check:data` and tests/data/ids.test.js report it.
const UNRESOLVED_RULE_KEYS = [...resolved.missing, ...resolved.unregistered];

// Only the highest-ranked id in each tier group applies: they are mutually exclusive tiers of one trait.
const {
  WILL_BONUS_TIERS,
  WILL_PENALTY_TIERS,
  HEARING_BONUS_TIERS,
  SMELL_BONUS_TIERS,
  VISION_BONUS_TIERS,
  FULL_SENSE_BONUS_TIERS,
  MAGIC_APTITUDE_TIERS,
} = resolved.tierGroups;

const {
  REFLEXOS_EM_COMBATE_ID,
  BROQUEL_SKILL_ID,
  ESCUDO_SKILL_ID,
  MAGIC_RETURN_ENCHANTMENT_ID,
} = resolved.singles;

// Shield ids that use the BROQUEL skill for block (the rest use ESCUDO).
const BROQUEL_SHIELD_IDS = new Set(resolved.broquelShieldIds);

// Immunity trait ids by key, only for the keys that have a row; the rest are listed as pending.
const IMMUNITY_TRAIT_IDS = resolved.immunityTraitIds;
const PENDING_IMMUNITY_KEYS = resolved.pendingImmunityKeys;

// Weapons present in both the melee and ranged tables (same weapon_key) are auto-mirrored across them.
// Pairs are [meleeId, rangedId].
const DUAL_USE_WEAPON_PAIRS = resolved.dualUsePairs;

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
  IMMUNITY_TRAIT_IDS,
  PENDING_IMMUNITY_KEYS,
  DUAL_USE_WEAPON_PAIRS,
  UNRESOLVED_RULE_KEYS,
};
