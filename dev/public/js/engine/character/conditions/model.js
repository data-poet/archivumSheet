import { state } from "../../../state.js";
import { fetchConditions } from "../../../api.js";
import { triggerAutoRun, AUTORUN_KIND } from "../../../compute/autorun.js";
import { offerUndo } from "../../../components/undo.js";
import { t } from "../../../localization/pt-BR/index.js";

const data = state.data;
const selected = state.selected;

export async function loadConditions() {
  data.conditions = await fetchConditions();
}

function _exclusiveGroupOf(key) {
  return data.conditions.find((row) => row.condition_key === key)
    ?.condition_exclusive_group;
}

// Switching one on drops the others of its exclusive group, so the sheet never holds a pair the engine would refuse.
export function setCondition(key, on) {
  const next = { ...selected.conditions };

  if (on) {
    const group = _exclusiveGroupOf(key);
    if (group) {
      data.conditions
        .filter((row) => row.condition_exclusive_group === group)
        .forEach((row) => delete next[row.condition_key]);
    }
    next[key] = true;
  } else {
    delete next[key];
  }

  selected.conditions = next;
  triggerAutoRun({ kind: AUTORUN_KIND.IMMEDIATE });
}

export function toggleCondition(key) {
  setCondition(key, !selected.conditions[key]);
}

export function clearConditions() {
  const before = selected.conditions;
  if (Object.keys(before).length === 0) return;

  selected.conditions = {};
  triggerAutoRun({ kind: AUTORUN_KIND.IMMEDIATE });

  offerUndo(() => {
    selected.conditions = before;
    triggerAutoRun({ kind: AUTORUN_KIND.IMMEDIATE });
  }, t("conditions.clearedMessage"));
}
