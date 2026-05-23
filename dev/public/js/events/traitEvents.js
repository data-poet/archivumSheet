import { state } from "../state.js";
import { triggerAutoRun } from "../engine/autorun.js";
import { removeAdv } from "../traits/advantages.js";
import { removeDis } from "../traits/disadvantages.js";
import { removeSkill, updateSkill } from "../traits/skills.js";
import { removeSpell, updateSpell } from "../traits/spells.js";

const selected = state.selected;

// ─── Click ────────────────────────────────────────────────────────────────────

export function handleTraitClick(e) {
  if (e.target.classList.contains("remove-adv")) {
    removeAdv(e.target.dataset.id);
    return true;
  }
  if (e.target.classList.contains("remove-dis")) {
    removeDis(e.target.dataset.id);
    return true;
  }
  if (e.target.classList.contains("remove-skill")) {
    removeSkill(e.target.dataset.id);
    return true;
  }
  if (e.target.classList.contains("remove-spell")) {
    removeSpell(e.target.dataset.name);
    return true;
  }
  return false;
}

// ─── Input ────────────────────────────────────────────────────────────────────

export function handleTraitInput(e) {
  if (e.target.classList.contains("skill-input")) {
    updateSkill(e.target.dataset.id, e.target.dataset.field, e.target.value);
    return true;
  }

  if (e.target.classList.contains("spell-input")) {
    updateSpell(e.target.dataset.name, e.target.dataset.field, e.target.value);
    return true;
  }

  if (e.target.classList.contains("secondary-input")) {
    const { name, field } = e.target.dataset;
    const value = Number(e.target.value) || 0;

    if (!selected.secondary[name]) {
      selected.secondary[name] = { bought: 0, modifier: 0 };
    }

    if (field === "bought") {
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
    const value = Number(e.target.value) || 0;

    if (!selected.damage[type]) {
      selected.damage[type] = { modifier: 0 };
    }

    selected.damage[type].modifier = value;
    triggerAutoRun();
    return true;
  }

  return false;
}
