jest.mock("dev/public/js/api.js", () => ({ fetchMetaRaces: jest.fn() }));
jest.mock("dev/public/js/compute/autorun.js", () => ({
  triggerAutoRun: jest.fn(),
}));
jest.mock("dev/public/js/engine/character/metaRaces/render.js", () => ({
  renderMetaRaces: jest.fn(),
}));
jest.mock("dev/public/js/components/undo.js", () => ({
  offerUndo: jest.fn(),
}));

import { fetchMetaRaces } from "dev/public/js/api.js";
import { triggerAutoRun } from "dev/public/js/compute/autorun.js";
import { offerUndo } from "dev/public/js/components/undo.js";
import {
  loadMetaRaces,
  filterSubMetaRacesByName,
  addMetaRace,
  removeMetaRace,
} from "dev/public/js/engine/character/metaRaces/model.js";
import { state } from "dev/public/js/state.js";
import { t } from "dev/public/js/localization/pt-BR/index.js";
import { resetDOM } from "tests/dev/helpers/domFixture.js";
import { resetState } from "tests/dev/helpers/stateFixture.js";

const META_RACE_ROWS = [
  { meta_race_id: "META-000", meta_race_name: "Morto-Vivo", meta_race_sub_name: "Zumbi" },
  { meta_race_id: "META-001", meta_race_name: "Morto-Vivo", meta_race_sub_name: "Esqueleto" },
  { meta_race_id: "META-002", meta_race_name: "Solitário" }, // no sub-name -> falls back to name
];

function baseDOM() {
  return `
    <select id="metaRaceNameSelect"></select>
    <select id="metaRaceSubSelect"></select>
  `;
}

beforeEach(() => {
  resetDOM(baseDOM());
  resetState();
  jest.clearAllMocks();
});

describe("loadMetaRaces", () => {
  test("when meta-races are already loaded, just reveals the select without refetching", async () => {
    state.data.metaRaces = META_RACE_ROWS;

    await loadMetaRaces();

    expect(fetchMetaRaces).not.toHaveBeenCalled();
    expect(document.getElementById("metaRaceNameSelect").style.display).toBe("");
  });

  test("fetches and populates the name select with unique, sorted meta-race names", async () => {
    fetchMetaRaces.mockResolvedValue(META_RACE_ROWS);

    await loadMetaRaces();

    const options = Array.from(
      document.getElementById("metaRaceNameSelect").options,
    );
    expect(options.map((o) => o.value)).toEqual(["", "Morto-Vivo", "Solitário"]);
    expect(options[0].textContent).toBe(t("character.selectMetaRace"));
  });
});

describe("filterSubMetaRacesByName", () => {
  beforeEach(() => {
    state.data.metaRaces = META_RACE_ROWS;
  });

  test("an empty selection hides and resets the sub-select, without touching meta_race_ids", () => {
    document.getElementById("metaRaceSubSelect").style.display = "";
    state.selected.meta_race_ids = ["META-999"];

    filterSubMetaRacesByName();

    expect(document.getElementById("metaRaceSubSelect").style.display).toBe(
      "none",
    );
    expect(state.selected.meta_race_ids).toEqual(["META-999"]);
    expect(triggerAutoRun).not.toHaveBeenCalled();
  });

  test("populates and shows the sub-select for a name with multiple sub-meta-races, without committing", () => {
    document.getElementById("metaRaceNameSelect").innerHTML =
      `<option value="Morto-Vivo" selected>Morto-Vivo</option>`;

    filterSubMetaRacesByName();

    const subSelect = document.getElementById("metaRaceSubSelect");
    const options = Array.from(subSelect.options);
    expect(options.map((o) => o.value)).toEqual(["", "META-000", "META-001"]);
    expect(subSelect.style.display).toBe("");
    expect(state.selected.meta_race_ids).toEqual([]);
    expect(triggerAutoRun).not.toHaveBeenCalled();
  });

  test("escapes special characters in the sub-meta-race option label", () => {
    state.data.metaRaces = [
      {
        meta_race_id: "META-XSS",
        meta_race_name: "Teste",
        meta_race_sub_name: "Tom & Jerry <ok>",
      },
    ];
    document.getElementById("metaRaceNameSelect").innerHTML =
      `<option value="Teste" selected>Teste</option>`;

    filterSubMetaRacesByName();

    const subSelect = document.getElementById("metaRaceSubSelect");
    expect(subSelect.options[1].textContent).toBe("Tom & Jerry <ok>");
    expect(subSelect.innerHTML).toContain("Tom &amp; Jerry &lt;ok&gt;");
  });

  test("pre-fills (but does not commit) the sub-select when only one exists for the chosen name", () => {
    document.getElementById("metaRaceNameSelect").innerHTML =
      `<option value="Solitário" selected>Solitário</option>`;

    filterSubMetaRacesByName();

    expect(document.getElementById("metaRaceSubSelect").value).toBe("META-002");
    expect(state.selected.meta_race_ids).toEqual([]);
    expect(triggerAutoRun).not.toHaveBeenCalled();
  });
});

