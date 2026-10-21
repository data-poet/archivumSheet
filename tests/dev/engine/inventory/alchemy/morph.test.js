import { renderAlchemy } from "dev/public/js/engine/inventory/alchemy/render.js";
import { resetDOM } from "tests/dev/helpers/domFixture.js";
import { resetState } from "tests/dev/helpers/stateFixture.js";

const data = {
  alchemy: [
    {
      consumable_id: "POTION-1",
      consumable_name: "Poção de Cura",
      consumable_type: "Poção",
    },
    {
      consumable_id: "POTION-2",
      consumable_name: "Antídoto",
      consumable_type: "Poção",
    },
  ],
};

beforeEach(() => {
  resetDOM(`<div id="alchemyList"></div>`);
  resetState();
});

test("quantity input keeps focus/typed value and the detail <details> stays open across a re-render", () => {
  const selected = {
    alchemy: [{ id: "alc-a", consumable_id: "POTION-1", storedAt: "backpack", quantity: 2 }],
  };
  const sheet = { inventory: { alchemy: {} } };

  renderAlchemy(selected, data, sheet);

  const qtyInput = document.querySelector(
    '.alchemy-qty[data-consumable-id="POTION-1"]',
  );
  qtyInput.focus();
  qtyInput.value = "9";

  const details = document.querySelector(
    "#detail-row-POTION-1-backpack details",
  );
  details.setAttribute("open", "");

  selected.alchemy[0].quantity = 2; // unrelated external re-render
  renderAlchemy(selected, data, sheet);

  expect(document.activeElement.classList.contains("alchemy-qty")).toBe(true);
  expect(document.activeElement.value).toBe("9");
  expect(
    document
      .querySelector("#detail-row-POTION-1-backpack details")
      .hasAttribute("open"),
  ).toBe(true);
});

test("moving an entry to a different storage location doesn't misattribute is-card-expanded to another entry", () => {
  const selected = {
    alchemy: [
      { id: "alc-a", consumable_id: "POTION-1", storedAt: "stash", quantity: 1 },
      { id: "alc-b", consumable_id: "POTION-2", storedAt: "backpack", quantity: 1 },
    ],
  };
  const sheet = { inventory: { alchemy: {} } };

  renderAlchemy(selected, data, sheet);
  document
    .getElementById("alchemy-stored-POTION-2-backpack")
    .classList.add("is-card-expanded");

  selected.alchemy[0].storedAt = "backpack";
  renderAlchemy(selected, data, sheet);

  expect(
    document
      .getElementById("alchemy-stored-POTION-2-backpack")
      .classList.contains("is-card-expanded"),
  ).toBe(true);
  expect(
    document
      .getElementById("alchemy-stored-POTION-1-backpack")
      .classList.contains("is-card-expanded"),
  ).toBe(false);
});
