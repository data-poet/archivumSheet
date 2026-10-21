import { renderCustomInventory } from "dev/public/js/engine/inventory/customInventory/render.js";
import {
  openCustomFieldsEditor,
  closeCustomFieldsEditor,
} from "dev/public/js/shared/renderUtils.js";
import { resetDOM } from "tests/dev/helpers/domFixture.js";
import { resetState } from "tests/dev/helpers/stateFixture.js";

beforeEach(() => {
  resetDOM(`<div id="customInventoryList"></div>`);
  resetState();
});

test("quantity input keeps focus/typed value across a re-render", () => {
  const selected = {
    customInventory: [
      { id: "item-a", name: "Corda Extra", storedAt: "backpack", quantity: 1, weight: 0, price: 0 },
    ],
  };
  const sheet = { inventory: { customInventory: {} } };

  renderCustomInventory(selected, undefined, sheet);

  const qtyInput = document.querySelector(
    '.custom-item-qty[data-custom-item-id="item-a"]',
  );
  qtyInput.focus();
  qtyInput.value = "4";

  selected.customInventory[0].quantity = 1;
  renderCustomInventory(selected, undefined, sheet);

  expect(document.activeElement.classList.contains("custom-item-qty")).toBe(
    true,
  );
  expect(document.activeElement.value).toBe("4");
});

test("the store-driven edit <details> opens when isCustomFieldsEditorOpen is true and closes when it's set false, surviving an in-between re-render", () => {
  const selected = {
    customInventory: [
      { id: "item-a", name: "Corda Extra", storedAt: "backpack", quantity: 1, weight: 0, price: 0 },
    ],
  };
  const sheet = { inventory: { customInventory: {} } };

  openCustomFieldsEditor("item-a");
  renderCustomInventory(selected, undefined, sheet);
  expect(
    document.querySelector("#detail-row-item-a details").hasAttribute("open"),
  ).toBe(true);

  closeCustomFieldsEditor("item-a");
  renderCustomInventory(selected, undefined, sheet);
  expect(
    document.querySelector("#detail-row-item-a details").hasAttribute("open"),
  ).toBe(false);
});

test("moving an entry to a different storage location doesn't misattribute is-card-expanded to another entry", () => {
  const selected = {
    customInventory: [
      { id: "item-a", name: "Corda", storedAt: "stash", quantity: 1, weight: 0, price: 0 },
      { id: "item-b", name: "Lanterna", storedAt: "backpack", quantity: 1, weight: 0, price: 0 },
    ],
  };
  const sheet = { inventory: { customInventory: {} } };

  renderCustomInventory(selected, undefined, sheet);
  document.getElementById("custom-item-stored-item-b").classList.add("is-card-expanded");

  selected.customInventory[0].storedAt = "backpack";
  renderCustomInventory(selected, undefined, sheet);

  expect(
    document.getElementById("custom-item-stored-item-b").classList.contains("is-card-expanded"),
  ).toBe(true);
  expect(
    document.getElementById("custom-item-stored-item-a").classList.contains("is-card-expanded"),
  ).toBe(false);
});
