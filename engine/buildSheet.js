const { buildCharacter } = require("./character/buildCharacter");
const { buildInventory } = require("./inventory/buildInventory");

const { resolveAll } = require("./magic/js/spellsResolver");
const { buildGrimoire } = require("./magic/buildGrimoire");

function sumObjectValues(obj = {}) {
  return Object.values(obj).reduce((sum, v) => sum + (Number(v) || 0), 0);
}

function buildSheet({ character = {}, inventory = {} } = {}) {
  /**
   * 1. FULL CHARACTER COMPILATION (single source of truth)
   */
  const characterResult = buildCharacter({
    advantages: character.advantages,
    disadvantages: character.disadvantages,
    primaryAttributes: character.primaryAttributes,
    secondaryAttributes: character.secondaryAttributes,
    skills: character.skills,
    weight: inventory.weight || 0,
  });

  const characterData = characterResult.character;

  const iq = characterData.primary_attributes.IQ.value;
  const st = characterData.primary_attributes.ST.value;

  /**
   * 2. SPELL RESOLUTION
   */
  const resolvedSpells = resolveAll({
    spells: character.spells,
    character: {
      ...characterData,
      iq,
    },
  });

  /**
   * 3. GRIMOIRE BUILD
   */
  const grimoireResult = buildGrimoire(resolvedSpells.spells, {
    ...characterData,
    iq,
  });

  /**
   * 4. INVENTORY LAYER
   */
  const inventoryResult = buildInventory({
    ST: st,
    weight: inventory.weight || 0,
  });

  /**
   * 5. CHARACTER POINTS SUMMARY (FINAL AGGREGATION)
   */
  const basePoints = characterResult.character.character_points;

  const characterPoints = {
    primary_attributes: sumObjectValues(basePoints.primary_attributes),
    secondary_attributes: sumObjectValues(basePoints.secondary_attributes),

    skills: basePoints.skills || 0,
    advantages: basePoints.advantages || 0,
    disadvantages: basePoints.disadvantages || 0,

    spells: grimoireResult.character_points.spells || 0,
  };

  /**
   * 6. FINAL SHEET COMPOSITION
   */
  return {
    ...characterResult,

    grimoire: grimoireResult.spells,

    character: {
      ...characterData,
      character_points: characterPoints,
    },

    inventory: inventoryResult.inventory,
  };
}

module.exports = { buildSheet };
