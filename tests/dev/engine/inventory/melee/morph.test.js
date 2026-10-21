import {
  renderEquippedMelee,
  renderStoredMelee,
} from "dev/public/js/engine/inventory/melee/render.js";
import { resetDOM } from "tests/dev/helpers/domFixture.js";
import { resetState } from "tests/dev/helpers/stateFixture.js";

const data = {
  melee_weapons: [
    {
      weapon_id: "MELEE-DB-1",
      weapon_name: "Espada Longa",
      weapon_tier: "I",
      weapon_hit_points: 10,
    },
    {
      weapon_id: "MELEE-DB-2",
      weapon_name: "Machado",
      weapon_tier: "I",
      weapon_hit_points: 12,
    },
  ],
  materials: [],
};

beforeEach(() => {
  resetDOM(`<div id="meleeSlots"></div><div id="meleeStorageList"></div>`);
  resetState();
});

test("equipped melee: HP input keeps focus/typed value and the item-tabs <details> stays open across a re-render, with two weapons equipped at once", () => {
  const selected = {
    melee_weapons: [
      { id: "mel-a", weapon_id: "MELEE-DB-1", is_equipped: true, hit_points_modifier: 0 },
      { id: "mel-b", weapon_id: "MELEE-DB-2", is_equipped: true, hit_points_modifier: 0 },
    ],
  };
  const sheet = { inventory: { melee: {} } };

  renderEquippedMelee(selected, data, sheet);

  const hpInput = document.querySelector(
    "#melee-equipped-mel-b .equipped-melee-hp",
  );
  hpInput.focus();
  hpInput.value = "-2";

  const details = document.querySelector("#equipped-detail-mel-b details");
  details.setAttribute("open", "");

  selected.melee_weapons[0].material_id = "mat-x";
  renderEquippedMelee(selected, data, sheet);

  expect(document.activeElement.classList.contains("equipped-melee-hp")).toBe(
    true,
  );
  expect(document.activeElement.value).toBe("-2");
  expect(
    document.querySelector("#equipped-detail-mel-b details").hasAttribute("open"),
  ).toBe(true);
});

test("unequipping all melee weapons and re-equipping doesn't throw (empty <-> populated transition)", () => {
  const selected = { melee_weapons: [] };
  const sheet = { inventory: { melee: {} } };

  renderEquippedMelee(selected, data, sheet);
  expect(document.querySelector("#meleeSlots .empty-storage")).not.toBeNull();

  selected.melee_weapons.push({
    id: "mel-a",
    weapon_id: "MELEE-DB-1",
    is_equipped: true,
    hit_points_modifier: 0,
  });
  expect(() => renderEquippedMelee(selected, data, sheet)).not.toThrow();
  expect(document.getElementById("melee-equipped-mel-a")).not.toBeNull();
});

test("reordering stored melee between locations doesn't misattribute is-card-expanded to the wrong item", () => {
  const selected = {
    melee_weapons: [
      { id: "mel-a", weapon_id: "MELEE-DB-1", is_equipped: false, storedAt: "stash", hit_points_modifier: 0 },
      { id: "mel-b", weapon_id: "MELEE-DB-2", is_equipped: false, storedAt: "backpack", hit_points_modifier: 0 },
    ],
  };
  const sheet = { inventory: { melee: {} } };

  renderStoredMelee(selected, data, sheet);
  document.getElementById("melee-stored-mel-b").classList.add("is-card-expanded");

  selected.melee_weapons[0].storedAt = "backpack";
  renderStoredMelee(selected, data, sheet);

  expect(
    document.getElementById("melee-stored-mel-a").classList.contains("is-card-expanded"),
  ).toBe(false);
  expect(
    document.getElementById("melee-stored-mel-b").classList.contains("is-card-expanded"),
  ).toBe(true);
});
