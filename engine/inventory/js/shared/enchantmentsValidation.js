const {
  POINT_EFFECT_TYPES,
  SPELL_EFFECT_TYPES,
  DIFFICULTY_EFFECT_TYPES,
  VALUE_EFFECT_TYPES,
  FORTIFY_EFFECT_TYPES,
  WEAKEN_EFFECT_TYPES,
} = require("./enchantmentsConstants.js");

// ─────────────────────────────────────────────────────────────────────────────
// SHAPE VALIDATION (no DB access)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validates a single enchantment application entry's shape — types only.
 * Does not know which fields are required (that depends on the
 * enchantment's effect_type, looked up from the DB), so this only rejects
 * entries with the wrong type for a field that IS present.
 *
 * Both `value` and `extraPoints` are checked here — types only. `value`
 * must be a number (not necessarily an integer: percentage-flagged
 * enchantments carry decimal fractions, e.g. 0.05 for +5% — see
 * enchantment_is_percentage in enchantmentsDB.js). `extraPoints` (skill/
 * spell only) stays integer-only, since points are never fractional. Sign
 * (fortify > 0, weaken < 0) depends on effect_type, so that's checked in
 * the application pass below, not here.
 */
function validateEnchantmentEntryShape(entry, index, parentPrefix) {
  const prefix = `${parentPrefix}.enchantments[${index}]`;

  if (!entry || typeof entry !== "object") {
    return [`${prefix}: must be an object`];
  }

  const errors = [];

  if (typeof entry.enchantment_id !== "string" || !entry.enchantment_id) {
    errors.push(`${prefix}: enchantment_id is required`);
  }

  if (
    entry.value !== undefined &&
    (typeof entry.value !== "number" || Number.isNaN(entry.value))
  ) {
    errors.push(`${prefix}: value must be a number when present`);
  }

  if (
    entry.target !== undefined &&
    entry.target !== null &&
    typeof entry.target !== "string"
  ) {
    errors.push(`${prefix}: target must be a string when present`);
  }

  if (entry.extraPoints !== undefined && !Number.isInteger(entry.extraPoints)) {
    errors.push(`${prefix}: extraPoints must be an integer when present`);
  }

  return errors;
}

// ─────────────────────────────────────────────────────────────────────────────
// APPLICATION VALIDATION (DB-dependent)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validates one enchantment application entry against the enchantments DB
 * and the target reference DBs (advantages/disadvantages/skills/spells).
 *
 * itemCategory must match one of enchantment_allowed_itens' values
 * ("Acessórios", "Cabeça", "Pés", etc — SLOT_MAP's Portuguese keys), OR be
 * an array of such values — used as `[ownCategory, counterpartCategory]`
 * for dual-use weapon pairs, where an entry synced from the counterpart
 * side must validate against either side's allowed list, not just this
 * instance's own category.
 */
function validateEnchantmentEntryApplication(
  entry,
  enchantmentsDb,
  targetsDb,
  itemCategory,
  index,
  parentPrefix,
) {
  const prefix = `${parentPrefix}.enchantments[${index}]`;

  const enchantment = enchantmentsDb[entry.enchantment_id];

  if (!enchantment) {
    return [`${prefix}: unknown enchantment_id "${entry.enchantment_id}"`];
  }

  const errors = [];

  const categories = Array.isArray(itemCategory)
    ? itemCategory
    : [itemCategory];

  if (
    !categories.some((category) =>
      enchantment.enchantment_allowed_itens.includes(category),
    )
  ) {
    errors.push(
      `${prefix}: enchantment "${enchantment.enchantment_name}" is not allowed on ${categories.join(" or ")}`,
    );
  }

  const type = enchantment.enchantment_effect_type;
  const isFortify = FORTIFY_EFFECT_TYPES.includes(type);
  const isWeaken = WEAKEN_EFFECT_TYPES.includes(type);

  if (VALUE_EFFECT_TYPES.includes(type)) {
    // Covers attribute, weight, damage-resistance, and elemental-resistance
    // types — same base_value/step-aligned magnitude shape for all four.
    // Percentage-flagged types (weight, elemental-resistance) carry decimal
    // fractions here (e.g. 0.05), everything else whole numbers — the
    // step-alignment math below is unit-agnostic either way.
    if (typeof entry.value !== "number") {
      errors.push(`${prefix}: value is required for ${type}`);
    } else if (isFortify && entry.value <= 0) {
      errors.push(`${prefix}: value must be positive for ${type}`);
    } else if (isWeaken && entry.value >= 0) {
      errors.push(`${prefix}: value must be negative for ${type}`);
    } else {
      const base = enchantment.enchantment_base_value;
      const step = enchantment.enchantment_step;
      const magnitude = Math.abs(entry.value);

      if (magnitude < base) {
        errors.push(`${prefix}: |value| must be >= base value (${base})`);
      } else if (step > 0) {
        const rawSteps = (magnitude - base) / step;
        const roundedSteps = Math.round(rawSteps);

        if (Math.abs(rawSteps - roundedSteps) > 1e-9) {
          errors.push(
            `${prefix}: |value| must align to steps of ${step} from base ${base}`,
          );
        }
      }
    }
  }

  if (POINT_EFFECT_TYPES.includes(type)) {
    if (typeof entry.target !== "string" || !entry.target) {
      errors.push(`${prefix}: target is required for ${type}`);
    } else {
      const source =
        type === "advantage" ? targetsDb.advantages : targetsDb.disadvantages;

      if (!source[entry.target]) {
        errors.push(`${prefix}: unknown ${type} target "${entry.target}"`);
      }
    }
  }

  if (DIFFICULTY_EFFECT_TYPES.includes(type)) {
    if (typeof entry.target !== "string" || !entry.target) {
      errors.push(`${prefix}: target is required for ${type}`);
    } else {
      const isSpell = SPELL_EFFECT_TYPES.includes(type);
      const source = isSpell ? targetsDb.spells : targetsDb.skills;

      if (!source[entry.target]) {
        errors.push(
          `${prefix}: unknown ${isSpell ? "spell" : "skill"} target "${entry.target}"`,
        );
      }
    }

    // fortify_skill/fortify_spell/weaken_skill/weaken_spell: extraPoints is
    // the modifier magnitude itself (not "extra above a grant"), so it must
    // be nonzero and match the fortify(+)/weaken(-) sign. The plain
    // "skill"/"spell" grant type is neither fortify nor weaken, so it's
    // untouched here — stays unsigned ≥ 0, checked nowhere but shape.
    if (isFortify || isWeaken) {
      const extraPoints = entry.extraPoints;

      if (typeof extraPoints !== "number") {
        errors.push(`${prefix}: extraPoints is required for ${type}`);
      } else if (isFortify && extraPoints <= 0) {
        errors.push(
          `${prefix}: extraPoints must be a positive integer for ${type}`,
        );
      } else if (isWeaken && extraPoints >= 0) {
        errors.push(
          `${prefix}: extraPoints must be a negative integer for ${type}`,
        );
      }
    } else if (entry.extraPoints !== undefined && entry.extraPoints < 0) {
      // plain "skill"/"spell" grant type — investment above the granted
      // base level, unsigned
      errors.push(`${prefix}: extraPoints must be >= 0 for ${type}`);
    }
  }

  return errors;
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  validateEnchantmentEntryShape,
  validateEnchantmentEntryApplication,
};
