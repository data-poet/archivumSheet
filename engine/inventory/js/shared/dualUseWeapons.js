// Some weapons appear in both melee and ranged tables and are auto-mirrored across them. Weight/price are canonical on the melee side; the ranged counterpart is 0/0 in the CSV so it doesn't double-count totals.

// Pairs listed as [meleeId, rangedId] for each tier (Comum → Obra-Prima).
const _PAIRS = [
  // Lança de Mão
  ["MELEE-215", "RANGED-050"],
  ["MELEE-216", "RANGED-051"],
  ["MELEE-217", "RANGED-052"],
  ["MELEE-218", "RANGED-053"],
  ["MELEE-219", "RANGED-054"],

  // Lança de Arremesso
  ["MELEE-220", "RANGED-055"],
  ["MELEE-221", "RANGED-056"],
  ["MELEE-222", "RANGED-057"],
  ["MELEE-223", "RANGED-058"],
  ["MELEE-224", "RANGED-059"],

  // Machadinha
  ["MELEE-280", "RANGED-005"],
  ["MELEE-281", "RANGED-006"],
  ["MELEE-282", "RANGED-007"],
  ["MELEE-283", "RANGED-008"],
  ["MELEE-284", "RANGED-009"],

  // Machado de Arremesso
  ["MELEE-285", "RANGED-010"],
  ["MELEE-286", "RANGED-011"],
  ["MELEE-287", "RANGED-012"],
  ["MELEE-288", "RANGED-013"],
  ["MELEE-289", "RANGED-014"],
];

const MELEE_TO_RANGED = Object.fromEntries(_PAIRS.map(([m, r]) => [m, r]));

const RANGED_TO_MELEE = Object.fromEntries(_PAIRS.map(([m, r]) => [r, m]));

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
