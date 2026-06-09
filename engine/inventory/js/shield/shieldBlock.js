const {
  BROQUEL_SKILL_ID,
  ESCUDO_SKILL_ID,
  BROQUEL_SHIELD_IDS,
} = require("./shieldConstants.js");

// ─────────────────────────────────────────────────────────────────────────────
// BLOCK COMPUTATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Computes the block value for a single shield instance.
 *
 * Rules (in priority order):
 *
 * 1. Character has the matching skill for the shield type
 *    → block = floor(skill.value / 2) + 3
 *
 * 2. Character has the non-matching skill only
 *    → block = floor(skill.value / 2) + 1  (cross-skill penalty)
 *
 * 3. Character has neither shield skill
 *    → block = dxValue - 4
 *
 * "Matching skill" is determined by shield_id:
 *   SHIELD-000…004 → SKILL-045 (Broquel)
 *   all others     → SKILL-082 (Escudo)
 *
 * @param {string} shieldId   - shield_id of the instance being resolved
 * @param {object} skills     - keyed skills map from buildSkills output
 * @param {number} dxValue    - final DX value from primary_attributes
 * @returns {number}          - computed block value
 */
function computeShieldBlock(shieldId, skills = {}, dxValue = 0) {
  const isBroquelShield = BROQUEL_SHIELD_IDS.has(shieldId);

  const primarySkillId   = isBroquelShield ? BROQUEL_SKILL_ID : ESCUDO_SKILL_ID;
  const secondarySkillId = isBroquelShield ? ESCUDO_SKILL_ID  : BROQUEL_SKILL_ID;

  const primarySkill   = skills[primarySkillId]   ?? null;
  const secondarySkill = skills[secondarySkillId] ?? null;

  // Matching skill available → full block bonus
  if (primarySkill) {
    return Math.floor(primarySkill.value / 2) + 3;
  }

  // Only the cross-skill available → reduced block bonus
  if (secondarySkill) {
    return Math.floor(secondarySkill.value / 2) + 1;
  }

  // No shield skill at all → DX-based fallback
  return dxValue - 4;
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  computeShieldBlock,
};
