import { t } from "../../../localization/pt-BR/index.js";
import { calcMaxHp, calcActualHp, resolveMaterial } from "./durabilityUtils.js";
import { WEAPON_DAMAGE_TYPE_LABELS } from "../../../shared/constants.js";
import { toList } from "../../../shared/rowParsers.js";

// weapon_damage_type cells hold comma-separated sigla (e.g. "cut, pi"); render the PT-BR labels instead.
export function formatWeaponDamageType(weapon_damage_type) {
  if (!weapon_damage_type) return "—";

  return toList(weapon_damage_type)
    .map((type) => WEAPON_DAMAGE_TYPE_LABELS[type] ?? type)
    .join(", ");
}

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

/**
 * Wrap one storage-location's table (backpack/stash/camp) in a collapsed-by-default
 * <details>, keyed by location so openState.js can restore its state across re-renders.
 * `idPrefix` is optional: only a caller migrated to morphHTML needs a stable id here
 * (idiomorph's own identity tracking, not openState.js's), scoped per equipment type since
 * this block repeats per container — "backpack" alone would collide across e.g. shield's
 * and armor's own storage lists.
 */
export function renderStorageLocationBlock(location, label, tableHtml, idPrefix = "") {
  const idAttr = idPrefix ? ` id="${idPrefix}-storage-${location}"` : "";
  return `
    <details class="storage-section" data-storage-loc="${location}"${idAttr}>
      <summary class="storage-section-header">${label}</summary>
      <div class="table-wrapper table-wrapper--stack">${tableHtml}</div>
    </details>
  `;
}

/**
 * Find an instance by id across an item type's storage buckets. Buckets may be a
 * single equipped object, a flat array (backpack/stash/camp), or (armor) an array of per-slot
 * arrays — falsy and non-array buckets are normalized to a one-item array before searching.
 */
export function findInstance(buckets, instanceId) {
  for (const bucket of buckets) {
    if (!bucket) continue;
    const items = Array.isArray(bucket) ? bucket : [bucket];
    const found = items.find((item) => item && item.id === instanceId);
    if (found) return found;
  }
  return null;
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
