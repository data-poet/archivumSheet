// Injected the same way compute/autorun.js injects runEngine.
//
// The resume's attribute steppers are shared markup: the same class, the same handler,
// on both the sheet and the allies page. So the question a handler has to answer is
// "which sheet am I writing to", not "which page am I on" — detecting the page would
// scatter branches and break the moment two sheets are visible at once. Pages register
// their destination instead; callers fall back to the PC when nothing is registered,
// so the sheet keeps working without any registration at all.

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
