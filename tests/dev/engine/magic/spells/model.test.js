jest.mock("dev/public/js/api.js", () => ({ fetchSpells: jest.fn() }));
jest.mock("dev/public/js/compute/autorun.js", () => ({
  triggerAutoRun: jest.fn(),
}));
jest.mock("dev/public/js/components/undo.js", () => ({
  offerUndo: jest.fn(),
}));

import { fetchSpells } from "dev/public/js/api.js";
import { triggerAutoRun } from "dev/public/js/compute/autorun.js";
import { offerUndo } from "dev/public/js/components/undo.js";
import {
  loadSpells,
  filterSpellsBySchool,
  addSpell,
  removeSpell,
  updateSpell,
} from "dev/public/js/engine/magic/spells/model.js";
import { state } from "dev/public/js/state.js";
import { t } from "dev/public/js/localization/pt-BR/index.js";
import { resetDOM } from "tests/dev/helpers/domFixture.js";
import { resetState } from "tests/dev/helpers/stateFixture.js";

// Two tiers of the same spell name — the select must dedupe by spell_name, keeping one entry per name.
const SPELL_ROWS = [
  {
    spell_name: "bola-de-fogo",
    spell_box_name: "Bola de Fogo",
    spell_school: "Fogo",
    spell_tier: "Aprendiz",
  },
  {
    spell_name: "bola-de-fogo",
    spell_box_name: "Bola de Fogo (Veterano)",
    spell_school: "Fogo",
    spell_tier: "Veterano",
  },
  {
    spell_name: "curar-ferimentos",
    spell_box_name: "Curar Ferimentos",
    spell_school: "Cura",
    spell_tier: "Aprendiz",
  },
];

function spellDOM() {
  document.body.insertAdjacentHTML(
    "beforeend",
    `
      <select id="spellSchoolSelect"></select>
      <select id="spellSelect"></select>
      <div id="spellList"></div>
    `,
  );
}

beforeEach(() => {
  resetDOM();
  spellDOM();
  resetState();
  jest.clearAllMocks();
  // getSpellAttributeBase reads state.sheet.character.primary_attributes.IQ
  state.sheet = { character: { primary_attributes: { IQ: { value: 13 } } } };
});

describe("loadSpells", () => {
  test("populates the school filter (unique, sorted) and the name select (deduped by spell_name)", async () => {
    fetchSpells.mockResolvedValue(SPELL_ROWS);

    await loadSpells();

    const schoolOptions = Array.from(
      document.getElementById("spellSchoolSelect").options,
    );
    expect(schoolOptions.map((o) => o.value)).toEqual(["", "Cura", "Fogo"]);
    expect(schoolOptions[0].textContent).toBe(t("magic.schoolFilter"));

    const spellOptions = Array.from(
      document.getElementById("spellSelect").options,
    );
    // Dedup is Map-based keyed by spell_name: position comes from the first occurrence, but value from the last.
    expect(spellOptions.map((o) => o.value)).toEqual([
      "bola-de-fogo",
      "curar-ferimentos",
    ]);
    expect(spellOptions[0].textContent).toBe("Bola de Fogo (Veterano)");
  });
});

describe("filterSpellsBySchool", () => {
  beforeEach(() => {
    state.data.spells = SPELL_ROWS;
  });

  test("filters the name select to the chosen school, still deduped", () => {
    document.getElementById("spellSchoolSelect").innerHTML =
      `<option value="Fogo" selected>x</option>`;
    filterSpellsBySchool();
    const options = Array.from(document.getElementById("spellSelect").options);
    expect(options.map((o) => o.value)).toEqual(["bola-de-fogo"]);
  });

  test("an empty school shows every spell", () => {
    document.getElementById("spellSchoolSelect").innerHTML =
      `<option value="" selected>x</option>`;
    filterSpellsBySchool();
    const options = Array.from(document.getElementById("spellSelect").options);
    expect(options).toHaveLength(2);
  });
});

describe("addSpell", () => {
  test("does nothing when nothing is selected", () => {
    document.getElementById("spellSelect").innerHTML = "";
    addSpell();
    expect(state.selected.spells).toEqual({});
    expect(triggerAutoRun).not.toHaveBeenCalled();
  });

  test("adds the selected spell seeded at the current IQ base, and triggers autorun", () => {
    document.getElementById("spellSelect").innerHTML =
      `<option value="bola-de-fogo" selected>x</option>`;

    addSpell();

    expect(state.selected.spells["bola-de-fogo"]).toEqual({
      base_value: 13,
      modifier: 0,
    });
    expect(triggerAutoRun).toHaveBeenCalledTimes(1);
  });

  test("does not clobber an already-selected spell's values", () => {
    state.selected.spells["bola-de-fogo"] = { base_value: 15, modifier: 2 };
    document.getElementById("spellSelect").innerHTML =
      `<option value="bola-de-fogo" selected>x</option>`;

    addSpell();

    expect(state.selected.spells["bola-de-fogo"]).toEqual({
      base_value: 15,
      modifier: 2,
    });
  });
});

describe("removeSpell", () => {
  test("removes the spell, triggers autorun, and offers an undo that restores it", () => {
    state.selected.spells = {
      "bola-de-fogo": { base_value: 13, modifier: 0 },
      "curar-ferimentos": { base_value: 13, modifier: 1 },
    };

    removeSpell("bola-de-fogo");

    expect(state.selected.spells).toEqual({
      "curar-ferimentos": { base_value: 13, modifier: 1 },
    });
    expect(triggerAutoRun).toHaveBeenCalledTimes(1);
    expect(offerUndo).toHaveBeenCalledWith(expect.any(Function));

    const undoFn = offerUndo.mock.calls[0][0];
    undoFn();
    expect(state.selected.spells).toEqual({
      "bola-de-fogo": { base_value: 13, modifier: 0 },
      "curar-ferimentos": { base_value: 13, modifier: 1 },
    });
    expect(triggerAutoRun).toHaveBeenCalledTimes(2);
  });
});

describe("updateSpell", () => {
  test("updates the given field on an already-selected spell and triggers autorun", () => {
    state.selected.spells["bola-de-fogo"] = { base_value: 13, modifier: 0 };

    updateSpell("bola-de-fogo", "modifier", "3");

    expect(state.selected.spells["bola-de-fogo"]).toEqual({
      base_value: 13,
      modifier: 3,
    });
    expect(triggerAutoRun).toHaveBeenCalledTimes(1);
  });

  test("coerces the incoming value to a number", () => {
    state.selected.spells["bola-de-fogo"] = { base_value: 13, modifier: 0 };
    updateSpell("bola-de-fogo", "base_value", "16");
    expect(state.selected.spells["bola-de-fogo"].base_value).toBe(16);
  });

  test("is a no-op for a spell that isn't selected (e.g. a pure item grant)", () => {
    updateSpell("unknown-spell", "modifier", "5");
    expect(state.selected.spells["unknown-spell"]).toBeUndefined();
    expect(triggerAutoRun).not.toHaveBeenCalled();
  });
});
