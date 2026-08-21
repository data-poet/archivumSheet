import { state } from "dev/public/js/state.js";

// state.js exports a single mutable object that many modules hold the same
// reference to and mutate in place — and at least one (compute/index.js)
// captures `state.selected` itself at MODULE IMPORT time, not per-call.
// Reassigning state.selected/data/ui to a brand-new object here would
// silently desync from that captured reference after the first reset. The
// real app never reassigns these wholesale either — store/characters.js's
// _applyData() always replaces sub-properties (selected.character = ...,
// selected.advantages = ..., etc.) on the SAME object. So this helper
// mirrors that: it mutates state.data/selected/ui in place (clear all own
// keys, then reassign from a pristine deep clone) rather than replacing the
// objects themselves.
const INITIAL_DATA = JSON.parse(JSON.stringify(state.data));
const INITIAL_SELECTED = JSON.parse(JSON.stringify(state.selected));
const INITIAL_UI = JSON.parse(JSON.stringify(state.ui));

function resetInPlace(target, pristine) {
  Object.keys(target).forEach((key) => delete target[key]);
  Object.assign(target, JSON.parse(JSON.stringify(pristine)));
}

/**
 * Resets state.data, state.selected, and state.ui back to their pristine
 * startup shape, in place — preserving object identity for any module that
 * captured a reference to state.data/state.selected/state.ui itself (not
 * just to `state`). Also clears state.sheet, which isn't part of the
 * initial shape but gets set by compute/index.js's runEngine() at runtime.
 */
export function resetState() {
  resetInPlace(state.data, INITIAL_DATA);
  resetInPlace(state.selected, INITIAL_SELECTED);
  resetInPlace(state.ui, INITIAL_UI);
  state.sheet = undefined;
}
