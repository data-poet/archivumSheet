const { calculateCarryWeight } = require("./js/carryWeight");
const { buildArmorSlots } = require("./js/armor/armor");
const { buildShieldSlots } = require("./js/shield/shield.js");
const { buildMeleeSlots } = require("./js/melee/melee.js");
const { buildRangedSlots } = require("./js/ranged/ranged.js");
const { buildFirearmSlots } = require("./js/firearms/firearms.js");
const { buildAmmoSlots } = require("./js/ammo/ammo.js");
const { buildAlchemySlots } = require("./js/alchemy/alchemy.js");
const { buildSurvivalGearSlots } = require("./js/survivalGear/survivalGear.js");
const { buildAccessorySlots } = require("./js/accessories/accessories.js");
const { buildMagicGearSlots } = require("./js/magicGear/magicGear.js");
const { buildCustomInventorySlots } = require("./js/customInventory/customInventory.js");
const { buildCoinPurseSlots } = require("./js/coinPurse/coinPurse.js");

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
  firearmsInventory = [],
  ammoContainerInventory = [],
  looseAmmoInventory = [],
  alchemyInventory = [],
  survivalGearInventory = [],
  accessoryInventory = [],
  magicGearInventory = [],
  customInventory = [],
  coinInventory = [],
} = {}) {
  const armor = buildArmorSlots(armorInventory);
  const shield = buildShieldSlots(shieldInventory);
  const melee = buildMeleeSlots(meleeInventory);
  const ranged = buildRangedSlots(rangedInventory, ST);
  const firearms = buildFirearmSlots(firearmsInventory);
  const ammo = buildAmmoSlots(ammoContainerInventory, looseAmmoInventory);
  const alchemy = buildAlchemySlots(alchemyInventory);
  const survivalGear = buildSurvivalGearSlots(survivalGearInventory);
  const accessories = buildAccessorySlots(accessoryInventory);
  const magicGear = buildMagicGearSlots(magicGearInventory);
  const customInv = buildCustomInventorySlots(customInventory);
  const coinPurse = buildCoinPurseSlots(coinInventory);

  const effectiveWeight =
    weight +
    armor.carried_armor_weight +
    shield.carried_shield_weight +
    melee.carried_melee_weapons_weight +
    ranged.carried_ranged_weapons_weight +
    firearms.carried_firearms_weight +
    ammo.carried_ammo_weight +
    alchemy.carried_alchemy_weight +
    survivalGear.carried_survival_gear_weight +
    magicGear.carried_magic_gear_weight +
    customInv.carried_custom_inventory_weight +
    coinPurse.carried_coin_purse_weight;

  const carryWeight = calculateCarryWeight(ST, effectiveWeight);

  return {
    inventory: {
      carry_weight: carryWeight,

      armor,
      shield,
      melee,
      ranged,
      firearms,
      ammo,
      alchemy,
      survivalGear,
      accessories,
      magicGear,
      customInventory: customInv,
      coinPurse,
    },
  };
}

module.exports = {
  buildInventory,
};
