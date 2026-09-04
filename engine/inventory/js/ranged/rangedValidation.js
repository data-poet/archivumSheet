const { VALID_STORED_AT, RANGED_ITEM_CATEGORY } = require("./rangedConstants");
const { MELEE_ITEM_CATEGORY } = require("../melee/meleeConstants");
const { isRangedDualUse } = require("../shared/dualUseWeapons.js");

const {
  validateEnchantmentEntryShape,
  validateEnchantmentEntryApplication,
} = require("../shared/enchantmentsValidation.js");

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validates a single ranged instance object.
 * Returns an array of error strings (empty = valid).
 */
function validateRangedInstance(instance, index) {
  const errors = [];
  const prefix = `rangedInventory[${index}]`;

  if (!instance || typeof instance !== "object") {
    return [`${prefix}: must be an object`];
  }

  if (typeof instance.weapon_id !== "string" || !instance.weapon_id) {
    errors.push(`${prefix}: weapon_id is required`);
  }

  if (typeof instance.is_equipped !== "boolean") {
    errors.push(`${prefix}: is_equipped must be a boolean`);
  }

  if (instance.is_equipped === true && instance.storedAt !== null) {
    errors.push(`${prefix}: storedAt must be null when is_equipped is true`);
  }

  if (
    instance.is_equipped === false &&
    !VALID_STORED_AT.includes(instance.storedAt)
  ) {
    errors.push(
      `${prefix}: storedAt must be one of [${VALID_STORED_AT.join(", ")}] when not equipped`,
    );
  }

  // enchantments — optional; unlimited count, no slot system (same
  // shape-only pass as melee/shield/accessories/magicGear/armor — see
  // meleeValidation.js)
  if (instance.enchantments !== undefined) {
    if (!Array.isArray(instance.enchantments)) {
      errors.push(`${prefix}: enchantments must be an array when present`);
    } else {
      instance.enchantments.forEach((entry, entryIndex) => {
        errors.push(
          ...validateEnchantmentEntryShape(entry, entryIndex, prefix),
        );
      });
    }
  }

  return errors;
}

/**
 * DB-dependent enchantment checks (unknown ids, allowed_itens, target
 * existence, value/step alignment) — separate pass from the shape-only
 * checks above, same split melee/shield/accessories/magicGear/armor use.
 *
 * itemCategory is RANGED_ITEM_CATEGORY, OR — for a dual-use instance
 * (decision #4/#5 of the weapons enchantments plan) — `[RANGED_ITEM_CATEGORY,
 * MELEE_ITEM_CATEGORY]`. Enchantments sync across a dual-use pair, so an
 * entry added via the melee side (e.g. BAL) ends up on this ranged mirror
 * too; validating against ranged's category alone would wrongly reject it.
 */
function validateRangedEnchantments(
  rangedInventory,
  enchantmentsDb,
  targetsDb,
) {
  const errors = [];

  rangedInventory.forEach((instance, index) => {
    const prefix = `rangedInventory[${index}]`;
    const entries = instance.enchantments || [];

    const itemCategory = isRangedDualUse(instance.weapon_id)
      ? [RANGED_ITEM_CATEGORY, MELEE_ITEM_CATEGORY]
      : RANGED_ITEM_CATEGORY;

    entries.forEach((entry, entryIndex) => {
      errors.push(
        ...validateEnchantmentEntryApplication(
          entry,
          enchantmentsDb,
          targetsDb,
          itemCategory,
          entryIndex,
          prefix,
        ),
      );
    });
  });

  return errors;
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  validateRangedInstance,
  validateRangedEnchantments,
};
