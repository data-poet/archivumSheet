jest.mock("dev/public/js/api.js", () => ({ fetchDisadvantages: jest.fn() }));
jest.mock("dev/public/js/compute/autorun.js", () => ({
  triggerAutoRun: jest.fn(),
}));
jest.mock("dev/public/js/components/undo.js", () => ({
  offerUndo: jest.fn(),
}));

import { fetchDisadvantages } from "dev/public/js/api.js";
import { triggerAutoRun } from "dev/public/js/compute/autorun.js";
import { offerUndo } from "dev/public/js/components/undo.js";
import {
  loadDisadvantages,
  filterDisByType,
  addDis,
  removeDis,
} from "dev/public/js/engine/character/traits/disadvantages/model.js";
import { state } from "dev/public/js/state.js";
import { t } from "dev/public/js/localization/pt-BR/index.js";
import { resetDOM } from "tests/dev/helpers/domFixture.js";
import { resetState } from "tests/dev/helpers/stateFixture.js";

const DIS_ROWS = [
  {
    disadvantage_id: "DIS-1",
    disadvantage_type: "Físico",
    disadvantage_box_name: "Coxeadura",
  },
  {
    disadvantage_id: "DIS-2",
    disadvantage_type: "Mental",
    disadvantage_box_name: "Ganância",
  },
  // Race-only traits are never browsable/addable — filtered out of both the type filter and the name select.
  {
    disadvantage_id: "DIS-RACIAL",
    disadvantage_type: "Racial",
    disadvantage_box_name: "Vulnerabilidade Racial",
  },
];

function disDOM() {
  document.body.insertAdjacentHTML(
    "beforeend",
    `
      <select id="disTypeSelect"></select>
      <select id="disSelect"></select>
      <div id="disList"></div>
    `,
  );
}

beforeEach(() => {
  resetDOM();
  disDOM();
  resetState();
  jest.clearAllMocks();
});

describe("loadDisadvantages", () => {
  test("populates the type filter with unique, sorted, non-racial types and the name select", async () => {
    fetchDisadvantages.mockResolvedValue(DIS_ROWS);

    await loadDisadvantages();

    const typeOptions = Array.from(
      document.getElementById("disTypeSelect").options,
    );
    expect(typeOptions.map((o) => o.value)).toEqual(["", "Físico", "Mental"]);
    expect(typeOptions[0].textContent).toBe(t("traits.typeFilter"));

    const disOptions = Array.from(document.getElementById("disSelect").options);
    expect(disOptions.map((o) => o.value)).toEqual(["DIS-1", "DIS-2"]);
    expect(disOptions[0].textContent).toBe("Coxeadura");
  });
});

describe("filterDisByType", () => {
  beforeEach(() => {
    state.data.disadvantages = DIS_ROWS;
  });

  test("filters the name select to the chosen type", () => {
    document.getElementById("disTypeSelect").innerHTML =
      `<option value="Mental" selected>x</option>`;
    filterDisByType();
    const options = Array.from(document.getElementById("disSelect").options);
    expect(options.map((o) => o.value)).toEqual(["DIS-2"]);
  });

  test("an empty type shows every non-racial disadvantage", () => {
    document.getElementById("disTypeSelect").innerHTML =
      `<option value="" selected>x</option>`;
    filterDisByType();
    const options = Array.from(document.getElementById("disSelect").options);
    expect(options).toHaveLength(2);
  });
});

describe("addDis", () => {
  beforeEach(() => {
    state.data.disadvantages = DIS_ROWS;
  });

  test("does nothing when nothing is selected", () => {
    document.getElementById("disSelect").innerHTML = "";
    addDis();
    expect(state.selected.disadvantages).toEqual({});
    expect(triggerAutoRun).not.toHaveBeenCalled();
  });

  test("adds the selected disadvantage id and triggers autorun", () => {
    document.getElementById("disSelect").innerHTML =
      `<option value="DIS-1" selected>x</option>`;

    addDis();

    expect(state.selected.disadvantages["DIS-1"]).toBe(true);
    expect(triggerAutoRun).toHaveBeenCalledTimes(1);
  });
});

describe("removeDis", () => {
  test("removes the disadvantage, triggers autorun, and offers an undo that restores it", () => {
    state.selected.disadvantages = { "DIS-1": true, "DIS-2": true };

    removeDis("DIS-1");

    expect(state.selected.disadvantages).toEqual({ "DIS-2": true });
    expect(triggerAutoRun).toHaveBeenCalledTimes(1);
    expect(offerUndo).toHaveBeenCalledWith(expect.any(Function));

    const undoFn = offerUndo.mock.calls[0][0];
    undoFn();
    expect(state.selected.disadvantages).toEqual({
      "DIS-1": true,
      "DIS-2": true,
    });
    expect(triggerAutoRun).toHaveBeenCalledTimes(2); // once for remove, once for undo
  });
});
