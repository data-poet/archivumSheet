/**
 * Compute the max HP of an equipment piece given its base HP and material modifier.
 *
 * @param {number} baseHp       - The base hit points from the DB record.
 * @param {Object|null} material - The material record (may be null/undefined).
 * @returns {number}
 */
export function calcMaxHp(baseHp, material) {
  const base = Number(baseHp) || 0;
  const modifier = material ? Number(material.material_hit_points_modifier) || 1 : 1;
  return base * modifier;
}

/**
 * Clamp a durability modifier value between -(maxHp) and 0.
 *
 * @param {number} value
 * @param {number} maxHp
 * @returns {number}
 */
export function clampHpModifier(value, maxHp) {
  return Math.max(maxHp * -1, Math.min(0, Number(value) || 0));
}

/**
 * Compute the actual (current) HP from maxHp and a modifier.
 *
 * @param {number} maxHp
 * @param {number} modifier
 * @returns {number}
 */
export function calcActualHp(maxHp, modifier) {
  return maxHp + (Number(modifier) || 0);
}

/**
 * Resolve the material record for an equipment instance from the materials array.
 *
 * @param {Object|null} instance   - The equipped/stored instance (has .material_id).
 * @param {Array}       materials  - Full materials array from state.data.
 * @returns {Object|null}
 */
export function resolveMaterial(instance, materials) {
  if (!instance?.material_id) return null;
  return materials.find((m) => m.material_id === instance.material_id) || null;
}
