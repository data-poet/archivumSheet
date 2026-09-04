jest.mock("dev/public/js/engine/inventory/customInventory/model.js", () => ({
  addCustomItem: jest.fn(),
  updateCustomItemQuantity: jest.fn(),
  removeCustomItem: jest.fn(),
  moveCustomItem: jest.fn(),
  saveCustomItemFields: jest.fn(),
}));
jest.mock("dev/public/js/engine/inventory/customInventory/render.js", () => ({
  renderCustomInventory: jest.fn(),
}));
jest.mock("dev/public/js/shared/openState.js", () => ({
  snapshotAll: jest.fn(() => "SNAPSHOT"),
  restoreAll: jest.fn(),
}));
jest.mock("dev/public/js/shared/renderUtils.js", () => ({
  openCustomFieldsEditor: jest.fn(),
  closeCustomFieldsEditor: jest.fn(),
  readCustomItemEditorValues: jest.fn(),
}));

import * as model from "dev/public/js/engine/inventory/customInventory/model.js";
import * as render from "dev/public/js/engine/inventory/customInventory/render.js";
import * as openStateModule from "dev/public/js/shared/openState.js";
import * as renderUtils from "dev/public/js/shared/renderUtils.js";
import {
  handleCustomInventoryClick,
  handleCustomInventoryInput,
  handleCustomInventoryChange,
  handleAddCustomItem,
} from "dev/public/js/engine/inventory/customInventory/events.js";
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
  jest.useFakeTimers();

  state.selected.customInventory = [
    {
      custom_item_id: "CUSTOM-1",
      name: "Amuleto Estranho",
      weight: 0.5,
      price: 10,
      quantity: 1,
      description: null,
      storedAt: "backpack",
    },
  ];
});

afterEach(() => {
  jest.useRealTimers();
});


describe("handleCustomInventoryClick", () => {
  test("clicking .remove-custom-item removes the item and returns true", () => {
    const target = elWithClass("button", "remove-custom-item", {
      customItemId: "CUSTOM-1",
    });

    expect(handleCustomInventoryClick({ target })).toBe(true);
    expect(model.removeCustomItem).toHaveBeenCalledWith("CUSTOM-1");
  });

  test("clicking .custom-item-edit-btn opens the editor and re-renders (rAF-deferred, snapshot-preserving)", () => {
    const target = elWithClass("button", "custom-item-edit-btn", {
      customItemId: "CUSTOM-1",
    });

    expect(handleCustomInventoryClick({ target })).toBe(true);
    expect(renderUtils.openCustomFieldsEditor).toHaveBeenCalledWith("CUSTOM-1");

    // Snapshot is taken synchronously, render itself is rAF-deferred.
    expect(openStateModule.snapshotAll).toHaveBeenCalledTimes(1);
    expect(render.renderCustomInventory).not.toHaveBeenCalled();

    jest.advanceTimersToNextFrame();
    expect(render.renderCustomInventory).toHaveBeenCalledWith(
      state.selected,
      state.data,
      state.sheet,
    );
    expect(openStateModule.restoreAll).toHaveBeenCalledWith("SNAPSHOT");
  });

  test("clicking .custom-item-cancel-btn closes the editor and re-renders", () => {
    const target = elWithClass("button", "custom-item-cancel-btn", {
      customItemId: "CUSTOM-1",
    });

    expect(handleCustomInventoryClick({ target })).toBe(true);
    expect(renderUtils.closeCustomFieldsEditor).toHaveBeenCalledWith(
      "CUSTOM-1",
    );

    jest.advanceTimersToNextFrame();
    expect(render.renderCustomInventory).toHaveBeenCalledTimes(1);
  });

  describe("clicking .custom-item-save-btn", () => {
    test("with unreadable editor values, closes the editor and re-renders without calling saveCustomItemFields", () => {
      renderUtils.readCustomItemEditorValues.mockReturnValue(null);
      const target = elWithClass("button", "custom-item-save-btn", {
        customItemId: "CUSTOM-1",
      });

      expect(handleCustomInventoryClick({ target })).toBe(true);
      expect(model.saveCustomItemFields).not.toHaveBeenCalled();
      expect(renderUtils.closeCustomFieldsEditor).toHaveBeenCalledWith(
        "CUSTOM-1",
      );

      jest.advanceTimersToNextFrame();
      expect(render.renderCustomInventory).toHaveBeenCalledTimes(1);
    });

    test("with valid values that save successfully, closes the editor", () => {
      const values = { name: "Novo Nome", weight: 1, price: 5 };
      renderUtils.readCustomItemEditorValues.mockReturnValue(values);
      model.saveCustomItemFields.mockReturnValue(true);
      const target = elWithClass("button", "custom-item-save-btn", {
        customItemId: "CUSTOM-1",
      });

      expect(handleCustomInventoryClick({ target })).toBe(true);
      expect(model.saveCustomItemFields).toHaveBeenCalledWith(
        "CUSTOM-1",
        values,
      );
      expect(renderUtils.closeCustomFieldsEditor).toHaveBeenCalledWith(
        "CUSTOM-1",
      );
    });

    test("with invalid values that fail to save, does NOT close the editor or re-render — preserves the user's in-progress input", () => {
      const values = { name: "", weight: -1, price: 5 };
      renderUtils.readCustomItemEditorValues.mockReturnValue(values);
      model.saveCustomItemFields.mockReturnValue(false);
      const target = elWithClass("button", "custom-item-save-btn", {
        customItemId: "CUSTOM-1",
      });

      expect(handleCustomInventoryClick({ target })).toBe(true);
      expect(model.saveCustomItemFields).toHaveBeenCalledWith(
        "CUSTOM-1",
        values,
      );
      expect(renderUtils.closeCustomFieldsEditor).not.toHaveBeenCalled();
      // No re-render was scheduled either — snapshotAll wasn't even called
      // for this branch (no _renderCustomInventoryLists() call at all).
      expect(openStateModule.snapshotAll).not.toHaveBeenCalled();
    });
  });

  test("an unrelated click target returns false", () => {
    const target = document.createElement("div");

    expect(handleCustomInventoryClick({ target })).toBe(false);
    expect(model.removeCustomItem).not.toHaveBeenCalled();
  });
});


