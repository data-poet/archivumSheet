const {
  BROQUEL_SKILL_ID,
  ESCUDO_SKILL_ID,
  BROQUEL_SHIELD_IDS,
} = require("./shieldConstants.js");

function shieldSkillId(shieldId) {
  return BROQUEL_SHIELD_IDS.has(shieldId) ? BROQUEL_SKILL_ID : ESCUDO_SKILL_ID;
}

// 4e B375: Block = 3 + skill/2, +1 with Combat Reflexes; the other shield skill and DX come in as skill defaults.
function blockFromLevel(level, hasReflexos = false) {
  if (level == null) return null;
  return 3 + Math.floor(level / 2) + (hasReflexos ? 1 : 0);
}

module.exports = {
  shieldSkillId,
  blockFromLevel,
};
