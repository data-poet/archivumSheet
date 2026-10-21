// Shared render-scheduling helpers for the equipment events files.

import { state } from "../../../state.js";
import { snapshotAll, restoreAll } from "../../../shared/openState.js";
import { DEFAULT_AUTORUN_DELAY_MS } from "../../../shared/constants.js";

const data = state.data;
const selected = state.selected;

// Re-renders only the passed render functions rather than the full renderLists() sweep, preserving open <details>
// and horizontal scroll. Uses snapshotAll()/restoreAll() because one action can move an item between an equipped
// container and a storage list. Deferred by one rAF: callers fire from native <select> "change" handlers, and
// replacing the select's ancestor before the browser finishes its change cycle flickers (worst on mobile Safari);
// restoring in the same frame keeps the rebuilt DOM from painting collapsed first.
export function createListRenderer(...renderFns) {
  return function renderScopedLists(sheet) {
    const snapshots = snapshotAll();

    requestAnimationFrame(() => {
      renderFns.forEach((render) => render(selected, data, sheet));
      restoreAll(snapshots);
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
