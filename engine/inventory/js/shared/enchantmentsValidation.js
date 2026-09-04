const {
  POINT_EFFECT_TYPES,
  SPELL_EFFECT_TYPES,
  DIFFICULTY_EFFECT_TYPES,
  VALUE_EFFECT_TYPES,
  FORTIFY_EFFECT_TYPES,
  WEAKEN_EFFECT_TYPES,
} = require("./enchantmentsConstants.js");

// Doesn't know which fields are required (that depends on effect_type, looked up from the DB) — only rejects a wrong type for a field that IS present. Sign checking happens in the application pass below.
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

// itemCategory may be an array (`[ownCategory, counterpartCategory]`) for dual-use weapon pairs, so a synced entry validates against either side's allowed list.
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

    // For fortify/weaken, extraPoints is the modifier magnitude itself, not "extra above a grant" — must match the fortify(+)/weaken(-) sign.
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
      errors.push(`${prefix}: extraPoints must be >= 0 for ${type}`);
    }
  }

  return errors;
}

module.exports = {
  validateEnchantmentEntryShape,
  validateEnchantmentEntryApplication,
};
