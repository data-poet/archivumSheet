jest.mock("dev/public/js/engine/inventory/survivalGear/model.js", () => ({
  addSurvivalGear: jest.fn(),
  updateSurvivalGearQuantity: jest.fn(),
  removeSurvivalGear: jest.fn(),
  moveSurvivalGear: jest.fn(),
  updateSurvivalGearTypeOptions: jest.fn(),
  updateSurvivalGearNameOptions: jest.fn(),
}));

import * as model from "dev/public/js/engine/inventory/survivalGear/model.js";
import {
  handleSurvivalGearClick,
  handleSurvivalGearInput,
  handleSurvivalGearChange,
  handleAddSurvivalGear,
} from "dev/public/js/engine/inventory/survivalGear/events.js";
import { state } from "dev/public/js/state.js";
import { resetDOM } from "tests/dev/helpers/domFixture.js";
import { resetState } from "tests/dev/helpers/stateFixture.js";

function elWithClass(tag, className, dataset = {}) {
  const el = document.createElement(tag);
  className.split(" ").forEach((c) => el.classList.add(c));
  Object.entries(dataset).forEach(([k, v]) => (el.dataset[k] = v));
  return el;
}

// jsdom won't accept select.value = "x" unless a matching <option> exists.
function selectWithValue(className, dataset, value) {
  const select = elWithClass("select", className, dataset);
  const option = document.createElement("option");
  option.value = value;
  select.appendChild(option);
  select.value = value;
  return select;
}

beforeEach(() => {
  resetDOM("<div></div>");
  resetState();
  jest.clearAllMocks();

  state.data.survivalGear = [
    {
      adventure_gear_id: "GEAR-1",
      adventure_gear_name: "Corda",
      adventure_gear_type: "Ferramenta",
    },
  ];
});


describe("handleSurvivalGearClick", () => {
  test("clicking .remove-survival-gear removes that entry and returns true", () => {
    const target = elWithClass("button", "remove-survival-gear", {
      gearId: "GEAR-1",
      storedAt: "backpack",
    });

    expect(handleSurvivalGearClick({ target })).toBe(true);
    expect(model.removeSurvivalGear).toHaveBeenCalledWith("GEAR-1", "backpack");
  });

  test("an unrelated click target returns false", () => {
    const target = document.createElement("div");

    expect(handleSurvivalGearClick({ target })).toBe(false);
    expect(model.removeSurvivalGear).not.toHaveBeenCalled();
  });
});


describe("handleSurvivalGearInput", () => {
  test("typing a valid quantity into .survival-gear-qty updates it and returns true", () => {
    const target = elWithClass("input", "survival-gear-qty", {
      gearId: "GEAR-1",
      storedAt: "backpack",
    });
    target.value = "4";

    expect(handleSurvivalGearInput({ target })).toBe(true);
    expect(model.updateSurvivalGearQuantity).toHaveBeenCalledWith(
      "GEAR-1",
      "backpack",
      4,
    );
  });

  test("an in-progress '-' keystroke returns true without calling the model", () => {
    const target = elWithClass("input", "survival-gear-qty", {
      gearId: "GEAR-1",
      storedAt: "backpack",
    });
    target.value = "-";

    expect(handleSurvivalGearInput({ target })).toBe(true);
    expect(model.updateSurvivalGearQuantity).not.toHaveBeenCalled();
  });

  test("an empty value returns true without calling the model", () => {
    const target = elWithClass("input", "survival-gear-qty", {
      gearId: "GEAR-1",
      storedAt: "backpack",
    });
    target.value = "";

    expect(handleSurvivalGearInput({ target })).toBe(true);
    expect(model.updateSurvivalGearQuantity).not.toHaveBeenCalled();
  });

  test("a non-numeric value is coerced to 0", () => {
    const target = elWithClass("input", "survival-gear-qty", {
      gearId: "GEAR-1",
      storedAt: "backpack",
    });
    target.value = "xyz";

    expect(handleSurvivalGearInput({ target })).toBe(true);
    expect(model.updateSurvivalGearQuantity).toHaveBeenCalledWith(
      "GEAR-1",
      "backpack",
      0,
    );
  });

  test("missing gearId/storedAt short-circuits without calling the model", () => {
    const target = elWithClass("input", "survival-gear-qty", {});
    target.value = "4";

    expect(handleSurvivalGearInput({ target })).toBe(true);
    expect(model.updateSurvivalGearQuantity).not.toHaveBeenCalled();
  });

  test("an unrelated input target returns false", () => {
    const target = document.createElement("input");

    expect(handleSurvivalGearInput({ target })).toBe(false);
    expect(model.updateSurvivalGearQuantity).not.toHaveBeenCalled();
  });
});


describe("handleSurvivalGearChange", () => {
  test("changing .survival-gear-location-select moves the entry and returns true", () => {
    const target = selectWithValue(
      "survival-gear-location-select",
      { gearId: "GEAR-1", storedAt: "backpack" },
      "stash",
    );

    expect(handleSurvivalGearChange({ target })).toBe(true);
    expect(model.moveSurvivalGear).toHaveBeenCalledWith(
      "GEAR-1",
      "backpack",
      "stash",
    );
  });

  test("changing #survivalGearTypeFilter refreshes type options and returns true", () => {
    const target = document.createElement("select");
    target.id = "survivalGearTypeFilter";

    expect(handleSurvivalGearChange({ target })).toBe(true);
    expect(model.updateSurvivalGearTypeOptions).toHaveBeenCalledTimes(1);
  });

  test("an unrelated change target returns false", () => {
    const target = document.createElement("select");

    expect(handleSurvivalGearChange({ target })).toBe(false);
  });
});


describe("handleAddSurvivalGear", () => {
  function setUpForm({
    type = "Ferramenta",
    name = "Corda",
    qty = "1",
    storage = "backpack",
  } = {}) {
    resetDOM(`
      <select id="survivalGearTypeFilter"><option value="${type}" selected>${type}</option></select>
      <select id="survivalGearNameSelect"><option value="${name}" selected>${name}</option></select>
      <input id="survivalGearQty" value="${qty}" />
      <select id="survivalGearStorage"><option value="${storage}" selected>${storage}</option></select>
    `);
  }

  test("adds the matching gear and resets the quantity field", () => {
    setUpForm();

    handleAddSurvivalGear();

    expect(model.addSurvivalGear).toHaveBeenCalledWith("GEAR-1", 1, "backpack");
    expect(document.getElementById("survivalGearQty").value).toBe("1");
  });

  test("looks up gear by name, filtered by the selected type", () => {
    state.data.survivalGear.push({
      adventure_gear_id: "GEAR-2",
      adventure_gear_name: "Corda",
      adventure_gear_type: "Escalada",
    });
    setUpForm({ type: "Escalada" });

    handleAddSurvivalGear();

    expect(model.addSurvivalGear).toHaveBeenCalledWith("GEAR-2", 1, "backpack");
  });

  test("does nothing when no gear matches name+type", () => {
    setUpForm({ name: "Item Inexistente" });

    handleAddSurvivalGear();

    expect(model.addSurvivalGear).not.toHaveBeenCalled();
  });

  test("does nothing when required form elements are missing", () => {
    resetDOM(`<div></div>`);

    expect(() => handleAddSurvivalGear()).not.toThrow();
    expect(model.addSurvivalGear).not.toHaveBeenCalled();
  });

  test("does nothing when quantity is zero or invalid", () => {
    setUpForm({ qty: "0" });

    handleAddSurvivalGear();

    expect(model.addSurvivalGear).not.toHaveBeenCalled();
  });
});
