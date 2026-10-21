// Shared render-scheduling helpers for the equipment events files.

import { state } from "../../../state.js";
import { DEFAULT_AUTORUN_DELAY_MS } from "../../../shared/constants.js";

const data = state.data;
const selected = state.selected;

// Re-renders only the passed render functions rather than the full renderLists() sweep — each
// one now writes through morphHTML (shared/morph.js), which preserves open <details> and
// horizontal scroll on its own, so there's no snapshot/restore to do here anymore. Still
// deferred by one rAF: callers fire from native <select> "change" handlers, and replacing the
// select's ancestor before the browser finishes its change cycle flickers (worst on mobile
// Safari).
export function createListRenderer(...renderFns) {
  return function renderScopedLists(sheet) {
    requestAnimationFrame(() => {
      renderFns.forEach((render) => render(selected, data, sheet));
    });
  };
}

// Trailing-debounced render so holding a stepper button or typing into a
// modifier field doesn't rebuild the list on every keystroke. Each call site
// gets its own timer.
export function createDeferredRender(render, delay = DEFAULT_AUTORUN_DELAY_MS) {
  let timer = null;

  return function deferRender() {
    clearTimeout(timer);
    timer = setTimeout(render, delay);
  };
}
