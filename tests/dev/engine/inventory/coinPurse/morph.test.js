import { renderCoinPurse } from "dev/public/js/engine/inventory/coinPurse/render.js";
import { resetDOM } from "tests/dev/helpers/domFixture.js";
import { resetState } from "tests/dev/helpers/stateFixture.js";

beforeEach(() => {
  resetDOM(`<div id="coinPurseList"></div>`);
  resetState();
});

test("coin quantity input keeps focus/typed value across a re-render", () => {
  const selected = {
    coins: [{ id: "coin-a", coin_type: "gold", storedAt: "backpack", quantity: 5 }],
  };
  const sheet = { inventory: { coinPurse: {} } };

  renderCoinPurse(selected, undefined, sheet);

  const qtyInput = document.querySelector(
    '.coin-qty[data-coin-type="gold"][data-stored-at="backpack"]',
  );
  qtyInput.focus();
  qtyInput.value = "12";

  selected.coins[0].quantity = 5;
  renderCoinPurse(selected, undefined, sheet);

  expect(document.activeElement.classList.contains("coin-qty")).toBe(true);
  expect(document.activeElement.value).toBe("12");
});

test("the always-present add-form keeps its own stable ids (#coinTypeSelect etc.) across a re-render", () => {
  const selected = { coins: [] };
  const sheet = { inventory: { coinPurse: {} } };

  renderCoinPurse(selected, undefined, sheet);
  const before = document.getElementById("coinQtyInput");

  renderCoinPurse(selected, undefined, sheet);
  const after = document.getElementById("coinQtyInput");

  expect(after).toBe(before);
});

test("moving a coin entry to a different storage location doesn't misattribute is-card-expanded to another entry", () => {
  const selected = {
    coins: [
      { id: "coin-a", coin_type: "gold", storedAt: "stash", quantity: 1 },
      { id: "coin-b", coin_type: "silver", storedAt: "backpack", quantity: 1 },
    ],
  };
  const sheet = { inventory: { coinPurse: {} } };

  renderCoinPurse(selected, undefined, sheet);
  document.getElementById("coin-silver-backpack").classList.add("is-card-expanded");

  selected.coins[0].storedAt = "backpack";
  renderCoinPurse(selected, undefined, sheet);

  expect(
    document.getElementById("coin-silver-backpack").classList.contains("is-card-expanded"),
  ).toBe(true);
  expect(
    document.getElementById("coin-gold-backpack").classList.contains("is-card-expanded"),
  ).toBe(false);
});
