// +/- handling for `.num-stepper` widgets: a tap applies one step; holding one down repeats it,
// so clearing a large HP hit doesn't take as many taps as it does points of damage.

const HOLD_DELAY_MS = 400;
const HOLD_INTERVAL_MS = 80;

let _holdTimer = null;
let _holdInterval = null;

// A hold's own repeats already apply the step; the click the browser still fires on release
// must not apply one more on top of them.
let _wasHeld = false;

function _applyStep(btn) {
  const input = btn.closest(".num-stepper")?.querySelector("input");
  if (!input) return;

  const step = parseFloat(input.dataset.step ?? input.step) || 1;
  const current = parseFloat(input.value) || 0;
  let next = btn.classList.contains("stepper-inc")
    ? current + step
    : current - step;
  if (input.dataset.min !== undefined)
    next = Math.max(next, Number(input.dataset.min));
  if (input.dataset.max !== undefined)
    next = Math.min(next, Number(input.dataset.max));
  input.value = next;
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

function _stopHold() {
  clearTimeout(_holdTimer);
  clearInterval(_holdInterval);
  _holdTimer = null;
  _holdInterval = null;
}

function _startHold(btn) {
  _stopHold();
  _wasHeld = false;

  _holdTimer = setTimeout(() => {
    _wasHeld = true;
    _applyStep(btn);
    _holdInterval = setInterval(() => _applyStep(btn), HOLD_INTERVAL_MS);
  }, HOLD_DELAY_MS);

  // Short-lived and scoped to this one press — the button is re-rendered on every step anyway
  // (most steppers live in resume rows that redraw on each autorun tick), so nothing durable
  // should be attached to it.
  btn.addEventListener("pointerup", _stopHold, { once: true });
  btn.addEventListener("pointerleave", _stopHold, { once: true });
  btn.addEventListener("pointercancel", _stopHold, { once: true });
}

let _bound = false;

export function bindStepperButtons() {
  if (_bound) return;
  _bound = true;

  document.addEventListener("pointerdown", (e) => {
    const btn = e.target.closest(".stepper-btn");
    if (!btn) return;
    _startHold(btn);
  });

  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".stepper-btn");
    if (!btn) return;
    if (_wasHeld) {
      _wasHeld = false;
      return;
    }
    _applyStep(btn);
  });
}
