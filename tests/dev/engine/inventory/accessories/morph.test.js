import {
  renderEquippedAccessories,
  renderStoredAccessories,
} from "dev/public/js/engine/inventory/accessories/render.js";
import { resetDOM } from "tests/dev/helpers/domFixture.js";
import { resetState } from "tests/dev/helpers/stateFixture.js";

const data = {
  accessories: [
    { accessory_id: "ACC-DB-1", accessory_name: "Mochila", accessory_equip_limit: 1 },
    { accessory_id: "ACC-DB-2", accessory_name: "Cinto", accessory_equip_limit: 1 },
  ],
};

beforeEach(() => {
  resetDOM(
    `<div id="accessorySlots"></div><div id="accessoryStorageList"></div>`,
  );
  resetState();
});

test("equipped accessory: price input keeps focus/typed value and the item-tabs <details> stays open across a re-render", () => {
  const selected = {
    accessories: [{ id: "acc-a", accessory_id: "ACC-DB-1", is_equipped: true, price: 10 }],
  };
  const sheet = { inventory: { accessories: {} } };

  renderEquippedAccessories(selected, data, sheet);

  const priceInput = document.querySelector(
    "#accessory-equipped-acc-a .equipped-accessory-price",
  );
  priceInput.focus();
  priceInput.value = "25";

  const details = document.querySelector("#equipped-detail-acc-a details");
  details.setAttribute("open", "");

  selected.accessories[0].accessory_custom_name = "Renomeada";
  renderEquippedAccessories(selected, data, sheet);

  expect(
    document.activeElement.classList.contains("equipped-accessory-price"),
  ).toBe(true);
  expect(document.activeElement.value).toBe("25");
  expect(
    document.querySelector("#equipped-detail-acc-a details").hasAttribute("open"),
  ).toBe(true);
});

test("reordering stored accessories between locations doesn't misattribute is-card-expanded to the wrong item", () => {
  const selected = {
    accessories: [
      { id: "acc-a", accessory_id: "ACC-DB-1", is_equipped: false, storedAt: "stash", price: 0 },
      { id: "acc-b", accessory_id: "ACC-DB-2", is_equipped: false, storedAt: "backpack", price: 0 },
    ],
  };
  const sheet = { inventory: { accessories: {} } };

  renderStoredAccessories(selected, data, sheet);
  document.getElementById("accessory-stored-acc-b").classList.add("is-card-expanded");

  selected.accessories[0].storedAt = "backpack";
  renderStoredAccessories(selected, data, sheet);

  expect(
    document.getElementById("accessory-stored-acc-a").classList.contains("is-card-expanded"),
  ).toBe(false);
  expect(
    document.getElementById("accessory-stored-acc-b").classList.contains("is-card-expanded"),
  ).toBe(true);
});
