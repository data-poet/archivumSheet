const {
  BROQUEL_SKILL_ID,
  ESCUDO_SKILL_ID,
  BROQUEL_SHIELD_IDS,
} = require("./shieldConstants.js");

// Priority: matching skill (floor(value/2)+3) > cross-skill penalty (floor(value/2)+1) > DX-based fallback (dxValue-4). "Matching" is by shield_id: SHIELD-000..004 use Broquel, all others use Escudo.
function computeShieldBlock(shieldId, skills = {}, dxValue = 0) {
  const isBroquelShield = BROQUEL_SHIELD_IDS.has(shieldId);

  const primarySkillId   = isBroquelShield ? BROQUEL_SKILL_ID : ESCUDO_SKILL_ID;
  const secondarySkillId = isBroquelShield ? ESCUDO_SKILL_ID  : BROQUEL_SKILL_ID;

  const primarySkill   = skills[primarySkillId]   ?? null;
  const secondarySkill = skills[secondarySkillId] ?? null;

  if (primarySkill) {
    return Math.floor(primarySkill.value / 2) + 3;
  }

  if (secondarySkill) {
    return Math.floor(secondarySkill.value / 2) + 1;
  }

  return dxValue - 4;
}

module.exports = {
  computeShieldBlock,
};
