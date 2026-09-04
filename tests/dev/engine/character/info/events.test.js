jest.mock("dev/public/js/compute/autorun.js", () => ({
  triggerAutoRun: jest.fn(),
}));

import { triggerAutoRun } from "dev/public/js/compute/autorun.js";
import {
  handleCharacterInput,
  handleCharacterChange,
} from "dev/public/js/engine/character/info/events.js";
import { state } from "dev/public/js/state.js";
import { resetState } from "tests/dev/helpers/stateFixture.js";

function inputEvent(field, value) {
  const el = document.createElement("input");
  el.classList.add("character-input");
  el.dataset.field = field;
  el.value = value;
  return { target: el };
}

beforeEach(() => {
  resetState();
  jest.clearAllMocks();
});

describe("handleCharacterInput", () => {
  test("ignores an input without the character-input class", () => {
    const el = document.createElement("input");
    el.dataset.field = "player_name";
    expect(handleCharacterInput({ target: el })).toBe(false);
  });

  test("ignores a character-input with no data-field", () => {
    const el = document.createElement("input");
    el.classList.add("character-input");
    expect(handleCharacterInput({ target: el })).toBe(false);
  });

  test("a plain text field (e.g. player_name) is stored as-is", () => {
    handleCharacterInput(inputEvent("player_name", "Aria"));
    expect(state.selected.character.player_name).toBe("Aria");
    expect(triggerAutoRun).toHaveBeenCalledTimes(1);
  });

  test("character_sex is claimed (handled) but deferred to handleCharacterChange", () => {
    const before = state.selected.character.character_sex;
    const result = handleCharacterInput(inputEvent("character_sex", "M"));
    expect(result).toBe(true);
    expect(state.selected.character.character_sex).toBe(before);
    expect(triggerAutoRun).not.toHaveBeenCalled();
  });

  describe("character_age", () => {
    test("parses a valid integer and normalizes the DOM value", () => {
      const event = inputEvent("character_age", "27.9");
      handleCharacterInput(event);
      expect(state.selected.character.character_age).toBe(27);
      expect(event.target.value).toBe("27");
    });

    test("falls back to null for an unparsable value, without touching the DOM value", () => {
      const event = inputEvent("character_age", "abc");
      handleCharacterInput(event);
      expect(state.selected.character.character_age).toBeNull();
      expect(event.target.value).toBe("abc");
    });
  });

  describe("character_weight", () => {
    test("parses a float, rounded to one decimal place", () => {
      handleCharacterInput(inputEvent("character_weight", "72.34"));
      expect(state.selected.character.character_weight).toBe(72.3);
    });

    test("falls back to null for an unparsable value", () => {
      handleCharacterInput(inputEvent("character_weight", ""));
      expect(state.selected.character.character_weight).toBeNull();
    });
  });

  describe("starting_points / experience_points", () => {
    test("parses a valid non-negative integer and normalizes the DOM value", () => {
      const event = inputEvent("starting_points", "150.7");
      handleCharacterInput(event);
      expect(state.selected.character.starting_points).toBe(150);
      expect(event.target.value).toBe("150");
    });

    test("rejects a negative value, storing null", () => {
      const event = inputEvent("experience_points", "-5");
      handleCharacterInput(event);
      expect(state.selected.character.experience_points).toBeNull();
      // DOM value is only normalized when the parsed value is accepted (non-null).
      expect(event.target.value).toBe("-5");
    });

    test("falls back to null for an unparsable value", () => {
      handleCharacterInput(inputEvent("starting_points", "abc"));
      expect(state.selected.character.starting_points).toBeNull();
    });

    test("accepts zero", () => {
      handleCharacterInput(inputEvent("experience_points", "0"));
      expect(state.selected.character.experience_points).toBe(0);
    });
  });
});

describe("handleCharacterChange", () => {
  test("characterSexSelect updates character_sex", () => {
    const el = document.createElement("select");
    el.id = "characterSexSelect";
    el.innerHTML = `<option value="F" selected>F</option>`;

    const result = handleCharacterChange({ target: el });

    expect(result).toBe(true);
    expect(state.selected.character.character_sex).toBe("F");
    expect(triggerAutoRun).toHaveBeenCalledTimes(1);
  });

  test("an unrelated change target is not handled", () => {
    const el = document.createElement("select");
    el.id = "something-else";
    expect(handleCharacterChange({ target: el })).toBe(false);
  });
});
