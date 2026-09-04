jest.mock("dev/public/js/engine/character/traits/advantages/model.js", () => ({
  removeAdv: jest.fn(),
}));
jest.mock(
  "dev/public/js/engine/character/traits/disadvantages/model.js",
  () => ({
    removeDis: jest.fn(),
  }),
);
jest.mock("dev/public/js/compute/autorun.js", () => ({
  triggerAutoRun: jest.fn(),
}));

import { removeAdv } from "dev/public/js/engine/character/traits/advantages/model.js";
import { removeDis } from "dev/public/js/engine/character/traits/disadvantages/model.js";
import { triggerAutoRun } from "dev/public/js/compute/autorun.js";
import {
  handleTraitClick,
  handleTraitInput,
} from "dev/public/js/engine/character/traits/events.js";
import { state } from "dev/public/js/state.js";
import { resetDOM } from "tests/dev/helpers/domFixture.js";
import { resetState } from "tests/dev/helpers/stateFixture.js";

function elWithClass(tag, className, dataset = {}, value) {
  const el = document.createElement(tag);
  className.split(" ").forEach((c) => el.classList.add(c));
  Object.entries(dataset).forEach(([k, v]) => (el.dataset[k] = v));
  if (value !== undefined) el.value = value;
  return el;
}

beforeEach(() => {
  resetDOM();
  resetState();
  jest.clearAllMocks();
});

describe("handleTraitClick", () => {
  test("remove-adv delegates to removeAdv with the row's id", () => {
    const target = elWithClass("button", "remove-adv", { id: "ADV-1" });
    expect(handleTraitClick({ target })).toBe(true);
    expect(removeAdv).toHaveBeenCalledWith("ADV-1");
  });

  test("remove-dis delegates to removeDis with the row's id", () => {
    const target = elWithClass("button", "remove-dis", { id: "DIS-1" });
    expect(handleTraitClick({ target })).toBe(true);
    expect(removeDis).toHaveBeenCalledWith("DIS-1");
  });

  test("an unrelated click target is not handled", () => {
    const target = elWithClass("button", "something-else");
    expect(handleTraitClick({ target })).toBe(false);
  });
});

describe("handleTraitInput — resume-primary-mod-input", () => {
  test("mirrors a valid integer to the canonical *_mod input and dispatches an input event", () => {
    const editInput = document.getElementById("ST_mod");
    const listener = jest.fn();
    editInput.addEventListener("input", listener);

    const target = elWithClass(
      "input",
      "resume-primary-mod-input",
      { attr: "ST" },
      "3",
    );

    expect(handleTraitInput({ target })).toBe(true);
    expect(editInput.value).toBe("3");
    expect(listener).toHaveBeenCalledTimes(1);
  });

  test("allows a lone '-' as partial entry without touching the canonical input", () => {
    const editInput = document.getElementById("ST_mod");
    const target = elWithClass(
      "input",
      "resume-primary-mod-input",
      { attr: "ST" },
      "-",
    );
    expect(handleTraitInput({ target })).toBe(true);
    expect(editInput.value).toBe("0"); // untouched default from the fixture
  });

  test("allows an empty string as partial entry without touching the canonical input", () => {
    const editInput = document.getElementById("ST_mod");
    const target = elWithClass(
      "input",
      "resume-primary-mod-input",
      { attr: "ST" },
      "",
    );
    expect(handleTraitInput({ target })).toBe(true);
    expect(editInput.value).toBe("0");
  });

  test("rejects a non-numeric value without touching the canonical input", () => {
    const editInput = document.getElementById("ST_mod");
    const target = elWithClass(
      "input",
      "resume-primary-mod-input",
      { attr: "ST" },
      "abc",
    );
    expect(handleTraitInput({ target })).toBe(true);
    expect(editInput.value).toBe("0");
  });

  test("no-ops safely (but still handles the event) when the canonical input doesn't exist", () => {
    const target = elWithClass(
      "input",
      "resume-primary-mod-input",
      { attr: "GHOST" },
      "5",
    );
    expect(() => handleTraitInput({ target })).not.toThrow();
    expect(handleTraitInput({ target })).toBe(true);
  });
});

