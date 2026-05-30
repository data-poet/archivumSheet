import { t } from "../localization/pt-BR.js";
import { calcMaxHp, calcActualHp, resolveMaterial } from "./durabilityUtils.js";

/**
 * Build the HP modifier input block HTML shared across all equipment renders.
 *
 * @param {Object} params
 * @param {number}      params.baseHp
 * @param {Object|null} params.material
 * @param {number}      params.hpModifier   - Current hit_points_modifier on the instance.
 * @param {string}      params.cssClass     - e.g. "equipped-armor-hp" | "stored-shield-hp"
 * @param {string}      params.dataAttrs    - Extra data-* string, e.g. data-slot="Tronco"
 * @returns {string} HTML string
 */
export function hpModifierBlock({
  baseHp,
  material,
  hpModifier,
  cssClass,
  dataAttrs = "",
}) {
  const maxHp = calcMaxHp(baseHp, material);
  const actualHp = calcActualHp(maxHp, hpModifier);

  return `
    <div class="hp-modifier">
      ${t("common.mod")}:
      <input
        type="number"
        class="${cssClass}"
        ${dataAttrs}
        min="${maxHp * -1}"
        max="0"
        value="${hpModifier || 0}"
      />
      ${t("common.hp")}: <strong>${maxHp}</strong>
      ${t("common.actual")}: <strong>${actualHp}</strong>
    </div>
  `;
}

/**
 * Derive maxHp, actualHp and material for an equipment instance.
 * Convenience wrapper used by event handlers.
 *
 * @param {Object} instance   - The selected instance (armor/shield).
 * @param {number} baseHp     - Base HP from the DB record.
 * @param {Array}  materials  - state.data.materials
 * @returns {{ maxHp: number, actualHp: number, material: Object|null }}
 */
export function resolveHp(instance, baseHp, materials) {
  const material = resolveMaterial(instance, materials);
  const maxHp = calcMaxHp(baseHp, material);
  const actualHp = calcActualHp(maxHp, instance?.hit_points_modifier);
  return { maxHp, actualHp, material };
}
