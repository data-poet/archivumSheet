import { renderSurvivalGear } from "dev/public/js/engine/inventory/survivalGear/render.js";
import { resetDOM } from "tests/dev/helpers/domFixture.js";
import { resetState } from "tests/dev/helpers/stateFixture.js";

const data = {
  survivalGear: [
    {
      adventure_gear_id: "GEAR-1",
      adventure_gear_name: "Corda",
      adventure_gear_type: "Ferramenta",
    },
    {
      adventure_gear_id: "GEAR-2",
      adventure_gear_name: "Lanterna",
      adventure_gear_type: "Ferramenta",
    },
  ],
};

beforeEach(() => {
  resetDOM(`<div id="survivalGearList"></div>`);
  resetState();
});

test("quantity input keeps focus/typed value and the detail <details> stays open across a re-render", () => {
  const selected = {
    survivalGear: [
      { id: "sg-a", adventure_gear_id: "GEAR-1", storedAt: "backpack", quantity: 1 },
    ],
  };
  const sheet = { inventory: { survivalGear: {} } };

  renderSurvivalGear(selected, data, sheet);

  const qtyInput = document.querySelector(
    '.survival-gear-qty[data-gear-id="GEAR-1"]',
  );
  qtyInput.focus();
  qtyInput.value = "5";

  const details = document.querySelector(
    "#detail-row-GEAR-1-backpack details",
  );
  details.setAttribute("open", "");

  selected.survivalGear[0].quantity = 1;
  renderSurvivalGear(selected, data, sheet);

  expect(document.activeElement.classList.contains("survival-gear-qty")).toBe(
    true,
  );
  expect(document.activeElement.value).toBe("5");
  expect(
    document
      .querySelector("#detail-row-GEAR-1-backpack details")
      .hasAttribute("open"),
  ).toBe(true);
});

test("moving an entry to a different storage location doesn't misattribute is-card-expanded to another entry", () => {
  const selected = {
    survivalGear: [
      { id: "sg-a", adventure_gear_id: "GEAR-1", storedAt: "stash", quantity: 1 },
      { id: "sg-b", adventure_gear_id: "GEAR-2", storedAt: "backpack", quantity: 1 },
    ],
  };
  const sheet = { inventory: { survivalGear: {} } };

  renderSurvivalGear(selected, data, sheet);
  document
    .getElementById("survival-gear-stored-GEAR-2-backpack")
    .classList.add("is-card-expanded");

  selected.survivalGear[0].storedAt = "backpack";
  renderSurvivalGear(selected, data, sheet);

  expect(
    document
      .getElementById("survival-gear-stored-GEAR-2-backpack")
      .classList.contains("is-card-expanded"),
  ).toBe(true);
  expect(
    document
      .getElementById("survival-gear-stored-GEAR-1-backpack")
      .classList.contains("is-card-expanded"),
  ).toBe(false);
});
