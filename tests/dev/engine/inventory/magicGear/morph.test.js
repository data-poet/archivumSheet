import {
  renderEquippedMagicGear,
  renderStoredMagicGear,
} from "dev/public/js/engine/inventory/magicGear/render.js";
import { resetDOM } from "tests/dev/helpers/domFixture.js";
import { resetState } from "tests/dev/helpers/stateFixture.js";

jest.mock("dev/public/js/engine/inventory/magicGear/model.js", () => ({
  isMagicGearAtEquipLimit: () => false,
}));

const data = {
  magicGear: [
    {
      magic_gear_id: "MG-DB-1",
      magic_gear_name: "Anel Mágico",
      magic_gear_type: "ring",
      magic_gear_price: 100,
      magic_gear_weight: 0.1,
    },
    {
      magic_gear_id: "MG-DB-2",
      magic_gear_name: "Amuleto",
      magic_gear_type: "amulet",
      magic_gear_price: 200,
      magic_gear_weight: 0.2,
    },
  ],
  magicGearEquipLimits: {},
};

beforeEach(() => {
  resetDOM(
    `<div id="magicGearSlots"></div><div id="magicGearStorageList"></div>`,
  );
  resetState();
});

test("equipped magic gear: the item-tabs <details> stays open across a re-render", () => {
  const selected = {
    magicGear: [{ id: "mg-a", magic_gear_id: "MG-DB-1", is_equipped: true }],
  };
  const sheet = { inventory: { magicGear: {} } };

  renderEquippedMagicGear(selected, data, sheet);

  const details = document.querySelector("#equipped-detail-mg-a details");
  details.setAttribute("open", "");

  selected.magicGear[0].magic_gear_custom_name = "Renomeado";
  renderEquippedMagicGear(selected, data, sheet);

  expect(
    document.querySelector("#equipped-detail-mg-a details").hasAttribute("open"),
  ).toBe(true);
});

test("reordering stored magic gear between locations doesn't misattribute is-card-expanded to the wrong item", () => {
  const selected = {
    magicGear: [
      { id: "mg-a", magic_gear_id: "MG-DB-1", is_equipped: false, storedAt: "stash" },
      { id: "mg-b", magic_gear_id: "MG-DB-2", is_equipped: false, storedAt: "backpack" },
    ],
  };
  const sheet = { inventory: { magicGear: {} } };

  renderStoredMagicGear(selected, data, sheet);
  document.getElementById("magic-gear-stored-mg-b").classList.add("is-card-expanded");

  selected.magicGear[0].storedAt = "backpack";
  renderStoredMagicGear(selected, data, sheet);

  expect(
    document.getElementById("magic-gear-stored-mg-a").classList.contains("is-card-expanded"),
  ).toBe(false);
  expect(
    document.getElementById("magic-gear-stored-mg-b").classList.contains("is-card-expanded"),
  ).toBe(true);
});
