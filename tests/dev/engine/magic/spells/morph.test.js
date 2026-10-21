import { renderSpells } from "dev/public/js/engine/magic/spells/render.js";
import { resetDOM } from "tests/dev/helpers/domFixture.js";

beforeEach(() => {
  resetDOM(`<div id="spellList"></div>`);
});

test("base-value input keeps focus/typed value and the detail <details> stays open across a re-render", () => {
  const selected = {
    spells: { "Bola de Fogo": { base_value: 12, modifier: 0 } },
  };
  const data = {
    spells: [{ spell_name: "Bola de Fogo", spell_tier: "I", spell_type: "Área" }],
  };
  const sheet = { grimoire: {} };

  renderSpells(selected, data, sheet);

  const baseInput = document.querySelector(
    '.spell-input[data-name="Bola de Fogo"][data-field="base_value"]',
  );
  baseInput.focus();
  baseInput.value = "15";

  document
    .querySelector("#detail-row-spell-Bola-de-Fogo details")
    .setAttribute("open", "");

  selected.spells["Bola de Fogo"].modifier = 1;
  renderSpells(selected, data, sheet);

  expect(document.activeElement.classList.contains("spell-input")).toBe(true);
  expect(document.activeElement.value).toBe("15");
  expect(
    document
      .querySelector("#detail-row-spell-Bola-de-Fogo details")
      .hasAttribute("open"),
  ).toBe(true);
});

test("reordering spells (adding/removing one) doesn't misattribute is-card-expanded to the wrong row", () => {
  const selected = {
    spells: {
      "Bola de Fogo": { base_value: 10, modifier: 0 },
      "Cura Leve": { base_value: 10, modifier: 0 },
    },
  };
  const data = {
    spells: [
      { spell_name: "Bola de Fogo", spell_tier: "I" },
      { spell_name: "Cura Leve", spell_tier: "I" },
    ],
  };
  const sheet = { grimoire: {} };

  renderSpells(selected, data, sheet);
  document
    .getElementById("spell-Cura-Leve")
    .classList.add("is-card-expanded");

  delete selected.spells["Bola de Fogo"];
  renderSpells(selected, data, sheet);
  selected.spells["Bola de Fogo"] = { base_value: 10, modifier: 0 };
  renderSpells(selected, data, sheet);

  expect(
    document.getElementById("spell-Cura-Leve").classList.contains("is-card-expanded"),
  ).toBe(true);
  expect(
    document.getElementById("spell-Bola-de-Fogo").classList.contains("is-card-expanded"),
  ).toBe(false);
});
