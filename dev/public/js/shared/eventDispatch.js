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

// Whether a click started inside one of the given elements.
//
// composedPath() is captured when the event is dispatched, so it still answers correctly if a
// handler replaced the clicked node before the event reached document — which the selectors do:
// opening one re-renders its own trigger, orphaning the span that was clicked, and a
// contains(e.target) test would then wrongly report the click as coming from outside.
export function clickStartedInside(event, ...elements) {
  const targets = elements.filter(Boolean);
  if (targets.length === 0) return false;

  const path = event.composedPath?.();
  if (path?.length) return targets.some((el) => path.includes(el));

  return targets.some((el) => el.contains(event.target));
}
