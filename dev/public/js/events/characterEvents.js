import { state } from "../state.js";
import { triggerAutoRun } from "../engine/autorun.js";

const selected = state.selected;

// ─── Input ────────────────────────────────────────────────────────────────────

export function handleCharacterInput(e) {
  const el = e.target;
  if (!el.classList.contains("character-input")) return false;

  const field = el.dataset.field;
  if (!field) return false;

  // Sex is a select — handled by handleCharacterChange on change event
  if (field === "character_sex") return true;

  let value = el.value;

  if (field === "character_age") {
    const parsed = parseInt(value, 10);
    value = isNaN(parsed) ? null : parsed;
    if (!isNaN(parsed)) el.value = parsed;
  } else if (field === "character_weight") {
    const parsed = parseFloat(value);
    value = isNaN(parsed) ? null : Math.round(parsed * 10) / 10;
  }

  selected.character[field] = value;
  triggerAutoRun();
  return true;
}

// ─── Change ───────────────────────────────────────────────────────────────────

export function handleCharacterChange(e) {
  const el = e.target;

  if (el.id === "characterSexSelect") {
    selected.character.character_sex = el.value;
    triggerAutoRun();
    return true;
  }

  return false;
}
