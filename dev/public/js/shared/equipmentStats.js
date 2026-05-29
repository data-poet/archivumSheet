/**
 * Client-side final stat resolution — mirrors the engine resolvers.
 * Used by render files to show final values without needing the engine output.
 */

function round2(v) {
  return Math.round((Number(v) || 0 + Number.EPSILON) * 100) / 100;
}

export function resolveArmorStats(armor, material) {
  if (!armor) return null;
  const dr_mod = material ? Number(material.material_dr_modifier) || 0 : 0;
  const w_mod = material ? Number(material.material_weight_modifier) || 1 : 1;
  const p_mod = material ? Number(material.material_price_modifier) || 1 : 1;
  const hp_mod = material
    ? Number(material.material_hit_points_modifier) || 1
    : 1;
  return {
    final_dr: round2(
      Number(
        armor.armor_damage_resistence || armor.armor_damage_resistance || 0,
      ) + dr_mod,
    ),
    final_weight: round2(Number(armor.armor_weight || 0) * w_mod),
    final_price: round2(Number(armor.armor_price || 0) * p_mod),
    final_hp: round2(Number(armor.armor_hit_points || 0) * hp_mod),
  };
}

export function resolveShieldStats(shield, material) {
  if (!shield) return null;
  const dr_mod = material ? Number(material.material_dr_modifier) || 0 : 0;
  const w_mod = material ? Number(material.material_weight_modifier) || 1 : 1;
  const p_mod = material ? Number(material.material_price_modifier) || 1 : 1;
  const hp_mod = material
    ? Number(material.material_hit_points_modifier) || 1
    : 1;
  return {
    final_dr: round2(
      Number(
        shield.shield_damage_resistence || shield.shield_damage_resistance || 0,
      ) + dr_mod,
    ),
    final_weight: round2(Number(shield.shield_weight || 0) * w_mod),
    final_price: round2(Number(shield.shield_price || 0) * p_mod),
    final_hp: round2(Number(shield.shield_hit_points || 0) * hp_mod),
  };
}

export function resolveMeleeStats(weapon, material) {
  if (!weapon) return null;
  const bal_mod = material ? Number(material.material_bal_modifier) || 0 : 0;
  const gdp_mod = material ? Number(material.material_gdp_modifier) || 0 : 0;
  const w_mod = material ? Number(material.material_weight_modifier) || 1 : 1;
  const p_mod = material ? Number(material.material_price_modifier) || 1 : 1;
  const hp_mod = material
    ? Number(material.material_hit_points_modifier) || 1
    : 1;
  return {
    final_bal: round2(Number(weapon.weapon_bal_modifier || 0) + bal_mod),
    final_gdp: round2(Number(weapon.weapon_gdp_modifier || 0) + gdp_mod),
    final_weight: round2(Number(weapon.weapon_weight || 0) * w_mod),
    final_price: round2(Number(weapon.weapon_price || 0) * p_mod),
    final_hp: round2(Number(weapon.weapon_hit_points || 0) * hp_mod),
  };
}

export function resolveRangedStats(weapon, material) {
  if (!weapon) return null;
  const gdp_mod = material ? Number(material.material_gdp_modifier) || 0 : 0;
  const w_mod = material ? Number(material.material_weight_modifier) || 1 : 1;
  const p_mod = material ? Number(material.material_price_modifier) || 1 : 1;
  const hp_mod = material
    ? Number(material.material_hit_points_modifier) || 1
    : 1;
  return {
    final_gdp: round2(Number(weapon.weapon_gdp_modifier || 0) + gdp_mod),
    final_weight: round2(Number(weapon.weapon_weight || 0) * w_mod),
    final_price: round2(Number(weapon.weapon_price || 0) * p_mod),
    final_hp: round2(Number(weapon.weapon_hit_points || 0) * hp_mod),
  };
}
