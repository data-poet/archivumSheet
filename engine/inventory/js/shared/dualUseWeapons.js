// ─────────────────────────────────────────────────────────────────────────────
// DUAL-USE WEAPONS
//
// Some weapons appear in both the melee and ranged tables. When a player
// adds one of these to either table, the engine automatically mirrors the
// entry in the other table. Weight and price are canonical on the MELEE
// side; the ranged counterpart carries weight = 0 and price = 0 in the CSV
// so it contributes nothing to totals.
//
// MELEE_TO_RANGED / RANGED_TO_MELEE map each tier-specific weapon_id on one
// side to its counterpart on the other side.
// ─────────────────────────────────────────────────────────────────────────────

// Pairs listed as [meleeId, rangedId] for each tier (Comum → Obra-Prima).
const _PAIRS = [
  // Lança de Mão
  ["MELEE-215", "RANGED-055"],
  ["MELEE-216", "RANGED-056"],
  ["MELEE-217", "RANGED-057"],
  ["MELEE-218", "RANGED-058"],
  ["MELEE-219", "RANGED-059"],

  // Lança de Arremesso
  ["MELEE-220", "RANGED-060"],
  ["MELEE-221", "RANGED-061"],
  ["MELEE-222", "RANGED-062"],
  ["MELEE-223", "RANGED-063"],
  ["MELEE-224", "RANGED-064"],

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

/** melee weapon_id → ranged weapon_id */
const MELEE_TO_RANGED = Object.fromEntries(_PAIRS.map(([m, r]) => [m, r]));

/** ranged weapon_id → melee weapon_id */
const RANGED_TO_MELEE = Object.fromEntries(_PAIRS.map(([m, r]) => [r, m]));

/** Returns true when a melee weapon_id has a ranged counterpart. */
function isMeleeDualUse(weaponId) {
  return Object.prototype.hasOwnProperty.call(MELEE_TO_RANGED, weaponId);
}

/** Returns true when a ranged weapon_id has a melee counterpart. */
function isRangedDualUse(weaponId) {
  return Object.prototype.hasOwnProperty.call(RANGED_TO_MELEE, weaponId);
}

/**
 * Given a melee weapon_id, returns the matching ranged weapon_id, or null.
 */
function getRangedCounterpart(meleeWeaponId) {
  return MELEE_TO_RANGED[meleeWeaponId] ?? null;
}

/**
 * Given a ranged weapon_id, returns the matching melee weapon_id, or null.
 */
function getMeleeCounterpart(rangedWeaponId) {
  return RANGED_TO_MELEE[rangedWeaponId] ?? null;
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  MELEE_TO_RANGED,
  RANGED_TO_MELEE,
  isMeleeDualUse,
  isRangedDualUse,
  getRangedCounterpart,
  getMeleeCounterpart,
};
