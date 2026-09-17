// Shared factory for the hit-points-modifier "input" branches, previously
// copy-pasted as three near-identical ~30-line blocks per equipment type across
// armor, shield, melee, ranged and firearms — 13 blocks differing only in a CSS
// class, how the instance is located, and which <strong> gets the new total.

import { state } from "../../../state.js";
import { triggerAutoRun } from "../../../compute/autorun.js";
import { clampHpModifier } from "./durabilityUtils.js";
import { resolveHp } from "./inventoryRenderUtils.js";

const data = state.data;

// Resume page HP cell: the "actual" value sits in a dedicated <strong> in the <td>.
export function updateResumeHpDisplay(inputEl, maxHp, modifier) {
  const cell = inputEl.closest("td");
  if (!cell) return;
  const actual = cell.querySelector(".resume-hp-actual");
  if (actual) actual.textContent = maxHp + (modifier || 0);
}

// hpModifierBlock's layout: <strong>max</strong> … <strong>actual</strong>.
export function updateActualHpDisplay(inputEl, maxHp, modifier) {
  const block = inputEl.closest(".hp-modifier");
  if (!block) return;
  const strongs = block.querySelectorAll("strong");
  if (strongs.length >= 2) strongs[1].textContent = maxHp + (modifier || 0);
}

// variants: array of { cssClass, findInstance(target), display }. Listing the
// resume/equipped/stored variants separately (rather than deriving them) is what
// lets armor key its equipped rows off data-slot and shield off "the one equipped
// shield" while the weapon types all key off data-instance-id.
//
// onApplied runs after hit_points_modifier is written and before the re-render —
// melee uses it to mirror the value onto a dual-use ranged counterpart.
export function createHpInputHandler({
  variants,
  catalog,
  catalogIdField,
  baseHpField,
  deferRender,
  onApplied = () => {},
}) {
  return function handleHpInput(e) {
    for (const { cssClass, findInstance, display } of variants) {
      if (!e.target.classList.contains(cssClass)) continue;

      const instance = findInstance(e.target);
      if (!instance) return true;
      if (/^-$/.test(e.target.value)) return true; // allow '-' mid-type

      const row = catalog().find(
        (r) => r[catalogIdField] === instance[catalogIdField],
      );
      const { maxHp } = resolveHp(
        instance,
        row?.[baseHpField] ?? 0,
        data.materials,
      );

      instance.hit_points_modifier = clampHpModifier(e.target.value, maxHp);
      display(e.target, maxHp, instance.hit_points_modifier);
      onApplied(instance);

      deferRender();
      triggerAutoRun();
      return true;
    }

    return false;
  };
}
