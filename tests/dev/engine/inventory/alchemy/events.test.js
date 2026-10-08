jest.mock("dev/public/js/engine/inventory/alchemy/model.js", () => ({
  addAlchemy: jest.fn(),
  updateAlchemyQuantity: jest.fn(),
  removeAlchemy: jest.fn(),
  moveAlchemy: jest.fn(),
  updateAlchemyTypeOptions: jest.fn(),
  updateAlchemyNameOptions: jest.fn(),
  updateAlchemyTierOptions: jest.fn(),
  sendAlchemyToAlly: jest.fn(),
}));
jest.mock("dev/public/js/ui.js", () => ({
  renderListsPreserving: jest.fn(),
}));

import * as model from "dev/public/js/engine/inventory/alchemy/model.js";
import * as ui from "dev/public/js/ui.js";
import {
  handleAlchemyClick,
  handleAlchemyInput,
  handleAlchemyChange,
  handleAddAlchemy,
} from "dev/public/js/engine/inventory/alchemy/events.js";
import { state } from "dev/public/js/state.js";
import {
  resetDOM,
  elWithClass,
  selectWithValue,
} from "tests/dev/helpers/domFixture.js";
import { resetState } from "tests/dev/helpers/stateFixture.js";

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

describe("handleAlchemyClick — send to ally", () => {
  function sendRow(instanceId, destinationId, quantity) {
    const row = elWithClass("span", "send-to-ally-row", { instanceId });
    const select = selectWithValue(
      "send-to-ally-select",
      { instanceId },
      destinationId,
    );
    const qtyInput = elWithClass("input", "send-to-ally-quantity", {
      instanceId,
    });
    qtyInput.value = String(quantity);
    const button = elWithClass("button", "send-to-ally-button", {
      instanceId,
    });
    row.appendChild(select);
    row.appendChild(qtyInput);
    row.appendChild(button);
    document.body.appendChild(row);
    return button;
  }

  test("sends the chosen quantity and re-renders on success", () => {
    model.sendAlchemyToAlly.mockReturnValue(true);
    const button = sendRow("POTION-ROW-1", "ally-1", 3);

    expect(handleAlchemyClick({ target: button })).toBe(true);
    expect(model.sendAlchemyToAlly).toHaveBeenCalledWith(
      "POTION-ROW-1",
      "ally-1",
      3,
    );
    expect(ui.renderListsPreserving).toHaveBeenCalled();
  });

  test("does not render when the send fails", () => {
    model.sendAlchemyToAlly.mockReturnValue(false);
    const button = sendRow("POTION-ROW-1", "ally-1", 3);

    expect(handleAlchemyClick({ target: button })).toBe(true);
    expect(ui.renderListsPreserving).not.toHaveBeenCalled();
  });
});

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
