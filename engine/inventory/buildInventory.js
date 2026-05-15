const { calculateCarryWeight } = require("./js/carryWeight");
const { buildArmorSlots } = require("./js/armor/armor");
const { buildShieldSlots } = require("./js/shield/shield.js");
const shield = require("./js/shield/shield.js");

/**
 * Builds inventory data
 */
function buildInventory({
  ST = 0,
  weight = 0,
  armorInventory = [],
  shieldInventory = [],
} = {}) {
  const armor = buildArmorSlots(armorInventory);
  const shield = buildShieldSlots(shieldInventory);

  const effectiveWeight =
    weight + armor.carried_armor_weight + shield.carried_shield_weight;

  const carryWeight = calculateCarryWeight(ST, effectiveWeight);

  return {
    inventory: {
      carry_weight: carryWeight,

      armor,
      shield,
    },
  };
}

module.exports = {
  buildInventory,
};
