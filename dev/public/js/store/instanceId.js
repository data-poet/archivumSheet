// ─────────────────────────────────────────────────────────────────────────────
// Centralized instance ID generators
//
// Each inventory type has its own counter so IDs are always unique and
// domain-prefixed (armor-inst-1, shield-inst-1, melee-inst-1).
// Counters are module-level so they persist across the session.
//
// Used by: inventory/armor.js, inventory/shield.js, inventory/melee.js
// ─────────────────────────────────────────────────────────────────────────────

let _armorCounter = 1;
let _shieldCounter = 1;
let _meleeCounter = 1;
let _rangedCounter = 1;

export function nextArmorInstanceId() {
  return `armor-inst-${_armorCounter++}`;
}

export function nextShieldInstanceId() {
  return `shield-inst-${_shieldCounter++}`;
}

export function nextMeleeInstanceId() {
  return `melee-inst-${_meleeCounter++}`;
}

export function nextRangedInstanceId() {
  return `ranged-inst-${_rangedCounter++}`;
}

/**
 * Reset all counters — used only during sheet import so imported
 * instance IDs don't collide with freshly generated ones.
 */
export function resetInstanceCounters() {
  _armorCounter = 1;
  _shieldCounter = 1;
  _meleeCounter = 1;
  _rangedCounter = 1;
}
