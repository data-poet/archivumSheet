jest.mock("dev/public/js/engine/inventory/coinPurse/model.js", () => ({
  addCoins: jest.fn(),
  updateCoinQuantity: jest.fn(),
  moveCoins: jest.fn(),
  sendCoinsToAlly: jest.fn(),
}));
jest.mock("dev/public/js/ui.js", () => ({
  renderListsPreserving: jest.fn(),
}));

import * as model from "dev/public/js/engine/inventory/coinPurse/model.js";
import * as ui from "dev/public/js/ui.js";
import {
  handleCoinPurseClick,
  handleCoinPurseInput,
  handleCoinPurseChange,
  handleAddCoins,
} from "dev/public/js/engine/inventory/coinPurse/events.js";
import {
  resetDOM,
  elWithClass,
  selectWithValue,
} from "tests/dev/helpers/domFixture.js";
import { resetState } from "tests/dev/helpers/stateFixture.js";
import { state } from "dev/public/js/state.js";

beforeEach(() => {
  resetDOM("<div></div>");
  resetState();
  jest.clearAllMocks();
});

describe("handleCoinPurseClick", () => {
  test("clicking .remove-coin sets that coin's quantity to 0 and returns true", () => {
    const target = elWithClass("button", "remove-coin", {
      coinType: "gold",
      storedAt: "backpack",
    });

    expect(handleCoinPurseClick({ target })).toBe(true);
    expect(model.updateCoinQuantity).toHaveBeenCalledWith(
      "gold",
      "backpack",
      0,
    );
  });

  test("clicking #addCoinBtn delegates to handleAddCoins and returns true", () => {
    resetDOM(`
      <select id="coinTypeSelect"><option value="gold" selected>Gold</option></select>
      <input id="coinQtyInput" value="5" />
      <select id="coinLocationSelect"><option value="backpack" selected>Backpack</option></select>
      <button id="addCoinBtn"></button>
    `);
    const target = document.getElementById("addCoinBtn");

    expect(handleCoinPurseClick({ target })).toBe(true);
    expect(model.addCoins).toHaveBeenCalledWith("gold", 5, "backpack");
  });

  test("an unrelated click target returns false and calls nothing", () => {
    const target = document.createElement("div");

    expect(handleCoinPurseClick({ target })).toBe(false);
    expect(model.updateCoinQuantity).not.toHaveBeenCalled();
    expect(model.addCoins).not.toHaveBeenCalled();
  });
});

describe("handleCoinPurseClick — send to ally", () => {
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
    state.selected.coins = [{ id: "COIN-1" }];
    model.sendCoinsToAlly.mockReturnValue(true);
    const button = sendRow("COIN-1", "ally-1", 5);

    expect(handleCoinPurseClick({ target: button })).toBe(true);
    expect(model.sendCoinsToAlly).toHaveBeenCalledWith("COIN-1", "ally-1", 5);
    expect(ui.renderListsPreserving).toHaveBeenCalled();
  });

  test("does not render when the send fails", () => {
    state.selected.coins = [{ id: "COIN-1" }];
    model.sendCoinsToAlly.mockReturnValue(false);
    const button = sendRow("COIN-1", "ally-1", 5);

    expect(handleCoinPurseClick({ target: button })).toBe(true);
    expect(ui.renderListsPreserving).not.toHaveBeenCalled();
  });
});

