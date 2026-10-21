// Parsing/clamping for the resume's primary-modifier and secondary-stat inputs: the rules live
// here, `target` only owns where the accepted value is written.
import {
  hasEditableBase,
  isVitalAttribute,
} from "../../../shared/constants.js";
import {
  isUnbuyableSecondary,
  secondaryMaxBought,
} from "../../../shared/rules.js";
import { updateResumeVitalDisplay } from "../../../components/resume/vitals.js";

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
      const normalized = isVital
        ? Math.min(0, value)
        : name === "BasicSpeed"
          ? Math.round(value * 2) / 2
          : value;
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