describe("handleTraitInput — secondary-input", () => {
  test("allows a partial decimal entry ('-', '0.', etc.) without writing to state", () => {
    const target = elWithClass(
      "input",
      "secondary-input",
      { name: "HP", field: "modifier" },
      "-0.",
    );
    handleTraitInput({ target });
    expect(state.selected.secondary.HP).toBeUndefined();
    expect(triggerAutoRun).not.toHaveBeenCalled();
  });

  test("Movement's 'bought' field is never editable through this handler", () => {
    const target = elWithClass(
      "input",
      "secondary-input",
      { name: "Movement", field: "bought" },
      "4",
    );
    handleTraitInput({ target });
    // Movement's "bought" is derived elsewhere, never written here.
    expect(state.selected.secondary.Movement).toEqual({
      bought: 0,
      modifier: 0,
    });
  });

  test("clamps a non-BasicSpeed 'bought' value between 0 and 5", () => {
    const target = elWithClass(
      "input",
      "secondary-input",
      { name: "Perception", field: "bought" },
      "9",
    );
    handleTraitInput({ target });
    expect(state.selected.secondary.Perception.bought).toBe(5);
    expect(triggerAutoRun).toHaveBeenCalledTimes(1);
  });

  test("clamps BasicSpeed's 'bought' value up to 6", () => {
    const target = elWithClass(
      "input",
      "secondary-input",
      { name: "BasicSpeed", field: "bought" },
      "9",
    );
    handleTraitInput({ target });
    expect(state.selected.secondary.BasicSpeed.bought).toBe(6);
  });

  test("caps a vital stat's (HP/Mana/Toxicity) modifier at 0", () => {
    const target = elWithClass(
      "input",
      "secondary-input",
      { name: "HP", field: "modifier" },
      "3",
    );
    handleTraitInput({ target });
    expect(state.selected.secondary.HP.modifier).toBe(0);
  });

  test("allows a negative vital-stat modifier through unchanged", () => {
    const target = elWithClass(
      "input",
      "secondary-input",
      { name: "Mana", field: "modifier" },
      "-4",
    );
    handleTraitInput({ target });
    expect(state.selected.secondary.Mana.modifier).toBe(-4);
  });

  test("rounds BasicSpeed's modifier to the nearest half-point", () => {
    const target = elWithClass(
      "input",
      "secondary-input",
      { name: "BasicSpeed", field: "modifier" },
      "0.3",
    );
    handleTraitInput({ target });
    expect(state.selected.secondary.BasicSpeed.modifier).toBe(0.5);
  });

  test("stores a plain (non-vital, non-BasicSpeed) modifier as-is", () => {
    const target = elWithClass(
      "input",
      "secondary-input",
      { name: "Perception", field: "modifier" },
      "2",
    );
    handleTraitInput({ target });
    expect(state.selected.secondary.Perception.modifier).toBe(2);
    expect(triggerAutoRun).toHaveBeenCalledTimes(1);
  });

  test("an unparsable value is ignored", () => {
    const target = elWithClass(
      "input",
      "secondary-input",
      { name: "Perception", field: "modifier" },
      "abc",
    );
    handleTraitInput({ target });
    expect(state.selected.secondary.Perception).toBeUndefined();
    expect(triggerAutoRun).not.toHaveBeenCalled();
  });
});

describe("handleTraitInput — resistance-input", () => {
  test("allows partial decimal entry ('-', '0.', etc.) without writing to state", () => {
    const target = elWithClass(
      "input",
      "resistance-input",
      { type: "Fire" },
      "-0.",
    );
    handleTraitInput({ target });
    expect(state.selected.resistances.Fire).toBeUndefined();
    expect(triggerAutoRun).not.toHaveBeenCalled();
  });

  test("stores the typed whole-percentage value converted to a raw decimal fraction, and triggers autorun", () => {
    const target = elWithClass(
      "input",
      "resistance-input",
      { type: "Fire" },
      "-30",
    );
    handleTraitInput({ target });
    expect(state.selected.resistances.Fire.modifier).toBe(-0.3);
    expect(triggerAutoRun).toHaveBeenCalledTimes(1);
  });

  test("allows an uncapped positive percentage through, converted the same way (no upper bound)", () => {
    const target = elWithClass(
      "input",
      "resistance-input",
      { type: "Arcane" },
      "5000",
    );
    handleTraitInput({ target });
    expect(state.selected.resistances.Arcane.modifier).toBe(50);
  });

  test("converts a fractional percentage (e.g. 12.5%) without floating-point drift", () => {
    const target = elWithClass(
      "input",
      "resistance-input",
      { type: "Fire" },
      "12.5",
    );
    handleTraitInput({ target });
    expect(state.selected.resistances.Fire.modifier).toBe(0.125);
  });

  test("an unparsable value is ignored", () => {
    const target = elWithClass(
      "input",
      "resistance-input",
      { type: "Fire" },
      "abc",
    );
    handleTraitInput({ target });
    expect(state.selected.resistances.Fire).toBeUndefined();
    expect(triggerAutoRun).not.toHaveBeenCalled();
  });
});

describe("handleTraitInput — damage-input", () => {
  test("allows a lone '-' as partial entry without writing to state", () => {
    const target = elWithClass(
      "input",
      "damage-input",
      { type: "thrust" },
      "-",
    );
    handleTraitInput({ target });
    expect(state.selected.damage.thrust).toBeUndefined();
    expect(triggerAutoRun).not.toHaveBeenCalled();
  });

  test("stores a valid integer modifier and triggers autorun", () => {
    const target = elWithClass("input", "damage-input", { type: "swing" }, "2");
    handleTraitInput({ target });
    expect(state.selected.damage.swing.modifier).toBe(2);
    expect(triggerAutoRun).toHaveBeenCalledTimes(1);
  });

  test("an unparsable value is ignored", () => {
    const target = elWithClass(
      "input",
      "damage-input",
      { type: "thrust" },
      "abc",
    );
    handleTraitInput({ target });
    expect(state.selected.damage.thrust).toBeUndefined();
  });
});

describe("handleTraitInput — unrelated targets", () => {
  test("an unrelated input target is not handled", () => {
    const target = elWithClass("input", "something-else");
    expect(handleTraitInput({ target })).toBe(false);
  });
});
