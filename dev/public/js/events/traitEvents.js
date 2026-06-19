import { state } from "../state.js";
import { triggerAutoRun } from "../engine/autorun.js";
import { removeAdv } from "../traits/advantages.js";
import { removeDis } from "../traits/disadvantages.js";

// ─── Click ────────────────────────────────────────────────────────────────────

export function handleTraitClick(e) {
  if (e.target.classList.contains("remove-adv")) { removeAdv(e.target.dataset.id); return true; }
  if (e.target.classList.contains("remove-dis")) { removeDis(e.target.dataset.id); return true; }
  return false;
}

// ─── Input ────────────────────────────────────────────────────────────────────

export function handleTraitInput(e) {
  const selected = state.selected;

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
      selected.secondary[name].modifier =
        name === "BasicSpeed" ? Math.round(value * 2) / 2 : value;
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

  return false;
}
