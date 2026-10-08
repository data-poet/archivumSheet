import { resetDOM } from "tests/dev/helpers/domFixture.js";
import { renderSurvivalGear } from "dev/public/js/engine/inventory/survivalGear/render.js";

beforeEach(() => {
  resetDOM(`<div id="survivalGearList"></div>`);
});

describe("renderSurvivalGear", () => {
  test("renders one row per gear+location entry", () => {
    const selected = {
      survivalGear: [
        { id: "g1", adventure_gear_id: "GEAR-1", quantity: 2, storedAt: "backpack" },
      ],
    };
    const data = {
      survivalGear: [{ adventure_gear_id: "GEAR-1", adventure_gear_name: "Ração" }],
    };

    renderSurvivalGear(selected, data, undefined);

    const list = document.getElementById("survivalGearList");
    expect(list.querySelectorAll(".survival-gear-qty")).toHaveLength(1);
    expect(list.querySelector(".survival-gear-qty").value).toBe("2");
  });

  test("keeps rows of different gear or locations as separate display rows", () => {
    const selected = {
      survivalGear: [
        { id: "g1", adventure_gear_id: "GEAR-1", quantity: 1, storedAt: "backpack" },
        { id: "g2", adventure_gear_id: "GEAR-2", quantity: 1, storedAt: "backpack" },
        { id: "g3", adventure_gear_id: "GEAR-1", quantity: 1, storedAt: "stash" },
      ],
    };
    const data = { survivalGear: [] };

    renderSurvivalGear(selected, data, undefined);

    const list = document.getElementById("survivalGearList");
    expect(list.querySelectorAll(".survival-gear-qty")).toHaveLength(3);
  });
});
