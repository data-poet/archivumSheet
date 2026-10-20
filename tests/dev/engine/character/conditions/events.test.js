jest.mock("dev/public/js/engine/character/conditions/model.js", () => ({
  setCondition: jest.fn(),
  toggleCondition: jest.fn(),
  clearConditions: jest.fn(),
}));

import {
  setCondition,
  toggleCondition,
  clearConditions,
} from "dev/public/js/engine/character/conditions/model.js";
import {
  handleConditionClick,
  handleConditionChange,
} from "dev/public/js/engine/character/conditions/events.js";

beforeEach(() => {
  document.body.innerHTML = `
    <button class="condition-remove" data-condition-key="nauseado"><span id="inner">y</span></button>
    <button class="conditions-clear">z</button>
    <input type="checkbox" class="condition-toggle" data-condition-key="dor-grave" />
    <button id="other">other</button>
  `;
  jest.clearAllMocks();
});

const click = (selector) => ({ target: document.querySelector(selector) });

describe("handleConditionClick", () => {
  test("the remove button flips its condition off", () => {
    expect(handleConditionClick(click(".condition-remove"))).toBe(true);
    expect(toggleCondition).toHaveBeenCalledWith("nauseado");
  });

  test("a click on something inside the remove button still counts", () => {
    expect(handleConditionClick(click("#inner"))).toBe(true);
    expect(toggleCondition).toHaveBeenCalledWith("nauseado");
  });

  test("the clear button clears every condition", () => {
    expect(handleConditionClick(click(".conditions-clear"))).toBe(true);
    expect(clearConditions).toHaveBeenCalledTimes(1);
  });

  test("any other click is left for the next handler", () => {
    expect(handleConditionClick(click("#other"))).toBe(false);
    expect(toggleCondition).not.toHaveBeenCalled();
    expect(clearConditions).not.toHaveBeenCalled();
  });
});

describe("handleConditionChange", () => {
  test("a checkbox sets its condition to its checked state", () => {
    const box = document.querySelector(".condition-toggle");
    box.checked = true;
    expect(handleConditionChange({ target: box })).toBe(true);
    expect(setCondition).toHaveBeenCalledWith("dor-grave", true);

    box.checked = false;
    handleConditionChange({ target: box });
    expect(setCondition).toHaveBeenLastCalledWith("dor-grave", false);
  });

  test("a change on anything else is left alone", () => {
    expect(
      handleConditionChange({ target: document.querySelector("#other") }),
    ).toBe(false);
    expect(setCondition).not.toHaveBeenCalled();
  });
});
