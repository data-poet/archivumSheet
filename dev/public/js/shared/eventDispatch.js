// Registry for the app's three global delegated listeners (click/input/change), replacing
// events/index.js's hand-written if-chains so adding a type needs no new if-line anywhere.
// A handler returns true if it handled the event, same contract as every handleXClick/etc.
const registries = { click: [], input: [], change: [] };

export function registerDelegatedHandlers({ click, input, change } = {}) {
  if (click) registries.click.push(click);
  if (input) registries.input.push(input);
  if (change) registries.change.push(change);
}

// Call once, after all registerDelegatedHandlers() calls have run.
export function initGlobalDispatch() {
  document.addEventListener("click", (e) => _dispatch("click", e));
  document.addEventListener("input", (e) => _dispatch("input", e));
  document.addEventListener("change", (e) => _dispatch("change", e));
}

// Exposed for tests only — bindUI() runs once per page load in production.
export function _resetForTests() {
  registries.click.length = 0;
  registries.input.length = 0;
  registries.change.length = 0;
}

function _dispatch(kind, e) {
  for (const handler of registries[kind]) {
    if (handler(e)) return;
  }
}
