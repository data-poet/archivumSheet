/**
 * domFixture.js
 *
 * Minimal DOM skeleton for dev-layer tests — deliberately NOT a copy of
 * index.html. Each batch should extend DEFAULT_SKELETON (or pass its own
 * markup to resetDOM) with only the container ids/classes the modules under
 * test actually query. Keeping this minimal means a fixture never silently
 * masks an "element not found" bug that shared/dom.js's el()/qs() are
 * designed to warn about.
 */

// Batch 0: just enough for the smoke test (shared/dom.js's el()).
// Batch 1: primary-attribute inputs (compute/attributes.js reads these
// directly via document.getElementById, matching index.html's real
// <input type="text" id="ST_base" value="10" /> shape).
// Batch 3: PC-info inputs (store/characters.js and store/persistence.js's
// setVal() writes to these directly via document.getElementById; shapes
// mirror index.html — characterSexSelect is a <select>, age/weight are
// type="number", the rest are type="text").
// Later batches append their own ids here as they're covered.
const DEFAULT_SKELETON = `
  <div id="smoke-test-target"></div>

  <input id="ST_base" type="text" value="10" />
  <input id="ST_mod" type="text" value="0" />
  <input id="DX_base" type="text" value="10" />
  <input id="DX_mod" type="text" value="0" />
  <input id="IQ_base" type="text" value="10" />
  <input id="IQ_mod" type="text" value="0" />
  <input id="HT_base" type="text" value="10" />
  <input id="HT_mod" type="text" value="0" />
  <input id="weight" type="number" value="0" />

  <input id="playerNameInput" type="text" />
  <input id="characterNameInput" type="text" />
  <select id="characterSexSelect">
    <option value=""></option>
    <option value="M"></option>
    <option value="F"></option>
  </select>
  <input id="characterAgeInput" type="number" />
  <input id="characterWeightInput" type="number" />
  <input id="startingPointsInput" />
  <input id="experiencePointsInput" />
`;

/**
 * Resets document.body to a known-empty state, then populates it.
 *
 * @param {string} [html] - markup to install; defaults to DEFAULT_SKELETON.
 */
export function resetDOM(html = DEFAULT_SKELETON) {
  document.body.innerHTML = html;
}

/**
 * Suppresses console.warn for the duration of a test (e.g. when
 * intentionally exercising shared/dom.js's "element not found" path) and
 * restores it afterward. Returns the jest mock so callers can assert on it.
 */
export function silenceConsoleWarn() {
  const spy = jest.spyOn(console, "warn").mockImplementation(() => {});
  return spy;
}
