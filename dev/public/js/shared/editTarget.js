// Injected the same way compute/autorun.js injects runEngine.
//
// The resume's attribute steppers are shared markup: the same class, the same handler,
// for both a PC and an ally being edited. So the question a handler has to answer is
// "which sheet am I writing to", not "which entry kind is active" — detecting the kind
// would scatter branches and break the moment two sheets are visible at once. Editors
// register their destination instead; callers fall back to the PC when nothing is
// registered, so the sheet keeps working without any registration at all.

let _target = null;

export function setEditTarget(target) {
  _target = target;
}

export function clearEditTarget() {
  _target = null;
}

export function getEditTarget() {
  return _target;
}
