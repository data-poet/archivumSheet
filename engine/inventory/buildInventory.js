const { calculateCarryWeight } = require("./js/carryWeight");
const { buildArmorSlots } = require("./js/armor/armor");
const { buildShieldSlots } = require("./js/shield/shield.js");
const { buildMeleeSlots } = require("./js/melee/melee.js");
const { buildRangedSlots } = require("./js/ranged/ranged.js");
const { buildAmmoSlots } = require("./js/ammo/ammo.js");
const { buildAlchemySlots } = require("./js/alchemy/alchemy.js");
const { buildSurvivalGearSlots } = require("./js/survivalGear/survivalGear.js");
const { buildCustomInventorySlots } = require("./js/customInventory/customInventory.js");

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
  ammoContainerInventory = [],
  looseAmmoInventory = [],
  alchemyInventory = [],
  survivalGearInventory = [],
  customInventory = [],
} = {}) {
  const armor = buildArmorSlots(armorInventory);
  const shield = buildShieldSlots(shieldInventory);
  const melee = buildMeleeSlots(meleeInventory);
  const ranged = buildRangedSlots(rangedInventory, ST);
  const ammo = buildAmmoSlots(ammoContainerInventory, looseAmmoInventory);
  const alchemy = buildAlchemySlots(alchemyInventory);
  const survivalGear = buildSurvivalGearSlots(survivalGearInventory);
  const customInv = buildCustomInventorySlots(customInventory);

  const effectiveWeight =
    weight +
    armor.carried_armor_weight +
    shield.carried_shield_weight +
    melee.carried_melee_weapons_weight +
    ranged.carried_ranged_weapons_weight +
    ammo.carried_ammo_weight +
    alchemy.carried_alchemy_weight +
    survivalGear.carried_survival_gear_weight +
    customInv.carried_custom_inventory_weight;

  const carryWeight = calculateCarryWeight(ST, effectiveWeight);

  return {
    inventory: {
      carry_weight: carryWeight,

      armor,
      shield,
      melee,
      ranged,
      ammo,
      alchemy,
      survivalGear,
      customInventory: customInv,
    },
  };
}

module.exports = {
  buildInventory,
};
