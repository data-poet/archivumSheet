import { t } from "../../../localization/pt-BR/index.js";
import { calcMaxHp, calcActualHp, resolveMaterial } from "./durabilityUtils.js";

/**
 * Build the HP modifier input block HTML shared across all equipment renders.
 * Uses num-stepper so mobile shows ±buttons; input is type=text inputmode=numeric
 * so the minus key works on iOS.
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
      <div class="num-stepper">
        <input
          type="text"
          inputmode="numeric"
          class="${cssClass}"
          ${dataAttrs}
          value="${hpModifier || 0}"
        />
        <div class="stepper-btns">
          <button class="stepper-btn stepper-inc" tabindex="-1" aria-label="+">+</button>
          <button class="stepper-btn stepper-dec" tabindex="-1" aria-label="−">−</button>
        </div>
      </div>
      ${t("common.hp")}: <strong>${maxHp}</strong>
      ${t("common.actual")}: <strong>${actualHp}</strong>
    </div>
  `;
}

export function resolveHp(instance, baseHp, materials) {
  const material = resolveMaterial(instance, materials);
  const maxHp = calcMaxHp(baseHp, material);
  const actualHp = calcActualHp(maxHp, instance?.hit_points_modifier);
  return { maxHp, actualHp, material };
}

/**
 * Build a generic "base + runtime modifier" stepper block, styled like
 * hpModifierBlock but for an arbitrary stat (used by firearm tuning:
 * GDP modifier, TR, PREC, magazine size).
 */
export function statModifierBlock({
  label,
  baseValue,
  modifier,
  cssClass,
  dataAttrs = "",
}) {
  const actual = (Number(baseValue) || 0) + (Number(modifier) || 0);

  return `
    <div class="hp-modifier">
      ${label} ${t("common.mod")}:
      <div class="num-stepper">
        <input
          type="text"
          inputmode="numeric"
          class="${cssClass}"
          ${dataAttrs}
          value="${modifier || 0}"
        />
        <div class="stepper-btns">
          <button class="stepper-btn stepper-inc" tabindex="-1" aria-label="+">+</button>
          <button class="stepper-btn stepper-dec" tabindex="-1" aria-label="−">−</button>
        </div>
      </div>
      ${t("common.actual")}: <strong>${actual}</strong>
    </div>
  `;
}
