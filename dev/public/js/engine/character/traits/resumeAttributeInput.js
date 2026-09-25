// Parsing/clamping for the resume's primary-modifier and secondary-stat inputs. Split out of
// events.js so ally resume rendering can wire the same markup without pulling in that
// file's compute/autorun.js / pcEditTarget.js dependencies. `target` is whatever
// shared/editTarget.js resolves to — PC_EDIT_TARGET until an ally edit target is
// registered (see shared/editTarget.js for why this is a registration, not a page check).

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
      if (name === "Movement" || name === "DamageResistance") return true;
      const max = name === "BasicSpeed" ? 6 : 5;
      target.setSecondary(name, "bought", Math.max(0, Math.min(max, value)));
    }
    if (field === "modifier") {
      // HP/Mana/Toxicity modifier tracks missing (spent/lost) points, not a stat bonus, so it's capped at 0; gear/enchantment bonuses flow through enchantment_modifier instead.
      const isVital = name === "HP" || name === "Mana" || name === "Toxicity";
      const normalized = isVital
        ? Math.min(0, value)
        : name === "BasicSpeed"
          ? Math.round(value * 2) / 2
          : value;
      target.setSecondary(name, "modifier", normalized);
    }
    return true;
  }

  return false;
}
