import {
  renderEquippedRanged,
  renderStoredRanged,
} from "dev/public/js/engine/inventory/ranged/render.js";
import { resetDOM } from "tests/dev/helpers/domFixture.js";
import { resetState } from "tests/dev/helpers/stateFixture.js";

const data = {
  ranged_weapons: [
    {
      weapon_id: "RANGED-DB-1",
      weapon_name: "Arco Longo",
      weapon_tier: "I",
      weapon_hit_points: 8,
    },
    {
      weapon_id: "RANGED-DB-2",
      weapon_name: "Besta",
      weapon_tier: "I",
      weapon_hit_points: 10,
    },
  ],
  materials: [],
};

beforeEach(() => {
  resetDOM(`<div id="rangedSlots"></div><div id="rangedStorageList"></div>`);
  resetState();
});

test("equipped ranged: HP input keeps focus/typed value and the item-tabs <details> stays open across a re-render", () => {
  const selected = {
    ranged_weapons: [
      { id: "rng-a", weapon_id: "RANGED-DB-1", is_equipped: true, hit_points_modifier: 0 },
    ],
  };
  const sheet = { inventory: { ranged: {} } };

  renderEquippedRanged(selected, data, sheet);

  const hpInput = document.querySelector(
    "#ranged-equipped-rng-a .equipped-ranged-hp",
  );
  hpInput.focus();
  hpInput.value = "-1";

  const details = document.querySelector("#equipped-detail-rng-a details");
  details.setAttribute("open", "");

  selected.ranged_weapons[0].material_id = "mat-x";
  renderEquippedRanged(selected, data, sheet);

  expect(document.activeElement.classList.contains("equipped-ranged-hp")).toBe(
    true,
  );
  expect(document.activeElement.value).toBe("-1");
  expect(
    document.querySelector("#equipped-detail-rng-a details").hasAttribute("open"),
  ).toBe(true);
});

test("reordering stored ranged between locations doesn't misattribute is-card-expanded to the wrong item", () => {
  const selected = {
    ranged_weapons: [
      { id: "rng-a", weapon_id: "RANGED-DB-1", is_equipped: false, storedAt: "stash", hit_points_modifier: 0 },
      { id: "rng-b", weapon_id: "RANGED-DB-2", is_equipped: false, storedAt: "backpack", hit_points_modifier: 0 },
    ],
  };
  const sheet = { inventory: { ranged: {} } };

  renderStoredRanged(selected, data, sheet);
  document.getElementById("ranged-stored-rng-b").classList.add("is-card-expanded");

  selected.ranged_weapons[0].storedAt = "backpack";
  renderStoredRanged(selected, data, sheet);

  expect(
    document.getElementById("ranged-stored-rng-a").classList.contains("is-card-expanded"),
  ).toBe(false);
  expect(
    document.getElementById("ranged-stored-rng-b").classList.contains("is-card-expanded"),
  ).toBe(true);
});
