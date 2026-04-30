const { buildCharacter } = require("./character/buildCharacter");
const { buildInventory } = require("./inventory/buildInventory");

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

  /**
   * 2. INVENTORY LAYER (still independent system)
   */
  const ST = characterResult.character.primary_attributes.ST.value;

  const inventoryResult = buildInventory({
    ST,
    weight: inventory.weight || 0,
  });

  /**
   * 3. FINAL SHEET COMPOSITION
   */
  return {
    ...characterResult,
    inventory: inventoryResult.inventory,
  };
}

module.exports = { buildSheet };
