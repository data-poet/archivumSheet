const { calculateCarryWeight } = require("./js/carryWeight");
const { buildArmorSlots } = require("./js/armor/armor");
const { buildShieldSlots } = require("./js/shield/shield.js");
const { buildMeleeSlots } = require("./js/melee/melee.js");
const { buildRangedSlots } = require("./js/ranged/ranged.js");

/**
 * Builds inventory data
 */
function buildInventory({
  ST = 0,
  weight = 0,
  armorInventory = [],
  shieldInventory = [],
  meleeInventory = [],
  rangedInventory = [],
} = {}) {
  const armor = buildArmorSlots(armorInventory);
  const shield = buildShieldSlots(shieldInventory);
  const melee = buildMeleeSlots(meleeInventory);
  const ranged = buildRangedSlots(rangedInventory, ST);

  const effectiveWeight =
    weight +
    armor.carried_armor_weight +
    shield.carried_shield_weight +
    melee.carried_melee_weapons_weight +
    ranged.carried_ranged_weapons_weight;

  const carryWeight = calculateCarryWeight(ST, effectiveWeight);

  return {
    inventory: {
      carry_weight: carryWeight,

      armor,
      shield,
      melee,
      ranged,
    },
  };
}

module.exports = {
  buildInventory,
};
