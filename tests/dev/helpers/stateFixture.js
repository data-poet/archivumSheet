import { state } from "dev/public/js/state.js";

// compute/index.js captures `state.selected` by reference at import time; mutate it in place here instead of reassigning, or tests desync from that reference.
const INITIAL_DATA = JSON.parse(JSON.stringify(state.data));
const INITIAL_SELECTED = JSON.parse(JSON.stringify(state.selected));
const INITIAL_UI = JSON.parse(JSON.stringify(state.ui));

function resetInPlace(target, pristine) {
  Object.keys(target).forEach((key) => delete target[key]);
  Object.assign(target, JSON.parse(JSON.stringify(pristine)));
}

// Also clears state.sheet, which runEngine() sets at runtime but isn't part of the initial shape.
export function resetState() {
  resetInPlace(state.data, INITIAL_DATA);
  resetInPlace(state.selected, INITIAL_SELECTED);
  resetInPlace(state.ui, INITIAL_UI);
  state.sheet = undefined;
}
