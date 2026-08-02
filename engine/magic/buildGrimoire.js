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
 *     enchantment_modifier: 0,   // from fortify_spell/weaken_spell, default 0
 *     has_enchantment_modifier: false,
 *     is_enchantment: false,     // true if base_value/modifier came from an
 *                                // equipped "Adicionar Feitiço" grant, not
 *                                // the player's own purchase — see
 *                                // spellsResolver.js's resolveSpells()
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
    const aptitude_level = Number(spell.aptitude_level ?? 0);
    const enchantment_modifier = Number(spell.enchantment_modifier ?? 0);
    const has_enchantment_modifier = Boolean(
      spell.has_enchantment_modifier ?? false,
    );
    const is_enchantment = Boolean(spell.is_enchantment ?? false);

    // Point cost is calculated on the level BEFORE Magic Aptitude
    // (ADV-063→065) and BEFORE any fortify_spell/weaken_spell
    // enchantment_modifier: neither the advantage nor an equipped item
    // should make spells cheaper (or costlier) to learn — they raise the
    // effective NH for free, same principle as attributes/skills.
    const costLevel = base_value + modifier;
    const level = costLevel + aptitude_level + enchantment_modifier;
    const relative = costLevel - attributeBase;

    // An enchantment-granted spell (from "Adicionar Feitiço") was never
    // purchased with points — same zero-cost treatment as
    // is_race_innate/enchantment-granted skills and advantages.
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
