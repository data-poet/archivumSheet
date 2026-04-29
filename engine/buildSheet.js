const { buildCharacter } = require("./character/buildCharacter");
const { buildInventory } = require("./inventory/buildInventory");

/**
 * Builds the full sheet
 */
function buildSheet({ character = {}, inventory = {} } = {}) {
  const characterResult = buildCharacter(character);
  console.log("Character ST:", characterResult.character.primary_attributes.ST);
  const ST = characterResult.character.primary_attributes.ST.value;

  console.log("ST used in inventory:", ST);
  const inventoryResult = buildInventory({
    ST,
    weight: inventory.weight || 0,
  });

  return {
    ...characterResult,
    ...inventoryResult,
  };
}

module.exports = { buildSheet };
