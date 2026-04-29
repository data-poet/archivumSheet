const { buildCharacterPrimary } = require("./character/buildCharacterPrimary");
const {
  buildCharacterSecondary,
} = require("./character/buildCharacterSecondary");
const { buildInventory } = require("./inventory/buildInventory");

function buildSheet({ character = {}, inventory = {} } = {}) {
  /**
   * Step 1: Primary
   */
  const primary = buildCharacterPrimary(character);

  const ST = primary.primary_attributes.ST.value;

  /**
   * Step 2: Inventory
   */
  const inventoryResult = buildInventory({
    ST,
    weight: inventory.weight || 0,
  });

  /**
   * Step 3: Secondary
   */
  const secondary = buildCharacterSecondary({
    primary_attributes: primary.primary_attributes,
    secondaryAttributes: character.secondaryAttributes,
    weight: inventory.weight || 0,
  });

  return {
    character: {
      primary_attributes: primary.primary_attributes,
      secondary_attributes: secondary.secondary_attributes,

      advantages: primary.advantages,
      disadvantages: primary.disadvantages,

      character_points: {
        ...primary.character_points,
        ...secondary.character_points,
      },
    },
    ...inventoryResult,
  };
}

module.exports = { buildSheet };
