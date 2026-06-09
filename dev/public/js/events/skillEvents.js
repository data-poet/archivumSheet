import { state } from "../state.js";
import { triggerAutoRun } from "../engine/autorun.js";
import { renderLists } from "../ui.js";
import { removeSkill, updateSkill } from "../traits/skills.js";
import { removeSpell, updateSpell } from "../traits/spells.js";
import { withOpenState, tableRowKeyFn } from "../shared/openState.js";

// ─── Click ────────────────────────────────────────────────────────────────────

export function handleSkillClick(e) {
  if (e.target.classList.contains("remove-skill")) { removeSkill(e.target.dataset.id);   return true; }
  if (e.target.classList.contains("remove-spell")) { removeSpell(e.target.dataset.name); return true; }
  return false;
}

// ─── Change ───────────────────────────────────────────────────────────────────

export function handleSkillChange(e) {
  if (e.target.classList.contains("skill-master-checkbox")) {
    const id = e.target.dataset.id;
    const selected = state.selected;
    if (!selected.skills[id]) return true;
    selected.skills[id].isTrainedWithMaster = e.target.checked;
    withOpenState("#skillList", tableRowKeyFn("data-id"), () => {
      renderLists(state.selected, state.data);
    });
    triggerAutoRun();
    return true;
  }
  return false;
}

// ─── Input ────────────────────────────────────────────────────────────────────

export function handleSkillInput(e) {
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