describe("handleCustomInventoryInput", () => {
  test("typing a valid quantity into .custom-item-qty updates it and returns true", () => {
    const target = elWithClass("input", "custom-item-qty", {
      customItemId: "CUSTOM-1",
    });
    target.value = "5";

    expect(handleCustomInventoryInput({ target })).toBe(true);
    expect(model.updateCustomItemQuantity).toHaveBeenCalledWith("CUSTOM-1", 5);
  });

  test("missing customItemId short-circuits without calling the model", () => {
    const target = elWithClass("input", "custom-item-qty", {});
    target.value = "5";

    expect(handleCustomInventoryInput({ target })).toBe(true);
    expect(model.updateCustomItemQuantity).not.toHaveBeenCalled();
  });

  test("an in-progress '-' keystroke returns true without calling the model", () => {
    const target = elWithClass("input", "custom-item-qty", {
      customItemId: "CUSTOM-1",
    });
    target.value = "-";

    expect(handleCustomInventoryInput({ target })).toBe(true);
    expect(model.updateCustomItemQuantity).not.toHaveBeenCalled();
  });

  test("an empty value returns true without calling the model", () => {
    const target = elWithClass("input", "custom-item-qty", {
      customItemId: "CUSTOM-1",
    });
    target.value = "";

    expect(handleCustomInventoryInput({ target })).toBe(true);
    expect(model.updateCustomItemQuantity).not.toHaveBeenCalled();
  });

  test("a non-numeric value is coerced to 0", () => {
    const target = elWithClass("input", "custom-item-qty", {
      customItemId: "CUSTOM-1",
    });
    target.value = "abc";

    expect(handleCustomInventoryInput({ target })).toBe(true);
    expect(model.updateCustomItemQuantity).toHaveBeenCalledWith("CUSTOM-1", 0);
  });

  test("an unrelated input target returns false", () => {
    const target = document.createElement("input");

    expect(handleCustomInventoryInput({ target })).toBe(false);
    expect(model.updateCustomItemQuantity).not.toHaveBeenCalled();
  });
});


