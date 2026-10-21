jest.mock("dev/public/js/api.js", () => ({ fetchConditions: jest.fn() }));
jest.mock("dev/public/js/compute/autorun.js", () => ({
  triggerAutoRun: jest.fn(),
  AUTORUN_KIND: { IMMEDIATE: "immediate", BURST: "burst", TYPING: "typing" },
}));
jest.mock("dev/public/js/components/undo.js", () => ({
  offerUndo: jest.fn(),
}));

import { fetchConditions } from "dev/public/js/api.js";
import { triggerAutoRun } from "dev/public/js/compute/autorun.js";
import { offerUndo } from "dev/public/js/components/undo.js";
import {
  loadConditions,
  setCondition,
  toggleCondition,
  clearConditions,
} from "dev/public/js/engine/character/conditions/model.js";
import { state } from "dev/public/js/state.js";
import { t } from "dev/public/js/localization/pt-BR/index.js";
import { resetState } from "tests/dev/helpers/stateFixture.js";

const ROWS = [
  { condition_key: "dor-moderada", condition_exclusive_group: "dor" },
  { condition_key: "dor-grave", condition_exclusive_group: "dor" },
  { condition_key: "dor-terrivel", condition_exclusive_group: "dor" },
  { condition_key: "nauseado", condition_exclusive_group: "nausea" },
  { condition_key: "atordoamento-fisico", condition_exclusive_group: "" },
];

beforeEach(() => {
  resetState();
  state.data.conditions = ROWS;
  jest.clearAllMocks();
});

describe("loadConditions", () => {
  test("fetches the catalog into state.data, replacing what was there", async () => {
    fetchConditions.mockResolvedValue([{ condition_key: "coma" }]);

    await loadConditions();

    expect(state.data.conditions).toEqual([{ condition_key: "coma" }]);
  });
});

describe("setCondition", () => {
  test("switching one on stores it as a true flag and re-runs the engine", () => {
    setCondition("nauseado", true);

    expect(state.selected.conditions).toEqual({ nauseado: true });
    expect(triggerAutoRun).toHaveBeenCalledTimes(1);
  });

  test("switching one off deletes the key instead of storing false", () => {
    state.selected.conditions = { nauseado: true, "dor-grave": true };

    setCondition("nauseado", false);

    expect(state.selected.conditions).toEqual({ "dor-grave": true });
    expect("nauseado" in state.selected.conditions).toBe(false);
  });

  test("switching one on replaces the others of its exclusive group only", () => {
    state.selected.conditions = {
      "dor-moderada": true,
      nauseado: true,
      "atordoamento-fisico": true,
    };

    setCondition("dor-terrivel", true);

    expect(state.selected.conditions).toEqual({
      "dor-terrivel": true,
      nauseado: true,
      "atordoamento-fisico": true,
    });
  });

  test("a condition outside any group leaves the rest alone", () => {
    state.selected.conditions = { "dor-grave": true };

    setCondition("atordoamento-fisico", true);

    expect(state.selected.conditions).toEqual({
      "dor-grave": true,
      "atordoamento-fisico": true,
    });
  });

  test("an unknown key is still stored, for the engine to report", () => {
    setCondition("nao-existe", true);

    expect(state.selected.conditions).toEqual({ "nao-existe": true });
  });

  test("never mutates the previous flag object", () => {
    const before = { nauseado: true };
    state.selected.conditions = before;

    setCondition("coma", true);

    expect(before).toEqual({ nauseado: true });
  });
});

describe("toggleCondition", () => {
  test("flips a condition on and off", () => {
    toggleCondition("nauseado");
    expect(state.selected.conditions).toEqual({ nauseado: true });

    toggleCondition("nauseado");
    expect(state.selected.conditions).toEqual({});
  });
});

describe("clearConditions", () => {
  test("clears every flag, re-runs the engine, and offers an undo that restores them", () => {
    state.selected.conditions = { nauseado: true, "dor-grave": true };

    clearConditions();

    expect(state.selected.conditions).toEqual({});
    expect(triggerAutoRun).toHaveBeenCalledTimes(1);
    expect(offerUndo).toHaveBeenCalledWith(
      expect.any(Function),
      t("conditions.clearedMessage"),
    );

    offerUndo.mock.calls[0][0]();

    expect(state.selected.conditions).toEqual({
      nauseado: true,
      "dor-grave": true,
    });
    expect(triggerAutoRun).toHaveBeenCalledTimes(2);
  });

  test("does nothing, and offers no undo, when nothing is on", () => {
    clearConditions();

    expect(triggerAutoRun).not.toHaveBeenCalled();
    expect(offerUndo).not.toHaveBeenCalled();
  });
});
