export function calcMaxHp(baseHp, material) {
  const base = Number(baseHp) || 0;
  const modifier = material ? Number(material.material_hit_points_modifier) || 1 : 1;
  return base * modifier;
}

export function clampHpModifier(rawValue, maxHp) {
  const str = String(rawValue ?? "");
  // Allow the user to still be typing ("-" alone, or empty) — don't clamp yet
  if (str === "" || str === "-") return 0;
  const n = parseFloat(str);
  if (isNaN(n)) return 0;
  return Math.max(maxHp * -1, Math.min(0, n));
}

export function calcActualHp(maxHp, modifier) {
  return maxHp + (Number(modifier) || 0);
}

export function resolveMaterial(instance, materials) {
  if (!instance?.material_id) return null;
  return materials.find((m) => m.material_id === instance.material_id) || null;
}
