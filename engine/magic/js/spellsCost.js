const { SPELL_ATTRIBUTE, COST_TABLES } = require("./spellsConstants.js");

function getRelativeLevel(base, level) {
  return level - base;
}

function getSpellCost({
  attribute = SPELL_ATTRIBUTE,
  base = 0,
  level = 0,
  difficulty,
}) {
  const relative = getRelativeLevel(base, level);

  const table = COST_TABLES[attribute]?.[difficulty];
  if (!table) {
    console.warn(
      `[getSpellCost] Unknown attribute/difficulty combination: ${attribute}/${difficulty}`,
    );
    return 0;
  }

  const clamped = Math.max(-4, Math.min(10, relative));

  return table[clamped] ?? 0;
}

module.exports = {
  getSpellCost,
  getRelativeLevel,
  COST_TABLES,
};
