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
let _firearmCounter = 1;
let _ammoContainerCounter = 1;
let _looseAmmoCounter = 1;
let _alchemyCounter = 1;
let _accessoryCounter = 1;
let _enchantmentCounter = 1;

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

export function nextFirearmInstanceId() {
  return `firearm-inst-${_firearmCounter++}`;
}

export function nextAmmoContainerInstanceId() {
  return `ammo-cont-inst-${_ammoContainerCounter++}`;
}

export function nextLooseAmmoInstanceId() {
  return `loose-ammo-inst-${_looseAmmoCounter++}`;
}

export function nextAlchemyInstanceId() {
  return `alchemy-inst-${_alchemyCounter++}`;
}

export function nextAccessoryInstanceId() {
  return `accessory-inst-${_accessoryCounter++}`;
}

/** Generic across equipment types — an enchantment application entry isn't
 *  its own inventory item, just a sub-entry inside instance.enchantments. */
export function nextEnchantmentInstanceId() {
  return `enchantment-inst-${_enchantmentCounter++}`;
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
  _firearmCounter = 1;
  _ammoContainerCounter = 1;
  _looseAmmoCounter = 1;
  _alchemyCounter = 1;
  _accessoryCounter = 1;
  _enchantmentCounter = 1;
}
