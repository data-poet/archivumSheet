import { state } from "dev/public/js/state.js";

// state.js exports a single mutable object that many modules hold the same
// reference to and mutate in place. Tests that touch it (store layer,
// compute/index.js, and beyond) need a way to reset it back to a pristine
// shape between tests without breaking that shared reference — so this
// mutates state's own properties in place rather than reassigning `state`
// itself.
const INITIAL_DATA = JSON.parse(JSON.stringify(state.data));
const INITIAL_SELECTED = JSON.parse(JSON.stringify(state.selected));
const INITIAL_UI = JSON.parse(JSON.stringify(state.ui));

/**
 * Resets state.data, state.selected, and state.ui back to their pristine
 * startup shape (deep clones, no shared references with any prior test's
 * mutations). Also clears state.sheet, which isn't part of the initial
 * shape but gets set by compute/index.js's runEngine() at runtime.
 */
export function resetState() {
  state.data = JSON.parse(JSON.stringify(INITIAL_DATA));
  state.selected = JSON.parse(JSON.stringify(INITIAL_SELECTED));
  state.ui = JSON.parse(JSON.stringify(INITIAL_UI));
  state.sheet = undefined;
}
