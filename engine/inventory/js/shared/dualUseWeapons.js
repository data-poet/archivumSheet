// Dual-use weapons are mirrored across melee and ranged; weight and price live on the melee row (the ranged copy is 0/0 so totals are not doubled).

const { DUAL_USE_WEAPON_PAIRS } = require("../../../../helpers/ids.js");

const MELEE_TO_RANGED = Object.fromEntries(
  DUAL_USE_WEAPON_PAIRS.map(([m, r]) => [m, r]),
);

const RANGED_TO_MELEE = Object.fromEntries(
  DUAL_USE_WEAPON_PAIRS.map(([m, r]) => [r, m]),
);

function isMeleeDualUse(weaponId) {
  return Object.prototype.hasOwnProperty.call(MELEE_TO_RANGED, weaponId);
}

function isRangedDualUse(weaponId) {
  return Object.prototype.hasOwnProperty.call(RANGED_TO_MELEE, weaponId);
}

function getRangedCounterpart(meleeWeaponId) {
  return MELEE_TO_RANGED[meleeWeaponId] ?? null;
}

function getMeleeCounterpart(rangedWeaponId) {
  return RANGED_TO_MELEE[rangedWeaponId] ?? null;
}

// Enchantments sync across a dual-use pair, so an entry added via one side must validate against either side's allowed category list.
function resolveDualUseEnchantmentCategory(
  weaponId,
  ownCategory,
  counterpartCategory,
  isDualUse,
) {
  return isDualUse(weaponId) ? [ownCategory, counterpartCategory] : ownCategory;
}

module.exports = {
  MELEE_TO_RANGED,
  RANGED_TO_MELEE,
  isMeleeDualUse,
  isRangedDualUse,
  getRangedCounterpart,
  getMeleeCounterpart,
  resolveDualUseEnchantmentCategory,
};