describe("addMetaRace", () => {
  beforeEach(() => {
    state.data.metaRaces = META_RACE_ROWS;
  });

  test("does nothing when the sub-select has no value", () => {
    document.getElementById("metaRaceSubSelect").innerHTML =
      `<option value="" selected>x</option>`;

    addMetaRace();

    expect(state.selected.meta_race_ids).toEqual([]);
    expect(triggerAutoRun).not.toHaveBeenCalled();
  });

  test("pushes the sub-select's current value into meta_race_ids and resets the picker", () => {
    document.getElementById("metaRaceNameSelect").innerHTML =
      `<option value="Morto-Vivo" selected>Morto-Vivo</option>`;
    document.getElementById("metaRaceSubSelect").innerHTML =
      `<option value="META-000" selected>Zumbi</option>`;

    addMetaRace();

    expect(state.selected.meta_race_ids).toEqual(["META-000"]);
    expect(triggerAutoRun).toHaveBeenCalledTimes(1);
    expect(document.getElementById("metaRaceNameSelect").value).toBe("");
    expect(document.getElementById("metaRaceSubSelect").style.display).toBe(
      "none",
    );
  });

  test("does not add the same meta_race_id twice", () => {
    state.selected.meta_race_ids = ["META-000"];
    document.getElementById("metaRaceSubSelect").innerHTML =
      `<option value="META-000" selected>Zumbi</option>`;

    addMetaRace();

    expect(state.selected.meta_race_ids).toEqual(["META-000"]);
  });

  test("stacks a second, different meta_race_id alongside an existing one", () => {
    state.selected.meta_race_ids = ["META-000"];
    document.getElementById("metaRaceSubSelect").innerHTML =
      `<option value="META-001" selected>Esqueleto</option>`;

    addMetaRace();

    expect(state.selected.meta_race_ids).toEqual(["META-000", "META-001"]);
  });
});

describe("removeMetaRace", () => {
  test("removes only the targeted id, triggers autorun, and offers undo", () => {
    state.selected.meta_race_ids = ["META-000", "META-001"];

    removeMetaRace("META-000");

    expect(state.selected.meta_race_ids).toEqual(["META-001"]);
    expect(triggerAutoRun).toHaveBeenCalledTimes(1);
    expect(offerUndo).toHaveBeenCalledTimes(1);
  });

  test("the offered undo restores the exact previous list", () => {
    state.selected.meta_race_ids = ["META-000", "META-001"];

    removeMetaRace("META-000");
    const restoreFn = offerUndo.mock.calls[0][0];
    restoreFn();

    expect(state.selected.meta_race_ids).toEqual(["META-000", "META-001"]);
    expect(triggerAutoRun).toHaveBeenCalledTimes(2); // once for remove, once for the undo restore
  });
});
