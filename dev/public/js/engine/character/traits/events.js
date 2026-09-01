import { state } from "../../../state.js";
import { triggerAutoRun } from "../../../compute/autorun.js";
import { removeAdv } from "./advantages/model.js";
import { removeDis } from "./disadvantages/model.js";
import { percentToDecimal } from "../../../components/resistances.js";

// ─── Click ────────────────────────────────────────────────────────────────────

export function handleTraitClick(e) {
  if (e.target.classList.contains("remove-adv")) { removeAdv(e.target.dataset.id); return true; }
  if (e.target.classList.contains("remove-dis")) { removeDis(e.target.dataset.id); return true; }
  return false;
}

// ─── Input ────────────────────────────────────────────────────────────────────

export function handleTraitInput(e) {
  const selected = state.selected;

  // ── Resume: primary attribute modifier stepper ────────────────────────────
  if (e.target.classList.contains("resume-primary-mod-input")) {
    const { attr } = e.target.dataset;
    const raw = e.target.value;

    if (/^-$|^-?\d*$/.test(raw) === false) return true; // allow partial entry
    if (raw === "-" || raw === "") return true;

    const value = parseInt(raw, 10);
    if (isNaN(value)) return true;

    // Mirror to the canonical edit-view DOM input the engine reads from
    const editInput = document.getElementById(`${attr}_mod`);
    if (editInput) {
      editInput.value = value;
      editInput.dispatchEvent(new Event("input", { bubbles: true }));
    }
    return true;
  }

  if (e.target.classList.contains("secondary-input")) {
    const { name, field } = e.target.dataset;
    const raw = e.target.value;

    if (/^-$|^-?0?\.$/.test(raw)) return true;

    const value = parseFloat(raw);
    if (isNaN(value)) return true;

    if (!selected.secondary[name]) selected.secondary[name] = { bought: 0, modifier: 0 };
    if (field === "bought") {
      if (name === "Movement") return true;
      const max = name === "BasicSpeed" ? 6 : 5;
      selected.secondary[name].bought = Math.max(0, Math.min(max, value));
    }
    if (field === "modifier") {
      // HP/Mana/Toxicity modifier tracks missing (spent/lost) points, not a
      // stat bonus — GURPS gear/enchantment bonuses flow through
      // enchantment_modifier instead, so this field is capped at 0 in both
      // edit mode (attributes.js table) and view mode (resume.js bars),
      // which share this same handler via the "secondary-input" class.
      const isVital = name === "HP" || name === "Mana" || name === "Toxicity";
      const normalized = isVital
        ? Math.min(0, value)
        : name === "BasicSpeed"
          ? Math.round(value * 2) / 2
          : value;
      selected.secondary[name].modifier = normalized;
    }
    triggerAutoRun();
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

  // Elemental resistance modifier — displayed and typed/stepped as whole
  // percentage points (e.g. "-20" for -20%), converted to the raw decimal
  // fraction the engine expects (-0.2) only when writing to state. Left
  // uncapped in both directions: the engine floors the *final* value at 0,
  // but the raw modifier itself can go arbitrarily negative or positive (a
  // character can become very weak against an element).
  if (e.target.classList.contains("resistance-input")) {
    const { type } = e.target.dataset;
    const raw = e.target.value;

    if (/^-$|^-?0?\.$/.test(raw)) return true; // allow partial entry (e.g. "-", "0.")

    const percent = parseFloat(raw);
    if (isNaN(percent)) return true;

    if (!selected.resistances[type]) selected.resistances[type] = { modifier: 0 };
    selected.resistances[type].modifier = percentToDecimal(percent);
    triggerAutoRun();
    return true;
  }

  return false;
}
