import { state } from "../../../state.js";
import { triggerAutoRun } from "../../../compute/autorun.js";
import { removeAdv } from "./advantages/model.js";
import { removeDis } from "./disadvantages/model.js";
import { percentToDecimal } from "../../../components/resistances.js";
import { getEditTarget } from "../../../shared/editTarget.js";
import { PC_EDIT_TARGET } from "./pcEditTarget.js";

// ─── Click ────────────────────────────────────────────────────────────────────

export function handleTraitClick(e) {
  if (e.target.classList.contains("remove-adv")) { removeAdv(e.target.dataset.id); return true; }
  if (e.target.classList.contains("remove-dis")) { removeDis(e.target.dataset.id); return true; }
  return false;
}

// ─── Input ────────────────────────────────────────────────────────────────────

export function handleTraitInput(e) {
  const selected = state.selected;
  // Parsing and the clamping rules below are the domain's, so they stay here; the target
  // only owns where the accepted value is written.
  const target = getEditTarget() ?? PC_EDIT_TARGET;

  // ── Resume: primary attribute modifier stepper ────────────────────────────
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
      if (name === "Movement") return true;
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

  if (e.target.classList.contains("damage-input")) {
    const { type } = e.target.dataset;
    const raw = e.target.value;

    if (/^-$/.test(raw)) return true;

    const value = parseInt(raw, 10);
    if (isNaN(value)) return true;

    if (!selected.damage[type]) selected.damage[type] = { modifier: 0 };
    selected.damage[type].modifier = value;
    triggerAutoRun();
    return true;
  }

  // Typed as whole percentage points (e.g. "-20"), converted to the decimal fraction the engine expects (-0.2). Left uncapped: only the engine's final value is floored at 0.
  if (e.target.classList.contains("resistance-input")) {
    const { type } = e.target.dataset;
    const raw = e.target.value;

    if (/^-$|^-?0?\.$/.test(raw)) return true;

    const percent = parseFloat(raw);
    if (isNaN(percent)) return true;

    if (!selected.resistances[type])
      selected.resistances[type] = { modifier: 0 };
    selected.resistances[type].modifier = percentToDecimal(percent);
    triggerAutoRun();
    return true;
  }

  return false;
}
