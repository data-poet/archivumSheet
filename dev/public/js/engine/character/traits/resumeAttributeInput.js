// Parsing/clamping for the resume's primary-modifier and secondary-stat inputs: the rules live
// here, `target` only owns where the accepted value is written.
import { state } from "../../../state.js";
import {
  hasEditableBase,
  isVitalAttribute,
} from "../../../shared/constants.js";
import {
  isUnbuyableSecondary,
  secondaryMaxBought,
  secondaryMinValue,
} from "../../../shared/rules.js";
import { updateResumeVitalDisplay } from "../../../components/resume/vitals.js";

// How far modifier can push value below its floor (e.g. Mana's 0): the gap between the floor
// and everything value sums besides modifier itself (final_base_value + enchantment + max_modifier).
function _modifierFloorFor(name) {
  const minValue = secondaryMinValue(name);
  if (minValue == null) return -Infinity;

  const attr = state.sheet?.character?.secondary_attributes?.[name];
  const total =
    (attr?.final_base_value ?? 0) +
    (attr?.enchantment_modifier ?? 0) +
    (attr?.max_modifier ?? 0);
  return minValue - total;
}

export function handleResumeAttributeInput(e, target) {
  if (e.target.classList.contains("resume-primary-mod-input")) {
    const { attr } = e.target.dataset;
    const raw = e.target.value;

    if (/^-$|^-?\d*$/.test(raw) === false) return true;
    if (raw === "-" || raw === "") return true;

    const value = parseInt(raw, 10);
    if (isNaN(value)) return true;

    target.setPrimaryModifier(attr, value);
    return true;
  }

  if (e.target.classList.contains("secondary-input")) {
    const { name, field } = e.target.dataset;
    const raw = e.target.value;

    if (/^-$|^-?0?\.$/.test(raw)) return true;

    const value = parseFloat(raw);
    if (isNaN(value)) return true;

    target.ensureSecondary(name);
    if (field === "bought") {
      if (isUnbuyableSecondary(name)) return true;
      const max = secondaryMaxBought(name);
      target.setSecondary(name, "bought", Math.max(0, Math.min(max, value)));
    }
    if (field === "base_value" && hasEditableBase(name)) {
      target.setSecondary(name, "base_value", Math.max(0, Math.round(value)));
    }
    if (field === "modifier") {
      // A vital's modifier tracks missing points, so it's capped at 0; gear bonuses flow through enchantment_modifier.
      const isVital = isVitalAttribute(name);
      let normalized = isVital
        ? Math.min(0, value)
        : name === "BasicSpeed"
          ? Math.round(value * 2) / 2
          : value;
      // A floored vital (Mana) can't be pushed below it — typing or stepping past it just stops there.
      if (isVital) normalized = Math.max(_modifierFloorFor(name), normalized);
      target.setSecondary(name, "modifier", normalized);
      // Instant bar feedback while the debounced engine run is still pending — see vitals.js.
      if (isVital) updateResumeVitalDisplay(name);
    }
    if (field === "max_modifier" && isVitalAttribute(name)) {
      target.setSecondary(name, "max_modifier", Math.min(0, value));
      updateResumeVitalDisplay(name);
    }
    return true;
  }

  return false;
}
