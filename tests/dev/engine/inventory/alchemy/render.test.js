import { resetDOM } from "tests/dev/helpers/domFixture.js";
import { renderAlchemy } from "dev/public/js/engine/inventory/alchemy/render.js";

beforeEach(() => {
  resetDOM(`<div id="alchemyList"></div>`);
});

describe("renderAlchemy", () => {
  test("groups per-unit rows of the same consumable+location into one display row", () => {
    const selected = {
      alchemy: [
        { id: "a1", consumable_id: "POTION-1", quantity: 1, storedAt: "backpack" },
        { id: "a2", consumable_id: "POTION-1", quantity: 1, storedAt: "backpack" },
        { id: "a3", consumable_id: "POTION-1", quantity: 1, storedAt: "backpack" },
      ],
    };
    const data = {
      alchemy: [
        { consumable_id: "POTION-1", consumable_name: "Poção de Cura", consumable_tier: "I" },
      ],
    };

    renderAlchemy(selected, data, undefined);

    const list = document.getElementById("alchemyList");
    expect(list.querySelectorAll(".alchemy-qty")).toHaveLength(1);
    expect(list.querySelector(".alchemy-qty").value).toBe("3");
  });

  test("keeps rows of different consumables or locations as separate display rows", () => {
    const selected = {
      alchemy: [
        { id: "a1", consumable_id: "POTION-1", quantity: 1, storedAt: "backpack" },
        { id: "a2", consumable_id: "POTION-2", quantity: 1, storedAt: "backpack" },
        { id: "a3", consumable_id: "POTION-1", quantity: 1, storedAt: "stash" },
      ],
    };
    const data = { alchemy: [] };

    renderAlchemy(selected, data, undefined);

    const list = document.getElementById("alchemyList");
    expect(list.querySelectorAll(".alchemy-qty")).toHaveLength(3);
  });
});
