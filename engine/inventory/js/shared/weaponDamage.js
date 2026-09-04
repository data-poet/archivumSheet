
// Sign is always explicit, even at 0 (e.g. "1d6+0"), to match GURPS damage notation conventions.
function formatDamageString(dice, sum) {
  const sign = sum < 0 ? "-" : "+";
  return `${dice}${sign}${Math.abs(sum)}`;
}

// Both GDP and BAL damage can be set simultaneously when weapon_damage_type names more than one type (e.g. "Corte, Perfuração"); missing base_damage/keys silently yields {} rather than throwing.
function computeWeaponDamage(
  weapon_damage_type,
  weapon_gdp_modifier,
  weapon_bal_modifier,
  base_damage,
) {
  if (!base_damage || !weapon_damage_type) return {};

  const result = {};

  const dmgType = String(weapon_damage_type);

  if (dmgType.includes("Perfuração")) {
    const gdp = base_damage.GDP;

    if (gdp?.dice != null && gdp?.final_modifier != null) {
      const sum = gdp.final_modifier + Number(weapon_gdp_modifier ?? 0);
      result.weapon_gdp_damage = formatDamageString(gdp.dice, sum);
    }
  }

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

module.exports = {
  computeWeaponDamage,
  formatDamageString,
};
