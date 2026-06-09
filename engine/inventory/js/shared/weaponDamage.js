// ─────────────────────────────────────────────────────────────────────────────
// WEAPON DAMAGE COMPUTATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Formats a damage string from a dice expression and a combined modifier.
 *
 * The sign is always explicit:
 *   sum = -1  → "1d6-1"
 *   sum =  0  → "1d6+0"
 *   sum =  3  → "1d6+3"
 *
 * @param {string} dice  - e.g. "1d6", "2d6"
 * @param {number} sum   - final_modifier + weapon modifier, already summed
 * @returns {string}
 */
function formatDamageString(dice, sum) {
  const sign = sum < 0 ? "-" : "+";
  return `${dice}${sign}${Math.abs(sum)}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Computes weapon_gdp_damage and/or weapon_bal_damage for a resolved weapon
 * instance, based on the character's base_damage and the weapon's own modifiers.
 *
 * Rules:
 *   - weapon_damage_type contains "Perfuração"
 *       → weapon_gdp_damage = GDP.dice + (GDP.final_modifier + weapon_gdp_modifier)
 *
 *   - weapon_damage_type contains "Contusão" or "Corte"
 *       → weapon_bal_damage = BAL.dice + (BAL.final_modifier + weapon_bal_modifier)
 *
 * Both can be present simultaneously if the damage type contains more than one
 * of the triggering substrings (e.g. "Corte, Perfuração").
 *
 * Returns an empty object if base_damage is absent or the required key is
 * missing — never throws.
 *
 * @param {string} weapon_damage_type          - e.g. "Corte, Perfuração"
 * @param {number} weapon_gdp_modifier         - weapon's own GDP modifier (weapon_final_gdp_modifier)
 * @param {number|null|undefined} weapon_bal_modifier - weapon's own BAL modifier (weapon_final_bal_modifier); may be absent on ranged weapons
 * @param {object} base_damage                 - character base_damage object { GDP: {...}, BAL: {...} }
 * @returns {{ weapon_gdp_damage?: string, weapon_bal_damage?: string }}
 */
function computeWeaponDamage(
  weapon_damage_type,
  weapon_gdp_modifier,
  weapon_bal_modifier,
  base_damage,
) {
  if (!base_damage || !weapon_damage_type) return {};

  const result = {};

  const dmgType = String(weapon_damage_type);

  // ── GDP / Perfuração ──────────────────────────────────────────────────────

  if (dmgType.includes("Perfuração")) {
    const gdp = base_damage.GDP;

    if (gdp?.dice != null && gdp?.final_modifier != null) {
      const sum = gdp.final_modifier + Number(weapon_gdp_modifier ?? 0);
      result.weapon_gdp_damage = formatDamageString(gdp.dice, sum);
    }
  }

  // ── BAL / Contusão or Corte ───────────────────────────────────────────────

  if (dmgType.includes("Contusão") || dmgType.includes("Corte")) {
    const bal = base_damage.BAL;

    if (
      bal?.dice != null &&
      bal?.final_modifier != null &&
      weapon_bal_modifier != null
    ) {
      const sum = bal.final_modifier + Number(weapon_bal_modifier);
      result.weapon_bal_damage = formatDamageString(bal.dice, sum);
    }
  }

  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  computeWeaponDamage,
  formatDamageString,
};
