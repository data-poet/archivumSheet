import { state } from "../../../state.js";
import { removeSpell, updateSpell } from "./model.js";
import { renderSpells } from "./render.js";
import { snapshotAll, restoreAll } from "../../../shared/openState.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────
// Re-render ONLY the spell list, not a full renderLists() sweep of all
// 21 sections — same reasoning/shape as shield's _renderShieldLists.

function _renderSpellList(sheet) {
  const snapshots = snapshotAll();

  requestAnimationFrame(() => {
    renderSpells(state.selected, state.data, sheet);
    restoreAll(snapshots);
  });
}

// ─── Click ────────────────────────────────────────────────────────────────────

export function handleSpellClick(e) {
  if (e.target.classList.contains("remove-spell")) {
    removeSpell(e.target.dataset.name);
    return true;
  }
  return false;
}

// ─── Input ────────────────────────────────────────────────────────────────────

export function handleSpellInput(e) {
  if (e.target.classList.contains("spell-input")) {
    updateSpell(e.target.dataset.name, e.target.dataset.field, e.target.value);
    _renderSpellList();
    return true;
  }
  return false;
}
