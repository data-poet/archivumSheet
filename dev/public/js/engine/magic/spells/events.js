import { state } from "../../../state.js";
import { removeSpell, updateSpell } from "./model.js";
import { renderSpells } from "./render.js";

// Re-renders only the spell list, not a full renderLists() sweep of all 21 sections.

function _renderSpellList(sheet) {
  requestAnimationFrame(() => {
    renderSpells(state.selected, state.data, sheet);
  });
}

export function handleSpellClick(e) {
  if (e.target.classList.contains("remove-spell")) {
    removeSpell(e.target.dataset.name);
    return true;
  }
  return false;
}

export function handleSpellInput(e) {
  if (e.target.classList.contains("spell-input")) {
    updateSpell(e.target.dataset.name, e.target.dataset.field, e.target.value);
    _renderSpellList();
    return true;
  }
  return false;
}
