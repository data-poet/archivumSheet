// Parsing/clamping for the resume's primary-modifier and secondary-stat inputs. Split out of
// events.js so ally resume rendering can wire the same markup without pulling in that
// file's compute/autorun.js / pcEditTarget.js dependencies. `target` is whatever
// shared/editTarget.js resolves to — PC_EDIT_TARGET until an ally edit target is
// registered (see shared/editTarget.js for why this is a registration, not a page check).
import {
  UNBUYABLE_SECONDARIES,
  isVitalAttribute,
} from "../../../shared/constants.js";

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
      if (UNBUYABLE_SECONDARIES.includes(name)) return true;
      const max = name === "BasicSpeed" ? 6 : 5;
      target.setSecondary(name, "bought", Math.max(0, Math.min(max, value)));
    }
    if (field === "modifier") {
      // A vital's modifier tracks missing points, so it's capped at 0; gear bonuses flow through enchantment_modifier.
      const normalized = isVitalAttribute(name)
        ? Math.min(0, value)
        : name === "BasicSpeed"
          ? Math.round(value * 2) / 2
          : value;
      target.setSecondary(name, "modifier", normalized);
    }
    if (field === "max_modifier" && isVitalAttribute(name)) {
      target.setSecondary(name, "max_modifier", Math.min(0, value));
    }
    return true;
  }

  return false;
}
