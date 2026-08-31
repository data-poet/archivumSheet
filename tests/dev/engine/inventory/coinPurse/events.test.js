jest.mock("dev/public/js/engine/inventory/coinPurse/model.js", () => ({
  addCoins: jest.fn(),
  updateCoinQuantity: jest.fn(),
  moveCoins: jest.fn(),
}));

import * as model from "dev/public/js/engine/inventory/coinPurse/model.js";
import {
  handleCoinPurseClick,
  handleCoinPurseInput,
  handleCoinPurseChange,
  handleAddCoins,
} from "dev/public/js/engine/inventory/coinPurse/events.js";
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
});

// ─────────────────────────────────────────────────────────────────────────
// handleCoinPurseClick
// ─────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────
// handleCoinPurseInput
// ─────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────
// handleCoinPurseChange
// ─────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────
// handleAddCoins
// ─────────────────────────────────────────────────────────────────────────

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
