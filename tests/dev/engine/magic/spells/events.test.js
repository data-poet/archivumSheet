jest.mock("dev/public/js/engine/magic/spells/model.js", () => ({
  removeSpell: jest.fn(),
  updateSpell: jest.fn(),
}));

import {
  removeSpell,
  updateSpell,
} from "dev/public/js/engine/magic/spells/model.js";
import {
  handleSpellClick,
  handleSpellInput,
} from "dev/public/js/engine/magic/spells/events.js";
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

describe("handleSpellClick", () => {
  test("remove-spell delegates to removeSpell with the row's name", () => {
    const target = elWithClass("button", "remove-spell", {
      name: "bola-de-fogo",
    });
    expect(handleSpellClick({ target })).toBe(true);
    expect(removeSpell).toHaveBeenCalledWith("bola-de-fogo");
  });

  test("an unrelated click target is not handled", () => {
    const target = elWithClass("button", "something-else");
    expect(handleSpellClick({ target })).toBe(false);
  });
});

describe("handleSpellInput", () => {
  test("spell-input delegates to updateSpell with name/field/value", () => {
    const target = elWithClass(
      "input",
      "spell-input",
      { name: "bola-de-fogo", field: "modifier" },
      "2",
    );
    expect(handleSpellInput({ target })).toBe(true);
    expect(updateSpell).toHaveBeenCalledWith("bola-de-fogo", "modifier", "2");
  });

  test("an unrelated input target is not handled", () => {
    const target = elWithClass("input", "something-else");
    expect(handleSpellInput({ target })).toBe(false);
    expect(updateSpell).not.toHaveBeenCalled();
  });
});
