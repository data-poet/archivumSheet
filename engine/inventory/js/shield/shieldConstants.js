// ─────────────────────────────────────────────────────────────────────────────
// SHIELD CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

// Shields have no slots — a character can equip at most one shield at a time,
// but there is no positional slot system like armor pieces have.

const VALID_STORED_AT = ["stash", "camp", "backpack"];

// ── Block skill IDs ──────────────────────────────────────────────────────────

const BROQUEL_SKILL_ID = "SKILL-045";
const ESCUDO_SKILL_ID  = "SKILL-082";

// Shield IDs that use BROQUEL skill for block (the rest use ESCUDO).
const BROQUEL_SHIELD_IDS = new Set([
  "SHIELD-000",
  "SHIELD-001",
  "SHIELD-002",
  "SHIELD-003",
  "SHIELD-004",
]);

module.exports = {
  VALID_STORED_AT,
  BROQUEL_SKILL_ID,
  ESCUDO_SKILL_ID,
  BROQUEL_SHIELD_IDS,
};
