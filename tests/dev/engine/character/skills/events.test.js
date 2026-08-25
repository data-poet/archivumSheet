jest.mock("dev/public/js/engine/character/skills/model.js", () => ({
  removeSkill: jest.fn(),
  updateSkill: jest.fn(),
}));
jest.mock("dev/public/js/engine/character/skills/render.js", () => ({
  renderSkills: jest.fn(),
}));
jest.mock("dev/public/js/compute/autorun.js", () => ({
  triggerAutoRun: jest.fn(),
}));

import {
  removeSkill,
  updateSkill,
} from "dev/public/js/engine/character/skills/model.js";
import { renderSkills } from "dev/public/js/engine/character/skills/render.js";
import { triggerAutoRun } from "dev/public/js/compute/autorun.js";
import {
  handleSkillClick,
  handleSkillChange,
  handleSkillInput,
} from "dev/public/js/engine/character/skills/events.js";
import { state } from "dev/public/js/state.js";
import { resetDOM } from "tests/dev/helpers/domFixture.js";
import { resetState } from "tests/dev/helpers/stateFixture.js";

function elWithClass(tag, className, dataset = {}) {
  const el = document.createElement(tag);
  className.split(" ").forEach((c) => el.classList.add(c));
  Object.entries(dataset).forEach(([k, v]) => (el.dataset[k] = v));
  return el;
}

beforeEach(() => {
  resetDOM();
  resetState();
  jest.clearAllMocks();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe("handleSkillClick", () => {
  test("remove-skill removes by id", () => {
    const target = elWithClass("button", "remove-skill", { id: "SK-1" });
    expect(handleSkillClick({ target })).toBe(true);
    expect(removeSkill).toHaveBeenCalledWith("SK-1");
  });

  test("an unrelated click target is not handled", () => {
    const target = elWithClass("button", "something-else");
    expect(handleSkillClick({ target })).toBe(false);
  });
});

describe("handleSkillChange — skill-master-checkbox", () => {
  test("does nothing (but handled) for a skill that isn't selected", () => {
    const target = elWithClass("input", "skill-master-checkbox", {
      id: "GHOST",
    });
    target.checked = true;
    expect(handleSkillChange({ target })).toBe(true);
    expect(triggerAutoRun).not.toHaveBeenCalled();
  });

  test("sets isTrainedWithMaster and re-renders", () => {
    state.selected.skills["SK-1"] = {
      base_value: 12,
      modifier: 0,
      isTrainedWithMaster: false,
    };
    const target = elWithClass("input", "skill-master-checkbox", {
      id: "SK-1",
    });
    target.checked = true;

    handleSkillChange({ target });
    jest.advanceTimersToNextFrame();

    expect(state.selected.skills["SK-1"].isTrainedWithMaster).toBe(true);
    expect(triggerAutoRun).toHaveBeenCalledTimes(1);
    expect(renderSkills).toHaveBeenCalledTimes(1);
  });

  test("an unrelated change target is not handled", () => {
    const target = elWithClass("select", "something-else");
    expect(handleSkillChange({ target })).toBe(false);
  });
});

describe("handleSkillInput — skill-input", () => {
  test("delegates to updateSkill with id/field/value and re-renders", () => {
    resetDOM(`
      <table><tr>
        <td><input class="skill-input" data-id="SK-1" data-field="modifier" value="2" /></td>
      </tr></table>
    `);
    const target = document.querySelector(".skill-input");

    const result = handleSkillInput({ target });
    jest.advanceTimersToNextFrame();

    expect(result).toBe(true);
    expect(updateSkill).toHaveBeenCalledWith("SK-1", "modifier", "2");
    expect(renderSkills).toHaveBeenCalledTimes(1);
  });

  test("live-patches the row's final-value cell from base+modifier inputs in the same row", () => {
    resetDOM(`
      <table><tr>
        <td><input class="skill-input" data-id="SK-1" data-field="base_value" value="12" /></td>
        <td><input class="skill-input" data-id="SK-1" data-field="modifier" value="3" /></td>
        <td><strong>0</strong></td>
      </tr></table>
    `);
    const target = document.querySelector('[data-field="modifier"]');

    handleSkillInput({ target });

    expect(target.closest("tr").querySelector("strong").textContent).toBe("15");
  });

  test("treats a non-numeric base/modifier input as 0 when patching the final cell", () => {
    resetDOM(`
      <table><tr>
        <td><input class="skill-input" data-id="SK-1" data-field="base_value" value="abc" /></td>
        <td><strong>x</strong></td>
      </tr></table>
    `);
    const target = document.querySelector(".skill-input");

    handleSkillInput({ target });

    expect(target.closest("tr").querySelector("strong").textContent).toBe("0");
  });

  test("no-ops the final-cell patch (but still handles the event) when the input isn't inside a <tr>", () => {
    const target = elWithClass("input", "skill-input", {
      id: "SK-1",
      field: "modifier",
    });
    target.value = "1";
    expect(() => handleSkillInput({ target })).not.toThrow();
    expect(handleSkillInput({ target })).toBe(true);
  });

  test("an unrelated input target is not handled", () => {
    const target = elWithClass("input", "something-else");
    expect(handleSkillInput({ target })).toBe(false);
  });
});
