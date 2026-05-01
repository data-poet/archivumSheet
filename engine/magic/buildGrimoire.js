const { getSpellCost } = require("./js/spellsCost.js");

/**
 * Build resolved spells + total cost
 *
 * EXPECTS:
 * selectedSpells = {
 *   "ARC-0001": {
 *     row: {...},          // resolved DB row
 *     name: "Moldar Mana",
 *     tier: "Aprendiz",
 *     base_value: 10,
 *     modifier: 0,
 *     level: 10
 *   }
 * }
 */
function buildGrimoire(selectedSpells = {}, character = {}) {
  const spells = {};
  let totalCost = 0;

  const primary = character?.primary_attributes || {};

  for (const [id, spell] of Object.entries(selectedSpells)) {
    const row = spell.row;
    if (!row) continue; // safety

    const attribute = "IQ";

    const attributeBase =
      primary?.[attribute]?.value ??
      primary?.[attribute]?.base_value ??
      character?.iq ??
      0;

    const base_value = Number(spell.base_value ?? 0);
    const modifier = Number(spell.modifier ?? 0);

    const level = base_value + modifier;
    const relative = level - attributeBase;

    const cost = getSpellCost({
      attribute,
      base: attributeBase,
      level,
      difficulty: row.spell_difficulty,
    });

    spells[id] = {
      name: row.spell_name,
      school: row.spell_school,
      category: row.spell_type,
      tier: row.spell_tier,

      attribute,
      difficulty: row.spell_difficulty,

      attribute_base: attributeBase,
      base_value,
      modifier,
      value: level,
      relative_level: relative,
      points: cost,
    };

    totalCost += cost;
  }

  return {
    spells,
    character_points: {
      spells: totalCost,
    },
  };
}

module.exports = {
  buildGrimoire,
};
