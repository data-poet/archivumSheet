// Shared render-scheduling helpers, previously copy-pasted as a private
// _renderXLists + _deferTimer/_deferRender pair in armor, shield, melee, ranged
// and firearms events.js.

import { state } from "../../../state.js";
import { snapshotAll, restoreAll } from "../../../shared/openState.js";

const data = state.data;
const selected = state.selected;

// Re-renders only the passed render functions rather than the full renderLists()
// sweep, preserving open <details> and horizontal scroll across the swap.
//
// Uses snapshotAll()/restoreAll() rather than a single-scope helper because one
// action can move an item BETWEEN an equipped container and a storage list
// (equip/unequip/move), so both need their state captured together.
//
// Deferred by one rAF because several callers fire from native <select> "change"
// handlers, and replacing the select's DOM ancestor before the browser finishes
// its own change/native-picker cycle causes a visible flicker (worst on mobile
// Safari). Restore happens in the same frame as the render, not a later one, to
// avoid painting the rebuilt DOM in its default-collapsed state first. Mirrors
// openState.js's withOpenState.
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
export function createDeferredRender(render, delay = 300) {
  let timer = null;

  return function deferRender() {
    clearTimeout(timer);
    timer = setTimeout(render, delay);
  };
}
