import { state } from "../state.js";
import { updateActualValues } from "../ui.js";

const ui = state.ui;

let _runEngine = null;

// Injected at startup to avoid a circular import between autorun and engine.
export function initAutoRun(runEngineFn) {
  _runEngine = runEngineFn;
}

export function triggerAutoRun() {
  updateActualValues();

  clearTimeout(ui.debounceTimer);
  ui.debounceTimer = setTimeout(() => {
    _runEngine?.().then(() => updateActualValues());
  }, 300);
}
