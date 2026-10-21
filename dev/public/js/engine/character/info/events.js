import { state } from "../../../state.js";
import { triggerAutoRun, AUTORUN_KIND } from "../../../compute/autorun.js";

const selected = state.selected;

export function handleCharacterInput(e) {
  const el = e.target;
  if (!el.classList.contains("character-input")) return false;

  const field = el.dataset.field;
  if (!field) return false;

  // Sex uses the change event, not input
  if (field === "character_sex") return true;

  let value = el.value;

  if (field === "character_age") {
    const parsed = parseInt(value, 10);
    value = isNaN(parsed) ? null : parsed;
    if (!isNaN(parsed)) el.value = parsed;
  } else if (field === "character_weight") {
    const parsed = parseFloat(value);
    value = isNaN(parsed) ? null : Math.round(parsed * 10) / 10;
  } else if (
    field === "starting_points" ||
    field === "experience_points" ||
    field === "ability_points" ||
    field === "magic_points"
  ) {
    const parsed = parseInt(value, 10);
    value = isNaN(parsed) || parsed < 0 ? null : parsed;
    if (value !== null) el.value = value;
  }

  selected.character[field] = value;
  triggerAutoRun();
  return true;
}

export function handleCharacterChange(e) {
  const el = e.target;

  if (el.id === "characterSexSelect") {
    selected.character.character_sex = el.value;
    triggerAutoRun({ kind: AUTORUN_KIND.IMMEDIATE });
    return true;
  }

  return false;
}
