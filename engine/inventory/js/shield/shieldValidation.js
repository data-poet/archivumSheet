const { VALID_STORED_AT } = require("./shieldConstants");

const {
  validateEnchantmentEntryShape,
  validateEnchantmentEntryApplication,
} = require("../shared/enchantmentsValidation.js");

// enchantment_allowed_itens category for this item type — matches
// SLOT_MAP's Portuguese keys convention used by armor. Shields have no
// slot system (see shieldConstants.js), so — same as accessories' single
// fixed ACCESSORY_ITEM_CATEGORY — this is one constant, not a per-instance
// lookup like armor's armor_piece_location.
const SHIELD_ITEM_CATEGORY = "Escudos";

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validates a single shield instance object.
 * Returns an array of error strings (empty = valid).
 */
function validateShieldInstance(instance, index) {
  const errors = [];
  const prefix = `shieldInventory[${index}]`;

  if (!instance || typeof instance !== "object") {
    return [`${prefix}: must be an object`];
  }

  if (typeof instance.shield_id !== "string" || !instance.shield_id) {
    errors.push(`${prefix}: shield_id is required`);
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
  // shape-only pass as accessories/magicGear/armor — see
  // accessoriesValidation.js)
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
 * checks above, same split accessories/magicGear/armor use.
 *
 * itemCategory is the fixed SHIELD_ITEM_CATEGORY constant, not a per-piece
 * lookup — unlike armor, no shieldDb is needed here since there's no
 * per-instance category to resolve (unknown shield_id is still caught
 * separately in shield.js).
 */
function validateShieldEnchantments(
  shieldInventory,
  enchantmentsDb,
  targetsDb,
) {
  const errors = [];

  shieldInventory.forEach((instance, index) => {
    const prefix = `shieldInventory[${index}]`;
    const entries = instance.enchantments || [];

    entries.forEach((entry, entryIndex) => {
      errors.push(
        ...validateEnchantmentEntryApplication(
          entry,
          enchantmentsDb,
          targetsDb,
          SHIELD_ITEM_CATEGORY,
          entryIndex,
          prefix,
        ),
      );
    });
  });

  return errors;
}

/**
 * Ensures at most one shield is equipped at a time.
 * Returns an array of error strings (empty = valid).
 */
function validateSingleEquippedShield(instances) {
  const errors = [];
  const equipped = [];

  for (const instance of instances) {
    if (!instance.is_equipped) {
      continue;
    }

    equipped.push(instance.shield_id);
  }

  if (equipped.length > 1) {
    errors.push(
      `Only one shield can be equipped at a time (conflict: ${equipped.join(", ")})`,
    );
  }

  return errors;
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  validateShieldInstance,
  validateSingleEquippedShield,
  validateShieldEnchantments,
  SHIELD_ITEM_CATEGORY,
};
