import { state } from "../state.js";
import { updateActualValues } from "../ui.js";

const ui = state.ui;

let _runEngine = null;

/**
 * Call once at startup to inject the engine function.
 * This avoids a circular import between autorun ↔ engine.
 */
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