describe("handleCustomInventoryChange", () => {
  test("changing .custom-item-location-select moves the item and returns true", () => {
    const target = selectWithValue(
      "custom-item-location-select",
      { customItemId: "CUSTOM-1" },
      "stash",
    );

    expect(handleCustomInventoryChange({ target })).toBe(true);
    expect(model.moveCustomItem).toHaveBeenCalledWith("CUSTOM-1", "stash");
  });

  test("an unrelated change target returns false", () => {
    const target = document.createElement("select");

    expect(handleCustomInventoryChange({ target })).toBe(false);
    expect(model.moveCustomItem).not.toHaveBeenCalled();
  });
});


describe("handleAddCustomItem", () => {
  function setUpForm({
    name = "Item Novo",
    weight = "1.5",
    price = "20",
    qty = "1",
    description = "Um item qualquer",
    storage = "backpack",
  } = {}) {
    resetDOM(`
      <input id="customItemName" value="${name}" />
      <input id="customItemWeight" value="${weight}" />
      <input id="customItemPrice" value="${price}" />
      <input id="customItemQty" value="${qty}" />
      <textarea id="customItemDescription">${description}</textarea>
      <select id="customItemStorage"><option value="${storage}" selected>${storage}</option></select>
    `);
  }

  test("adds the item with trimmed name/description and resets the form", () => {
    setUpForm({ name: "  Item Novo  ", description: "  Descrição  " });

    handleAddCustomItem();

    expect(model.addCustomItem).toHaveBeenCalledWith({
      name: "Item Novo",
      weight: 1.5,
      price: 20,
      quantity: 1,
      description: "Descrição",
      storedAt: "backpack",
    });
    expect(document.getElementById("customItemName").value).toBe("");
    expect(document.getElementById("customItemWeight").value).toBe("0");
    expect(document.getElementById("customItemPrice").value).toBe("0");
    expect(document.getElementById("customItemQty").value).toBe("1");
    expect(document.getElementById("customItemDescription").value).toBe("");
  });

  test("passes null description when the description field is blank", () => {
    setUpForm({ description: "   " });

    handleAddCustomItem();

    expect(model.addCustomItem).toHaveBeenCalledWith(
      expect.objectContaining({ description: null }),
    );
  });

  test("still adds the item when the description field is entirely absent from the DOM", () => {
    resetDOM(`
      <input id="customItemName" value="Item Novo" />
      <input id="customItemWeight" value="1" />
      <input id="customItemPrice" value="5" />
      <input id="customItemQty" value="1" />
      <select id="customItemStorage"><option value="backpack" selected>backpack</option></select>
    `);

    handleAddCustomItem();

    expect(model.addCustomItem).toHaveBeenCalledWith(
      expect.objectContaining({ description: null }),
    );
  });

  test("does nothing when the name is blank", () => {
    setUpForm({ name: "   " });

    handleAddCustomItem();

    expect(model.addCustomItem).not.toHaveBeenCalled();
  });

  test("does nothing when weight is negative", () => {
    setUpForm({ weight: "-1" });

    handleAddCustomItem();

    expect(model.addCustomItem).not.toHaveBeenCalled();
  });

  test("does nothing when price is negative", () => {
    setUpForm({ price: "-1" });

    handleAddCustomItem();

    expect(model.addCustomItem).not.toHaveBeenCalled();
  });

  test("does nothing when quantity is zero", () => {
    setUpForm({ qty: "0" });

    handleAddCustomItem();

    expect(model.addCustomItem).not.toHaveBeenCalled();
  });

  test("does nothing when weight or price is not a number", () => {
    setUpForm({ weight: "abc" });

    handleAddCustomItem();

    expect(model.addCustomItem).not.toHaveBeenCalled();
  });

  test("does nothing when required form elements are missing", () => {
    resetDOM(`<div></div>`);

    expect(() => handleAddCustomItem()).not.toThrow();
    expect(model.addCustomItem).not.toHaveBeenCalled();
  });
});
