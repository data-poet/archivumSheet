const { calculateCarryWeight } = require("./js/carryWeight");

/**
 * Builds inventory data
 */
function buildInventory({ ST = 0, weight = 0 } = {}) {
  const carryWeight = calculateCarryWeight(ST, weight);

  return {
    inventory: {
      carry_weight: carryWeight,
    },
  };
}

module.exports = { buildInventory };
