// Parsing/clamping for the resume's primary-modifier and secondary-stat inputs. Split out of
// events.js so the allies page (which never imports compute/*, see
// tests/dev/allies/main.test.js) can wire the same resume markup without pulling in that
// file's compute/autorun.js / pcEditTarget.js dependencies. `target` is whatever
// shared/editTarget.js currently resolves to — PC_EDIT_TARGET on the sheet, allyEditTarget on
// the allies page.

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
