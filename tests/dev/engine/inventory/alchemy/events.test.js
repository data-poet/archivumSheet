jest.mock("dev/public/js/engine/inventory/alchemy/model.js", () => ({
  addAlchemy: jest.fn(),
  updateAlchemyQuantity: jest.fn(),
  removeAlchemy: jest.fn(),
  moveAlchemy: jest.fn(),
  updateAlchemyTypeOptions: jest.fn(),
  updateAlchemyNameOptions: jest.fn(),
  updateAlchemyTierOptions: jest.fn(),
}));

import * as model from "dev/public/js/engine/inventory/alchemy/model.js";
import {
  handleAlchemyClick,
  handleAlchemyInput,
  handleAlchemyChange,
  handleAddAlchemy,
} from "dev/public/js/engine/inventory/alchemy/events.js";
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

  state.data.alchemy = [
    {
      consumable_id: "POTION-1",
      consumable_name: "Poção de Cura",
      consumable_type: "Poção",
      consumable_tier: "I",
    },
  ];
});

// ─────────────────────────────────────────────────────────────────────────
// handleAlchemyClick
// ─────────────────────────────────────────────────────────────────────────

describe("handleAlchemyClick", () => {
  test("clicking .remove-alchemy removes that entry and returns true", () => {
    const target = elWithClass("button", "remove-alchemy", {
      consumableId: "POTION-1",
      storedAt: "backpack",
    });

    expect(handleAlchemyClick({ target })).toBe(true);
    expect(model.removeAlchemy).toHaveBeenCalledWith("POTION-1", "backpack");
  });

  test("an unrelated click target returns false", () => {
    const target = document.createElement("div");

    expect(handleAlchemyClick({ target })).toBe(false);
    expect(model.removeAlchemy).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────
// handleAlchemyInput
// ─────────────────────────────────────────────────────────────────────────

describe("handleAlchemyInput", () => {
  test("typing a valid quantity into .alchemy-qty updates it and returns true", () => {
    const target = elWithClass("input", "alchemy-qty", {
      consumableId: "POTION-1",
      storedAt: "backpack",
    });
    target.value = "3";

    expect(handleAlchemyInput({ target })).toBe(true);
    expect(model.updateAlchemyQuantity).toHaveBeenCalledWith(
      "POTION-1",
      "backpack",
      3,
    );
  });

  test("an in-progress '-' keystroke returns true without calling the model", () => {
    const target = elWithClass("input", "alchemy-qty", {
      consumableId: "POTION-1",
      storedAt: "backpack",
    });
    target.value = "-";

    expect(handleAlchemyInput({ target })).toBe(true);
    expect(model.updateAlchemyQuantity).not.toHaveBeenCalled();
  });

  test("an empty value returns true without calling the model", () => {
    const target = elWithClass("input", "alchemy-qty", {
      consumableId: "POTION-1",
      storedAt: "backpack",
    });
    target.value = "";

    expect(handleAlchemyInput({ target })).toBe(true);
    expect(model.updateAlchemyQuantity).not.toHaveBeenCalled();
  });

  test("a non-numeric value is coerced to 0", () => {
    const target = elWithClass("input", "alchemy-qty", {
      consumableId: "POTION-1",
      storedAt: "backpack",
    });
    target.value = "xyz";

    expect(handleAlchemyInput({ target })).toBe(true);
    expect(model.updateAlchemyQuantity).toHaveBeenCalledWith(
      "POTION-1",
      "backpack",
      0,
    );
  });

  test("missing consumableId/storedAt short-circuits without calling the model", () => {
    const target = elWithClass("input", "alchemy-qty", {});
    target.value = "3";

    expect(handleAlchemyInput({ target })).toBe(true);
    expect(model.updateAlchemyQuantity).not.toHaveBeenCalled();
  });

  test("an unrelated input target returns false", () => {
    const target = document.createElement("input");

    expect(handleAlchemyInput({ target })).toBe(false);
    expect(model.updateAlchemyQuantity).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────
// handleAlchemyChange
// ─────────────────────────────────────────────────────────────────────────

describe("handleAlchemyChange", () => {
  test("changing .alchemy-location-select moves the entry and returns true", () => {
    const target = selectWithValue(
      "alchemy-location-select",
      { consumableId: "POTION-1", storedAt: "backpack" },
      "stash",
    );

    expect(handleAlchemyChange({ target })).toBe(true);
    expect(model.moveAlchemy).toHaveBeenCalledWith(
      "POTION-1",
      "backpack",
      "stash",
    );
  });

  test("changing #alchemyTypeFilter refreshes type options and returns true", () => {
    const target = document.createElement("select");
    target.id = "alchemyTypeFilter";

    expect(handleAlchemyChange({ target })).toBe(true);
    expect(model.updateAlchemyTypeOptions).toHaveBeenCalledTimes(1);
    expect(model.updateAlchemyTierOptions).not.toHaveBeenCalled();
  });

  test("changing #alchemyNameSelect refreshes tier options and returns true", () => {
    const target = document.createElement("select");
    target.id = "alchemyNameSelect";

    expect(handleAlchemyChange({ target })).toBe(true);
    expect(model.updateAlchemyTierOptions).toHaveBeenCalledTimes(1);
    expect(model.updateAlchemyTypeOptions).not.toHaveBeenCalled();
  });

  test("an unrelated change target returns false", () => {
    const target = document.createElement("select");

    expect(handleAlchemyChange({ target })).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// handleAddAlchemy
// ─────────────────────────────────────────────────────────────────────────

describe("handleAddAlchemy", () => {
  function setUpForm({
    type = "Poção",
    name = "Poção de Cura",
    tier = "I",
    qty = "2",
    storage = "backpack",
  } = {}) {
    resetDOM(`
      <select id="alchemyTypeFilter"><option value="${type}" selected>${type}</option></select>
      <select id="alchemyNameSelect"><option value="${name}" selected>${name}</option></select>
      <select id="alchemyTierSelect"><option value="${tier}" selected>${tier}</option></select>
      <input id="alchemyQty" value="${qty}" />
      <select id="alchemyStorage"><option value="${storage}" selected>${storage}</option></select>
    `);
  }

  test("adds the matching consumable and resets the quantity field", () => {
    setUpForm();

    handleAddAlchemy();

    expect(model.addAlchemy).toHaveBeenCalledWith("POTION-1", 2, "backpack");
    expect(document.getElementById("alchemyQty").value).toBe("1");
  });

  test("looks up the consumable by name + tier, filtered by the selected type", () => {
    state.data.alchemy.push({
      consumable_id: "POTION-2",
      consumable_name: "Poção de Cura",
      consumable_type: "Elixir",
      consumable_tier: "I",
    });
    setUpForm({ type: "Elixir" });

    handleAddAlchemy();

    expect(model.addAlchemy).toHaveBeenCalledWith("POTION-2", 2, "backpack");
  });

  test("does nothing when no consumable matches name+tier+type", () => {
    setUpForm({ tier: "III" });

    handleAddAlchemy();

    expect(model.addAlchemy).not.toHaveBeenCalled();
  });

  test("does nothing when required form elements are missing", () => {
    resetDOM(`<div></div>`);

    expect(() => handleAddAlchemy()).not.toThrow();
    expect(model.addAlchemy).not.toHaveBeenCalled();
  });

  test("does nothing when quantity is zero or invalid", () => {
    setUpForm({ qty: "0" });

    handleAddAlchemy();

    expect(model.addAlchemy).not.toHaveBeenCalled();
  });
});
