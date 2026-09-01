jest.mock("dev/public/js/api.js", () => ({ fetchRaces: jest.fn() }));
jest.mock("dev/public/js/compute/autorun.js", () => ({
  triggerAutoRun: jest.fn(),
}));

import { fetchRaces } from "dev/public/js/api.js";
import { triggerAutoRun } from "dev/public/js/compute/autorun.js";
import {
  loadRaces,
  filterSubRacesByName,
  selectSubRace,
  updateRaceModifiers,
  restoreRaceSelection,
} from "dev/public/js/engine/character/races/model.js";
import { state } from "dev/public/js/state.js";
import { t } from "dev/public/js/localization/pt-BR/index.js";
import { resetDOM } from "tests/dev/helpers/domFixture.js";
import { resetState } from "tests/dev/helpers/stateFixture.js";

const RACE_ROWS = [
  {
    race_id: "R1",
    race_name: "Elfo",
    race_sub_name: "Elfo Silvestre",
    race_st_modifier: "-1",
    race_dx_modifier: "2",
  },
  { race_id: "R2", race_name: "Elfo", race_sub_name: "Elfo Negro" },
  { race_id: "R3", race_name: "Anão" }, // no race_sub_name -> falls back to race_name
];

function baseDOM() {
  return `
    <button id="loadRacesBtn"></button>
    <select id="raceNameSelect"></select>
    <select id="raceSubSelect"></select>
    <div id="raceModifiers"></div>
  `;
}

beforeEach(() => {
  resetDOM(baseDOM());
  resetState();
  jest.clearAllMocks();
});

// ─────────────────────────────────────────────────────────────────────────
// loadRaces
// ─────────────────────────────────────────────────────────────────────────
describe("loadRaces", () => {
  test("when races are already loaded, just reveals the selects without refetching", async () => {
    state.data.races = RACE_ROWS;

    await loadRaces();

    expect(fetchRaces).not.toHaveBeenCalled();
    expect(document.getElementById("loadRacesBtn").style.display).toBe("none");
    expect(document.getElementById("raceNameSelect").style.display).toBe("");
  });

  test("fetches and populates the name select with unique, sorted race names", async () => {
    fetchRaces.mockResolvedValue(RACE_ROWS);

    await loadRaces();

    const options = Array.from(
      document.getElementById("raceNameSelect").options,
    );
    expect(options.map((o) => o.value)).toEqual(["", "Anão", "Elfo"]);
    expect(options[0].textContent).toBe(t("character.selectRace"));
  });

  test("restores a previously-selected race_id after loading (e.g. after import)", async () => {
    fetchRaces.mockResolvedValue(RACE_ROWS);
    // nameSelect needs a matching <option> for .value= to take effect —
    // this comes from _populateRaceNameSelect running first in loadRaces.
    state.selected.character.race_id = "R1";

    await loadRaces();

    expect(document.getElementById("raceNameSelect").value).toBe("Elfo");
    expect(document.getElementById("raceSubSelect").value).toBe("R1");
  });

  test("does not attempt restoration when no race_id is set", async () => {
    fetchRaces.mockResolvedValue(RACE_ROWS);
    await loadRaces();
    expect(document.getElementById("raceSubSelect").style.display).toBe("");
    expect(document.getElementById("raceSubSelect").innerHTML).toBe("");
  });
});

// ─────────────────────────────────────────────────────────────────────────
// filterSubRacesByName
// ─────────────────────────────────────────────────────────────────────────
describe("filterSubRacesByName", () => {
  beforeEach(() => {
    state.data.races = RACE_ROWS;
  });

  test("an empty selection hides and resets the sub-select, clears race_id", () => {
    document.getElementById("raceSubSelect").style.display = "";
    state.selected.character.race_id = "R1";

    filterSubRacesByName();

    expect(document.getElementById("raceSubSelect").style.display).toBe("none");
    expect(state.selected.character.race_id).toBeNull();
    expect(triggerAutoRun).toHaveBeenCalledTimes(1);
  });

  test("populates and shows the sub-select for a name with multiple sub-races, without auto-selecting", () => {
    document.getElementById("raceNameSelect").innerHTML =
      `<option value="Elfo" selected>Elfo</option>`;

    filterSubRacesByName();

    const subSelect = document.getElementById("raceSubSelect");
    const options = Array.from(subSelect.options);
    expect(options.map((o) => o.value)).toEqual(["", "R1", "R2"]);
    expect(subSelect.style.display).toBe("");
    expect(state.selected.character.race_id).toBeNull(); // not auto-selected
  });

  test("[fixed] escapes special characters in the sub-race option label", () => {
    state.data.races = [
      {
        race_id: "R-XSS",
        race_name: "Teste",
        race_sub_name: "Tom & Jerry <ok>",
      },
    ];
    document.getElementById("raceNameSelect").innerHTML =
      `<option value="Teste" selected>Teste</option>`;

    filterSubRacesByName();

    const subSelect = document.getElementById("raceSubSelect");
    // If "&" or ">" weren't escaped, this wouldn't round-trip as literal text.
    expect(subSelect.options[1].textContent).toBe("Tom & Jerry <ok>");
    expect(subSelect.innerHTML).toContain("Tom &amp; Jerry &lt;ok&gt;");
  });

  test("auto-selects the sub-race when only one exists for the chosen name", () => {
    document.getElementById("raceNameSelect").innerHTML =
      `<option value="Anão" selected>Anão</option>`;

    filterSubRacesByName();

    expect(document.getElementById("raceSubSelect").value).toBe("R3");
    expect(state.selected.character.race_id).toBe("R3");
    expect(triggerAutoRun).toHaveBeenCalledTimes(1); // via the nested selectSubRace() call
  });
});

