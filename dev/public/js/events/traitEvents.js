import { state } from "../state.js";
import { triggerAutoRun } from "../engine/autorun.js";
import { renderLists } from "../ui.js";
import { removeAdv } from "../traits/advantages.js";
import { removeDis } from "../traits/disadvantages.js";
import { removeSkill, updateSkill } from "../traits/skills.js";
import { removeSpell, updateSpell } from "../traits/spells.js";
import { withOpenState, tableRowKeyFn } from "../shared/openState.js";

const selected = state.selected;

// ─── Click ────────────────────────────────────────────────────────────────────

export function handleTraitClick(e) {
  if (e.target.classList.contains("remove-adv"))   { removeAdv(e.target.dataset.id);     return true; }
  if (e.target.classList.contains("remove-dis"))   { removeDis(e.target.dataset.id);     return true; }
  if (e.target.classList.contains("remove-skill")) { removeSkill(e.target.dataset.id);   return true; }
  if (e.target.classList.contains("remove-spell")) { removeSpell(e.target.dataset.name); return true; }
  return false;
}

// ─── Input ────────────────────────────────────────────────────────────────────

export function handleTraitInput(e) {
  if (e.target.classList.contains("skill-input")) {
    updateSkill(e.target.dataset.id, e.target.dataset.field, e.target.value);
    _updateFinalCell(e.target, "skill-input", e.target.dataset.id, "data-id");
    withOpenState("#skillList", tableRowKeyFn("data-id"), () => {
      renderLists(state.selected, state.data);
    });
    return true;
  }

  if (e.target.classList.contains("spell-input")) {
    updateSpell(e.target.dataset.name, e.target.dataset.field, e.target.value);
    withOpenState("#spellList", tableRowKeyFn("data-name"), () => {
      renderLists(state.selected, state.data);
    });
    return true;
  }

  if (e.target.classList.contains("secondary-input")) {
    const { name, field } = e.target.dataset;
    const raw = e.target.value;

    // Allow the user to finish typing a negative number or decimal:
    // don't commit if the value is just "-", "-0", or ends with "."
    if (/^-$|^-?0?\.$/.test(raw)) return true;

    const value = parseFloat(raw);
    if (isNaN(value)) return true;

    if (!selected.secondary[name]) selected.secondary[name] = { bought: 0, modifier: 0 };
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
    const raw = e.target.value;

    if (/^-$/.test(raw)) return true; // allow "-" while typing

    const value = parseInt(raw, 10);
    if (isNaN(value)) return true;

    if (!selected.damage[type]) selected.damage[type] = { modifier: 0 };
    selected.damage[type].modifier = value;
    triggerAutoRun();
    return true;
  }

  return false;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function _updateFinalCell(changedInput, cssClass, key, attr) {
  const row = changedInput.closest("tr");
  if (!row) return;
  const inputs = row.querySelectorAll(`input.${cssClass}[${attr}="${key}"]`);
  let base = 0, mod = 0;
  inputs.forEach((inp) => {
    const val = Number(inp.value) || 0;
    if (inp.dataset.field === "base" || inp.dataset.field === "base_value") base = val;
    else if (inp.dataset.field === "modifier") mod = val;
  });
  const finalTd = row.querySelector("td strong");
  if (finalTd) finalTd.textContent = base + mod;
}
