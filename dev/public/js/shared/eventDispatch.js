/**
 * eventDispatch.js
 *
 * Generic registry for the app's three global delegated listeners
 * (click/input/change). Each equipment/character type registers its own
 * handler(s) once; dispatch tries them in registration order and stops at
 * the first one that returns true — same chain-of-responsibility semantics
 * that events/index.js's three hand-written if-chains had, just without
 * needing a new if-line (and a matching import) added in three places
 * every time a type is added.
 *
 * A handler returns true if it recognized and handled the event, false
 * (or undefined) otherwise — unchanged contract from every existing
 * handleXClick/handleXInput/handleXChange function.
 */

const registries = { click: [], input: [], change: [] };

/**
 * Register one type's delegated handlers.
 *
 * @param {Object} handlers
 * @param {(e: Event) => boolean} [handlers.click]
 * @param {(e: Event) => boolean} [handlers.input]
 * @param {(e: Event) => boolean} [handlers.change]
 */
export function registerDelegatedHandlers({ click, input, change } = {}) {
  if (click) registries.click.push(click);
  if (input) registries.input.push(input);
  if (change) registries.change.push(change);
}

/**
 * Attaches the three document-level delegated listeners. Call once, after
 * all registerDelegatedHandlers() calls have run.
 */
export function initGlobalDispatch() {
  document.addEventListener("click", (e) => _dispatch("click", e));
  document.addEventListener("input", (e) => _dispatch("input", e));
  document.addEventListener("change", (e) => _dispatch("change", e));
}

/**
 * Exposed for tests / debugging only — resets all registries. Not used by
 * app code; bindUI() only ever runs once per page load in production.
 */
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
