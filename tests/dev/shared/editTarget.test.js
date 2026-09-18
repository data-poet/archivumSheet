// R3/R4: attribute writes go to a registered destination, not to a page-detected one.
// The point of these tests is that a non-PC target receives the write and the PC's own
// state is left untouched — that's what stops an ally's stepper editing the character.
jest.mock("dev/public/js/compute/autorun.js", () => ({
  triggerAutoRun: jest.fn(),
}));
jest.mock("dev/public/js/engine/character/traits/advantages/model.js", () => ({
  removeAdv: jest.fn(),
}));
jest.mock(
  "dev/public/js/engine/character/traits/disadvantages/model.js",
  () => ({
    removeDis: jest.fn(),
  }),
);

import { triggerAutoRun } from "dev/public/js/compute/autorun.js";
import {
  setEditTarget,
  clearEditTarget,
  getEditTarget,
} from "dev/public/js/shared/editTarget.js";
import { PC_EDIT_TARGET } from "dev/public/js/engine/character/traits/pcEditTarget.js";
import { handleTraitInput } from "dev/public/js/engine/character/traits/events.js";
import { state } from "dev/public/js/state.js";
import { resetDOM } from "tests/dev/helpers/domFixture.js";
import { resetState } from "tests/dev/helpers/stateFixture.js";

function stepper(className, dataset, value) {
  const el = document.createElement("input");
  el.classList.add(className);
  Object.entries(dataset).forEach(([k, v]) => (el.dataset[k] = v));
  el.value = value;
  return el;
}

function fakeTarget() {
  return {
    primary: [],
    ensured: [],
    secondary: [],
    setPrimaryModifier(attr, value) {
      this.primary.push([attr, value]);
    },
    ensureSecondary(name) {
      this.ensured.push(name);
    },
    setSecondary(name, field, value) {
      this.secondary.push([name, field, value]);
    },
  };
}

beforeEach(() => {
  resetDOM();
  resetState();
  clearEditTarget();
  jest.clearAllMocks();
});

afterEach(() => {
  clearEditTarget();
});

describe("edit target registry", () => {
  test("nothing is registered by default", () => {
    expect(getEditTarget()).toBeNull();
  });

  test("set then clear returns to nothing registered", () => {
    const t = fakeTarget();
    setEditTarget(t);
    expect(getEditTarget()).toBe(t);
    clearEditTarget();
    expect(getEditTarget()).toBeNull();
  });
});

describe("handleTraitInput with no registered target (the sheet page)", () => {
  test("a primary modifier still reaches the canonical #<attr>_mod input", () => {
    const editInput = document.getElementById("ST_mod");
    const listener = jest.fn();
    editInput.addEventListener("input", listener);

    handleTraitInput({
      target: stepper("resume-primary-mod-input", { attr: "ST" }, "3"),
    });

    expect(editInput.value).toBe("3");
    expect(listener).toHaveBeenCalledTimes(1);
  });

  test("a secondary modifier still reaches state.selected and triggers a rebuild", () => {
    handleTraitInput({
      target: stepper(
        "secondary-input",
        { name: "Perception", field: "modifier" },
        "2",
      ),
    });

    expect(state.selected.secondary.Perception.modifier).toBe(2);
    expect(triggerAutoRun).toHaveBeenCalledTimes(1);
  });
});

describe("handleTraitInput with a registered target (the allies page)", () => {
  test("a primary modifier goes to the target and never touches #<attr>_mod", () => {
    const t = fakeTarget();
    setEditTarget(t);
    const editInput = document.getElementById("ST_mod");

    handleTraitInput({
      target: stepper("resume-primary-mod-input", { attr: "HT" }, "-2"),
    });

    expect(t.primary).toEqual([["HT", -2]]);
    expect(editInput.value).toBe("0");
  });

  test("a secondary modifier goes to the target and never touches the PC's state", () => {
    const t = fakeTarget();
    setEditTarget(t);

    handleTraitInput({
      target: stepper(
        "secondary-input",
        { name: "HP", field: "modifier" },
        "-4",
      ),
    });

    expect(t.secondary).toEqual([["HP", "modifier", -4]]);
    expect(state.selected.secondary.HP).toBeUndefined();
    expect(triggerAutoRun).not.toHaveBeenCalled();
  });

  test("the domain's clamping rules still apply before the target is called", () => {
    const t = fakeTarget();
    setEditTarget(t);

    // vitals cap at 0, BasicSpeed rounds to the nearest half, bought clamps to 5
    handleTraitInput({
      target: stepper(
        "secondary-input",
        { name: "Mana", field: "modifier" },
        "3",
      ),
    });
    handleTraitInput({
      target: stepper(
        "secondary-input",
        { name: "BasicSpeed", field: "modifier" },
        "0.3",
      ),
    });
    handleTraitInput({
      target: stepper(
        "secondary-input",
        { name: "Perception", field: "bought" },
        "9",
      ),
    });

    expect(t.secondary).toEqual([
      ["Mana", "modifier", 0],
      ["BasicSpeed", "modifier", 0.5],
      ["Perception", "bought", 5],
    ]);
  });

  test("Movement's bought is still rejected before reaching the target", () => {
    const t = fakeTarget();
    setEditTarget(t);

    handleTraitInput({
      target: stepper(
        "secondary-input",
        { name: "Movement", field: "bought" },
        "4",
      ),
    });

    expect(t.ensured).toEqual(["Movement"]);
    expect(t.secondary).toEqual([]);
  });

  test("an unparsable value reaches neither the target nor the PC", () => {
    const t = fakeTarget();
    setEditTarget(t);

    handleTraitInput({
      target: stepper(
        "secondary-input",
        { name: "Perception", field: "modifier" },
        "abc",
      ),
    });

    expect(t.secondary).toEqual([]);
    expect(t.ensured).toEqual([]);
    expect(state.selected.secondary.Perception).toBeUndefined();
  });
});

describe("PC_EDIT_TARGET", () => {
  test("setPrimaryModifier no-ops when the canonical input is absent", () => {
    resetDOM();
    expect(() => PC_EDIT_TARGET.setPrimaryModifier("GHOST", 5)).not.toThrow();
  });

  test("setSecondary creates a missing entry rather than throwing", () => {
    expect(state.selected.secondary.Will).toBeUndefined();

    PC_EDIT_TARGET.setSecondary("Will", "modifier", 3);

    expect(state.selected.secondary.Will).toEqual({ bought: 0, modifier: 3 });
  });

  test("ensureSecondary leaves an existing entry alone", () => {
    state.selected.secondary.Will = { bought: 2, modifier: -1 };

    PC_EDIT_TARGET.ensureSecondary("Will");

    expect(state.selected.secondary.Will).toEqual({ bought: 2, modifier: -1 });
  });
});
