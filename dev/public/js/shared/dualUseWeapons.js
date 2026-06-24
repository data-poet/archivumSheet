// ─────────────────────────────────────────────────────────────────────────────
// DUAL-USE WEAPONS  (ES module — dev/public layer)
//
// Keep in sync with engine/inventory/js/shared/dualUseWeapons.js
// ─────────────────────────────────────────────────────────────────────────────

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
export const MELEE_TO_RANGED = Object.fromEntries(_PAIRS.map(([m, r]) => [m, r]));

/** ranged weapon_id → melee weapon_id */
export const RANGED_TO_MELEE = Object.fromEntries(_PAIRS.map(([m, r]) => [r, m]));
