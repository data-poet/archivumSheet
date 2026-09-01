jest.mock("dev/public/js/api.js", () => ({ fetchAdvantages: jest.fn() }));
jest.mock("dev/public/js/compute/autorun.js", () => ({
  triggerAutoRun: jest.fn(),
}));
jest.mock("dev/public/js/components/undo.js", () => ({
  offerUndo: jest.fn(),
}));

import { fetchAdvantages } from "dev/public/js/api.js";
import { triggerAutoRun } from "dev/public/js/compute/autorun.js";
import { offerUndo } from "dev/public/js/components/undo.js";
import {
  loadAdvantages,
  filterAdvByType,
  addAdv,
  removeAdv,
} from "dev/public/js/engine/character/traits/advantages/model.js";
import { state } from "dev/public/js/state.js";
import { t } from "dev/public/js/localization/pt-BR/index.js";
import { resetDOM } from "tests/dev/helpers/domFixture.js";
import { resetState } from "tests/dev/helpers/stateFixture.js";

const ADV_ROWS = [
  {
    advantage_id: "ADV-1",
    advantage_type: "Físico",
    advantage_box_name: "Visão Aguçada",
  },
  {
    advantage_id: "ADV-2",
    advantage_type: "Mental",
    advantage_box_name: "Vontade de Ferro",
  },
  // Race-only traits are never browsable/addable — must be filtered out of
  // both the type filter and the name select.
  {
    advantage_id: "ADV-RACIAL",
    advantage_type: "Racial",
    advantage_box_name: "Visão no Escuro",
  },
];

function advDOM() {
  document.body.insertAdjacentHTML(
    "beforeend",
    `
      <select id="advTypeSelect"></select>
      <select id="advSelect"></select>
      <div id="advList"></div>
    `,
  );
}

beforeEach(() => {
  resetDOM();
  advDOM();
  resetState();
  jest.clearAllMocks();
});

describe("loadAdvantages", () => {
  test("populates the type filter with unique, sorted, non-racial types and the name select", async () => {
    fetchAdvantages.mockResolvedValue(ADV_ROWS);

    await loadAdvantages();

    const typeOptions = Array.from(
      document.getElementById("advTypeSelect").options,
    );
    expect(typeOptions.map((o) => o.value)).toEqual(["", "Físico", "Mental"]);
    expect(typeOptions[0].textContent).toBe(t("traits.typeFilter"));

    const advOptions = Array.from(document.getElementById("advSelect").options);
    expect(advOptions.map((o) => o.value)).toEqual(["ADV-1", "ADV-2"]);
    expect(advOptions[0].textContent).toBe("Visão Aguçada");
  });
});

describe("filterAdvByType", () => {
  beforeEach(() => {
    state.data.advantages = ADV_ROWS;
  });

  test("filters the name select to the chosen type", () => {
    document.getElementById("advTypeSelect").innerHTML =
      `<option value="Mental" selected>x</option>`;
    filterAdvByType();
    const options = Array.from(document.getElementById("advSelect").options);
    expect(options.map((o) => o.value)).toEqual(["ADV-2"]);
  });

  test("an empty type shows every non-racial advantage", () => {
    document.getElementById("advTypeSelect").innerHTML =
      `<option value="" selected>x</option>`;
    filterAdvByType();
    const options = Array.from(document.getElementById("advSelect").options);
    expect(options).toHaveLength(2);
  });
});

describe("addAdv", () => {
  beforeEach(() => {
    state.data.advantages = ADV_ROWS;
  });

  test("does nothing when nothing is selected", () => {
    document.getElementById("advSelect").innerHTML = "";
    addAdv();
    expect(state.selected.advantages).toEqual({});
    expect(triggerAutoRun).not.toHaveBeenCalled();
  });

  test("adds the selected advantage id and triggers autorun", () => {
    document.getElementById("advSelect").innerHTML =
      `<option value="ADV-1" selected>x</option>`;

    addAdv();

    expect(state.selected.advantages["ADV-1"]).toBe(true);
    expect(triggerAutoRun).toHaveBeenCalledTimes(1);
  });
});

describe("removeAdv", () => {
  test("removes the advantage, triggers autorun, and offers an undo that restores it", () => {
    state.selected.advantages = { "ADV-1": true, "ADV-2": true };

    removeAdv("ADV-1");

    expect(state.selected.advantages).toEqual({ "ADV-2": true });
    expect(triggerAutoRun).toHaveBeenCalledTimes(1);
    expect(offerUndo).toHaveBeenCalledWith(expect.any(Function));

    const undoFn = offerUndo.mock.calls[0][0];
    undoFn();
    expect(state.selected.advantages).toEqual({
      "ADV-1": true,
      "ADV-2": true,
    });
    expect(triggerAutoRun).toHaveBeenCalledTimes(2); // once for remove, once for undo
  });
});
