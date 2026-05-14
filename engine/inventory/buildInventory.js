const { calculateCarryWeight } = require("./js/carryWeight");

const { buildArmorSlots } = require("./js/armor/armor");

/**
 * Builds inventory data
 */
function buildInventory({ ST = 0, weight = 0, armorInventory = [] } = {}) {
  const armor = buildArmorSlots(armorInventory);

  const effectiveWeight = weight + armor.carried_armor_weight;

  const carryWeight = calculateCarryWeight(ST, effectiveWeight);

  return {
    inventory: {
      carry_weight: carryWeight,

      armor,
    },
  };
}

module.exports = {
  buildInventory,
};
