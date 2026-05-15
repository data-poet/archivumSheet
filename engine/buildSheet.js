const { buildCharacter } = require("./character/buildCharacter");
const { buildInventory } = require("./inventory/buildInventory");
const { resolveAll } = require("./magic/js/spellsResolver");
const { buildGrimoire } = require("./magic/buildGrimoire");

function sumObjectValues(obj = {}) {
  return Object.values(obj).reduce(
    (sum, value) => sum + (Number(value) || 0),
    0,
  );
}

function buildSheet({ character = {}, inventory = {} } = {}) {
  /**
   * ───────────────────────────────────────────────────────────────────────────
   * 1. INITIAL CHARACTER BUILD
   * ───────────────────────────────────────────────────────────────────────────
   *
   * Character is built FIRST to resolve:
   *
   * - final ST
   * - final IQ
   * - secondary attributes
   *
   * WITHOUT carry penalties yet.
   */

  const initialCharacterResult = buildCharacter({
    advantages: character.advantages,

    disadvantages: character.disadvantages,

    primaryAttributes: character.primaryAttributes,

    secondaryAttributes: character.secondaryAttributes,

    skills: character.skills,

    carry_weight: null,
  });

  const initialCharacter = initialCharacterResult.character;

  const st = initialCharacter.primary_attributes.ST.value;

  /**
   * ───────────────────────────────────────────────────────────────────────────
   * 2. INVENTORY LAYER
   * ───────────────────────────────────────────────────────────────────────────
   *
   * Inventory depends on final ST because:
   *
   * - ST defines carry limits
   * - carried weight defines encumbrance
   */

  const inventoryResult = buildInventory({
    ST: st,

    weight: inventory.weight || 0,

    armorInventory: inventory.armor || [],
  });

  /**
   * ───────────────────────────────────────────────────────────────────────────
   * 3. FINAL CHARACTER BUILD
   * ───────────────────────────────────────────────────────────────────────────
   *
   * Rebuild character applying:
   *
   * - carry penalties
   * - encumbrance effects
   */

  const characterResult = buildCharacter({
    advantages: character.advantages,

    disadvantages: character.disadvantages,

    primaryAttributes: character.primaryAttributes,

    secondaryAttributes: character.secondaryAttributes,

    skills: character.skills,

    carry_weight: inventoryResult.inventory.carry_weight,
  });

  const characterData = characterResult.character;

  const iq = characterData.primary_attributes.IQ.value;

  /**
   * ───────────────────────────────────────────────────────────────────────────
   * 4. SPELL RESOLUTION
   * ───────────────────────────────────────────────────────────────────────────
   */

  const resolvedSpells = resolveAll({
    spells: character.spells,

    character: {
      ...characterData,
      iq,
    },
  });

  /**
   * ───────────────────────────────────────────────────────────────────────────
   * 5. GRIMOIRE BUILD
   * ───────────────────────────────────────────────────────────────────────────
   */

  const grimoireResult = buildGrimoire(resolvedSpells.spells, {
    ...characterData,
    iq,
  });

  /**
   * ───────────────────────────────────────────────────────────────────────────
   * 6. CHARACTER POINTS SUMMARY
   * ───────────────────────────────────────────────────────────────────────────
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
   * ───────────────────────────────────────────────────────────────────────────
   * 7. FINAL SHEET
   * ───────────────────────────────────────────────────────────────────────────
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

module.exports = {
  buildSheet,
};
