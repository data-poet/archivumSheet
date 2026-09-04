const { getSpellCost } = require("./js/spellsCost.js");

function buildGrimoire(selectedSpells = {}, character = {}) {
  const spells = {};
  let totalCost = 0;

  const primary = character?.primary_attributes || {};

  for (const [id, spell] of Object.entries(selectedSpells)) {
    const row = spell.row;
    if (!row) continue;

    const attribute = "IQ";

    const attributeBase =
      primary?.[attribute]?.value ??
      primary?.[attribute]?.base_value ??
      character?.iq ??
      0;

    const base_value = Number(spell.base_value ?? 0);
    const modifier = Number(spell.modifier ?? 0);
    const aptitude_level = Number(spell.aptitude_level ?? 0);
    const enchantment_modifier = Number(spell.enchantment_modifier ?? 0);
    const has_enchantment_modifier = Boolean(
      spell.has_enchantment_modifier ?? false,
    );
    const is_enchantment = Boolean(spell.is_enchantment ?? false);

    // Cost is calculated before Magic Aptitude and any enchantment_modifier — those raise effective level for free, same as attributes/skills.
    const costLevel = base_value + modifier;
    const level = costLevel + aptitude_level + enchantment_modifier;
    const relative = costLevel - attributeBase;

    // Enchantment-granted spells were never purchased — zero cost, same as enchantment-granted skills/advantages.
    const cost = is_enchantment
      ? 0
      : getSpellCost({
          attribute,
          base: attributeBase,
          level: costLevel,
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
      aptitude_level,
      enchantment_modifier,
      has_enchantment_modifier,
      is_enchantment,
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
