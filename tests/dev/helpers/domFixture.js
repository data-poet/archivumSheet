// Deliberately not a copy of index.html — only the ids/classes tests actually query, so a missing element fails loudly instead of hiding behind real markup.
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

export function resetDOM(html = DEFAULT_SKELETON) {
  document.body.innerHTML = html;
}

// Use when intentionally exercising shared/dom.js's "element not found" warning path.
export function silenceConsoleWarn() {
  const spy = jest.spyOn(console, "warn").mockImplementation(() => {});
  return spy;
}