// ─────────────────────────────────────────────────────────────────────────
// selectSubRace
// ─────────────────────────────────────────────────────────────────────────
describe("selectSubRace", () => {
  test("sets race_id from the sub-select's current value", () => {
    document.getElementById("raceSubSelect").innerHTML =
      `<option value="R1" selected>x</option>`;
    selectSubRace();
    expect(state.selected.character.race_id).toBe("R1");
    expect(triggerAutoRun).toHaveBeenCalledTimes(1);
  });

  test("an empty value sets race_id to null, not an empty string", () => {
    document.getElementById("raceSubSelect").innerHTML =
      `<option value="" selected>x</option>`;
    selectSubRace();
    expect(state.selected.character.race_id).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────
// updateRaceModifiers
// ─────────────────────────────────────────────────────────────────────────
describe("updateRaceModifiers", () => {
  beforeEach(() => {
    state.data.races = RACE_ROWS;
  });

  test("no-ops when the container is missing", () => {
    resetDOM();
    expect(() => updateRaceModifiers()).not.toThrow();
  });

  test("hides the container when no race_id is set", () => {
    document.getElementById("raceModifiers").style.display = "";
    updateRaceModifiers();
    expect(document.getElementById("raceModifiers").style.display).toBe("none");
  });

  test("leaves the container untouched when race_id doesn't match any race", () => {
    state.selected.character.race_id = "GHOST";
    const container = document.getElementById("raceModifiers");
    container.innerHTML = "sentinel";
    updateRaceModifiers();
    expect(container.innerHTML).toBe("sentinel");
  });

  test("hides the container when the matched race has no non-zero modifiers", () => {
    state.selected.character.race_id = "R2"; // no modifier fields at all
    document.getElementById("raceModifiers").style.display = "";
    updateRaceModifiers();
    expect(document.getElementById("raceModifiers").style.display).toBe("none");
  });

  test("renders only the non-zero modifiers, with a leading + for positive values", () => {
    state.selected.character.race_id = "R1"; // ST -1, DX +2
    updateRaceModifiers();

    const container = document.getElementById("raceModifiers");
    expect(container.style.display).toBe("");
    const tags = Array.from(container.querySelectorAll(".race-mod-tag")).map(
      (el) => el.textContent,
    );
    expect(tags).toEqual(["ST -1", "DX +2"]);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// restoreRaceSelection
// ─────────────────────────────────────────────────────────────────────────
describe("restoreRaceSelection", () => {
  beforeEach(() => {
    state.data.races = RACE_ROWS;
  });

  test("no-ops when the raceId doesn't match any race", () => {
    resetDOM(baseDOM());
    expect(() => restoreRaceSelection("GHOST")).not.toThrow();
  });

  test("no-ops when the name/sub selects are missing from the DOM", () => {
    resetDOM(); // no selects at all
    expect(() => restoreRaceSelection("R1")).not.toThrow();
  });

  test("sets both selects and renders modifiers for the restored race", () => {
    document.getElementById("raceNameSelect").innerHTML =
      `<option value="Elfo">Elfo</option>`;
    // restoreRaceSelection only syncs the DOM/modifiers display to a
    // race_id that's ALREADY in state — its real caller (store/characters.js)
    // sets selected.character.race_id before calling this, since the
    // function's job is "restore selection UI", not "select a race".
    state.selected.character.race_id = "R1";

    restoreRaceSelection("R1");

    expect(document.getElementById("raceNameSelect").value).toBe("Elfo");
    const subSelect = document.getElementById("raceSubSelect");
    expect(subSelect.value).toBe("R1");
    expect(subSelect.style.display).toBe("");
    expect(
      document
        .getElementById("raceModifiers")
        .querySelectorAll(".race-mod-tag"),
    ).toHaveLength(2); // ST and DX from R1
  });

  test("populates the sub-select with every sub-race sharing the same race_name", () => {
    document.getElementById("raceNameSelect").innerHTML =
      `<option value="Elfo">Elfo</option>`;
    restoreRaceSelection("R2");
    const options = Array.from(
      document.getElementById("raceSubSelect").options,
    );
    expect(options.map((o) => o.value)).toEqual(["", "R1", "R2"]);
  });
});
