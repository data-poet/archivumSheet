import {
  renderArmorSlots,
  renderStoredArmors,
} from "dev/public/js/engine/inventory/armor/render.js";
import { resetDOM } from "tests/dev/helpers/domFixture.js";
import { resetState } from "tests/dev/helpers/stateFixture.js";

const data = {
  armors: [
    {
      armor_id: "ARMOR-DB-1",
      armor_piece_location: "Cabeça",
      armor_name: "Elmo de Ferro",
      armor_tier: "I",
      armor_hit_points: 10,
    },
    {
      armor_id: "ARMOR-DB-2",
      armor_piece_location: "Tronco",
      armor_name: "Cota de Malha",
      armor_tier: "I",
      armor_hit_points: 20,
    },
  ],
  materials: [],
};

beforeEach(() => {
  resetDOM(`<div id="armorSlots"></div><div id="armorStorageList"></div>`);
  resetState();
});

test("equipped armor: HP input keeps focus/typed value and the item-tabs <details> stays open across a re-render", () => {
  const selected = {
    armors: [
      {
        id: "arm-head",
        armor_id: "ARMOR-DB-1",
        is_equipped: true,
        hit_points_modifier: 0,
      },
    ],
  };
  const sheet = { inventory: { armor: { equipped: {} } } };

  renderArmorSlots(selected, data, sheet);

  const hpInput = document.querySelector(
    "#armor-equipped-head .equipped-armor-hp",
  );
  hpInput.focus();
  hpInput.value = "-4";

  const details = document.querySelector(
    "#equipped-detail-arm-head details",
  );
  details.setAttribute("open", "");

  selected.armors[0].material_id = "mat-x";
  renderArmorSlots(selected, data, sheet);

  expect(document.activeElement.classList.contains("equipped-armor-hp")).toBe(
    true,
  );
  expect(document.activeElement.value).toBe("-4");
  expect(
    document.querySelector("#equipped-detail-arm-head details").hasAttribute("open"),
  ).toBe(true);
});

test("reordering stored armor between locations doesn't misattribute is-card-expanded to the wrong item", () => {
  const selected = {
    armors: [
      {
        id: "arm-a",
        armor_id: "ARMOR-DB-1",
        is_equipped: false,
        storedAt: "stash",
        hit_points_modifier: 0,
      },
      {
        id: "arm-b",
        armor_id: "ARMOR-DB-2",
        is_equipped: false,
        storedAt: "backpack",
        hit_points_modifier: 0,
      },
    ],
  };
  const sheet = { inventory: { armor: {} } };

  renderStoredArmors(selected, data, sheet);
  document.getElementById("armor-stored-arm-b").classList.add("is-card-expanded");

  // arm-a moves from stash to backpack, landing above arm-b.
  selected.armors[0].storedAt = "backpack";
  renderStoredArmors(selected, data, sheet);

  expect(
    document.getElementById("armor-stored-arm-a").classList.contains("is-card-expanded"),
  ).toBe(false);
  expect(
    document.getElementById("armor-stored-arm-b").classList.contains("is-card-expanded"),
  ).toBe(true);
});

test("storage-section <details> stays open across a re-render", () => {
  const selected = {
    armors: [
      {
        id: "arm-a",
        armor_id: "ARMOR-DB-1",
        is_equipped: false,
        storedAt: "backpack",
        hit_points_modifier: 0,
      },
    ],
  };
  const sheet = { inventory: { armor: {} } };

  renderStoredArmors(selected, data, sheet);
  document
    .querySelector('[data-storage-loc="backpack"]')
    .setAttribute("open", "");

  selected.armors[0].hit_points_modifier = -1;
  renderStoredArmors(selected, data, sheet);

  expect(
    document.querySelector('[data-storage-loc="backpack"]').hasAttribute("open"),
  ).toBe(true);
});