describe("handleCoinPurseInput", () => {
  test("typing a valid quantity into .coin-qty updates it and returns true", () => {
    const target = elWithClass("input", "coin-qty", {
      coinType: "gold",
      storedAt: "backpack",
    });
    target.value = "12";

    expect(handleCoinPurseInput({ target })).toBe(true);
    expect(model.updateCoinQuantity).toHaveBeenCalledWith(
      "gold",
      "backpack",
      12,
    );
  });

  test("an in-progress '-' keystroke returns true but does not call the model yet", () => {
    const target = elWithClass("input", "coin-qty", {
      coinType: "gold",
      storedAt: "backpack",
    });
    target.value = "-";

    expect(handleCoinPurseInput({ target })).toBe(true);
    expect(model.updateCoinQuantity).not.toHaveBeenCalled();
  });

  test("an empty value returns true but does not call the model yet", () => {
    const target = elWithClass("input", "coin-qty", {
      coinType: "gold",
      storedAt: "backpack",
    });
    target.value = "";

    expect(handleCoinPurseInput({ target })).toBe(true);
    expect(model.updateCoinQuantity).not.toHaveBeenCalled();
  });

  test("a non-numeric value is coerced to 0 rather than passing NaN through", () => {
    const target = elWithClass("input", "coin-qty", {
      coinType: "gold",
      storedAt: "backpack",
    });
    target.value = "abc";

    expect(handleCoinPurseInput({ target })).toBe(true);
    expect(model.updateCoinQuantity).toHaveBeenCalledWith(
      "gold",
      "backpack",
      0,
    );
  });

  test("missing coinType/storedAt dataset short-circuits without calling the model", () => {
    const target = elWithClass("input", "coin-qty", {});
    target.value = "5";

    expect(handleCoinPurseInput({ target })).toBe(true);
    expect(model.updateCoinQuantity).not.toHaveBeenCalled();
  });

  test("an unrelated input target returns false", () => {
    const target = document.createElement("input");

    expect(handleCoinPurseInput({ target })).toBe(false);
    expect(model.updateCoinQuantity).not.toHaveBeenCalled();
  });
});

describe("handleCoinPurseChange", () => {
  test("changing .coin-location-select moves the coin stack and returns true", () => {
    const target = selectWithValue(
      "coin-location-select",
      { coinType: "gold", storedAt: "backpack" },
      "stash",
    );

    expect(handleCoinPurseChange({ target })).toBe(true);
    expect(model.moveCoins).toHaveBeenCalledWith("gold", "backpack", "stash");
  });

  test("an unrelated change target returns false", () => {
    const target = document.createElement("select");

    expect(handleCoinPurseChange({ target })).toBe(false);
    expect(model.moveCoins).not.toHaveBeenCalled();
  });
});

describe("handleAddCoins", () => {
  test("adds coins with the selected type/quantity/location and resets the form", () => {
    resetDOM(`
      <select id="coinTypeSelect"><option value="silver" selected>Silver</option></select>
      <input id="coinQtyInput" value="10" />
      <select id="coinLocationSelect"><option value="stash" selected>Stash</option></select>
    `);

    handleAddCoins();

    expect(model.addCoins).toHaveBeenCalledWith("silver", 10, "stash");
    expect(document.getElementById("coinTypeSelect").value).toBe("");
    expect(document.getElementById("coinQtyInput").value).toBe("");
  });

  test("does nothing if any required form element is missing from the DOM", () => {
    resetDOM(`<div></div>`);

    expect(() => handleAddCoins()).not.toThrow();
    expect(model.addCoins).not.toHaveBeenCalled();
  });

  test("does nothing if coinType is blank", () => {
    resetDOM(`
      <select id="coinTypeSelect"><option value="" selected></option></select>
      <input id="coinQtyInput" value="10" />
      <select id="coinLocationSelect"><option value="stash" selected>Stash</option></select>
    `);

    handleAddCoins();

    expect(model.addCoins).not.toHaveBeenCalled();
  });

  test("does nothing if quantity is zero or negative", () => {
    resetDOM(`
      <select id="coinTypeSelect"><option value="gold" selected>Gold</option></select>
      <input id="coinQtyInput" value="0" />
      <select id="coinLocationSelect"><option value="stash" selected>Stash</option></select>
    `);

    handleAddCoins();

    expect(model.addCoins).not.toHaveBeenCalled();
  });

  test("does nothing if quantity is not a number", () => {
    resetDOM(`
      <select id="coinTypeSelect"><option value="gold" selected>Gold</option></select>
      <input id="coinQtyInput" value="abc" />
      <select id="coinLocationSelect"><option value="stash" selected>Stash</option></select>
    `);

    handleAddCoins();

    expect(model.addCoins).not.toHaveBeenCalled();
  });
});
