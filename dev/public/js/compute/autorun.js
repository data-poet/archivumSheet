import { updateActualValues } from "../ui.js";
import { DEFAULT_AUTORUN_DELAY_MS } from "../shared/constants.js";

export const AUTORUN_KIND = Object.freeze({
  IMMEDIATE: "immediate",
  BURST: "burst",
  TYPING: "typing",
});

// Trailing delay per trigger class. An unclassified call (no `kind`, or one a call site hasn't
// been migrated to yet) gets DEFAULT_AUTORUN_DELAY_MS — the single debounce every call site used
// before trigger classes existed, so it behaves exactly as it did.
const TRAILING_MS = Object.freeze({
  [AUTORUN_KIND.IMMEDIATE]: 0,
  [AUTORUN_KIND.BURST]: 120,
  [AUTORUN_KIND.TYPING]: 180,
});

// A held stepper or a long typing burst would otherwise reset the trailing timer forever and
// never actually run — only TYPING needs this because IMMEDIATE and BURST either run with no
// delay or already have a leading edge.
const TYPING_MAX_WAIT_MS = 600;

let _runEngine = null;
let _onSave = null;

let _runTimer = null;
let _typingArmedAt = null;
let _burstLeading = false;

let _saveTimer = null;

let _sequence = 0;
let _controller = null;

let _flushListenersBound = false;

// Injected at startup to avoid a circular import: autorun → compute/index.js's runEngine, and
// (for the save) → store/characters.js, which itself imports triggerAutoRun.
export function initAutoRun(runEngineFn, onSave) {
  _runEngine = runEngineFn;
  _onSave = onSave;

  if (_flushListenersBound) return;
  _flushListenersBound = true;

  // "visibilitychange" fires on tab switch and app backgrounding (mobile); "pagehide" covers an
  // actual close/navigate. Together they're the closest thing to "about to lose this edit".
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") _flushSave();
  });
  window.addEventListener("pagehide", _flushSave);
}

function _flushSave() {
  if (_saveTimer === null) return;
  clearTimeout(_saveTimer);
  _saveTimer = null;
  _onSave?.();
}

// Same trailing delay as the engine run, not a longer fixed one: a localStorage write is cheap
// and synchronous (unlike the network-bound engine call), and a backgrounded mobile tab can be
// killed by the OS without ever running the pagehide/visibilitychange flush below — so an edit
// should reach disk on the same cadence it reaches the screen, not sit in memory-only longer.
function _scheduleSave(kind) {
  const trailing = TRAILING_MS[kind] ?? DEFAULT_AUTORUN_DELAY_MS;
  clearTimeout(_saveTimer);
  _saveTimer = setTimeout(_flushSave, trailing);
}

// Aborting the previous controller before handing out a new one means at most one request is
// ever in flight; `isCurrent` is the safety net for the rare response that still lands after
// its abort (e.g. it had already fully arrived) — runEngine checks it before touching anything.
async function _run() {
  const mySequence = ++_sequence;
  _controller?.abort();
  _controller = new AbortController();

  try {
    await _runEngine?.({
      signal: _controller.signal,
      isCurrent: () => mySequence === _sequence,
    });
  } catch {
    // runEngine owns its own error rendering; this only keeps a misbehaving injected function
    // from turning into an unhandled rejection on what is otherwise a fire-and-forget call.
  } finally {
    updateActualValues();
  }
}

function _scheduleRun(kind) {
  const trailing = TRAILING_MS[kind] ?? DEFAULT_AUTORUN_DELAY_MS;

  if (kind === AUTORUN_KIND.BURST && _runTimer === null && !_burstLeading) {
    _burstLeading = true;
    _run();
  }

  if (kind === AUTORUN_KIND.TYPING) {
    _typingArmedAt ??= Date.now();
    if (Date.now() - _typingArmedAt >= TYPING_MAX_WAIT_MS) {
      clearTimeout(_runTimer);
      _runTimer = null;
      _typingArmedAt = null;
      _burstLeading = false;
      _run();
      return;
    }
  } else {
    _typingArmedAt = null;
  }

  clearTimeout(_runTimer);
  _runTimer = setTimeout(() => {
    _runTimer = null;
    _typingArmedAt = null;
    _burstLeading = false;
    _run();
  }, trailing);
}

// For a caller that already saved correctly by other means and is about to unload the page
// (e.g. allyAddInline.js's forced reload after switching the active character): without this,
// the pagehide flush fires before the engine has rebuilt for the new character, so it captures
// and persists the *previous* character's still-current state.sheet over the new one's own data.
export function cancelPendingSave() {
  clearTimeout(_saveTimer);
  _saveTimer = null;
}

export function triggerAutoRun({ kind } = {}) {
  updateActualValues();
  _scheduleRun(kind);
  _scheduleSave(kind);
}
