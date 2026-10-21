import {
  renderEquippedFirearms,
  renderStoredFirearms,
} from "dev/public/js/engine/inventory/firearms/render.js";
import { resetDOM } from "tests/dev/helpers/domFixture.js";
import { resetState } from "tests/dev/helpers/stateFixture.js";

const data = {
  firearms: [
    {
      weapon_id: "FIREARM-DB-1",
      weapon_name: "Pistola",
      weapon_tier: "I",
      weapon_hit_points: 6,
      weapon_magazine_size: 8,
    },
    {
      weapon_id: "FIREARM-DB-2",
      weapon_name: "Rifle",
      weapon_tier: "I",
      weapon_hit_points: 8,
      weapon_magazine_size: 10,
    },
  ],
  materials: [],
};

beforeEach(() => {
  resetDOM(`<div id="firearmSlots"></div><div id="firearmStorageList"></div>`);
  resetState();
});

test("equipped firearm: rounds-loaded input keeps focus/typed value and the item-tabs <details> stays open across a re-render", () => {
  const selected = {
    firearms: [
      {
        id: "fa-a",
        weapon_id: "FIREARM-DB-1",
        is_equipped: true,
        hit_points_modifier: 0,
        rounds_loaded: 8,
      },
    ],
  };
  const sheet = { inventory: { firearms: {} } };

  renderEquippedFirearms(selected, data, sheet);

  const roundsInput = document.querySelector(
    "#firearm-equipped-fa-a .equipped-firearm-rounds",
  );
  roundsInput.focus();
  roundsInput.value = "3";

  const details = document.querySelector("#equipped-detail-fa-a details");
  details.setAttribute("open", "");

  selected.firearms[0].material_id = "mat-x";
  renderEquippedFirearms(selected, data, sheet);

  expect(
    document.activeElement.classList.contains("equipped-firearm-rounds"),
  ).toBe(true);
  expect(document.activeElement.value).toBe("3");
  expect(
    document.querySelector("#equipped-detail-fa-a details").hasAttribute("open"),
  ).toBe(true);
});

test("stored firearm: the data row's and its sibling magazine row's is-card-expanded/identity survive a re-render, including when an unrelated item changes storage location", () => {
  const selected = {
    firearms: [
      {
        id: "fa-a",
        weapon_id: "FIREARM-DB-1",
        is_equipped: false,
        storedAt: "backpack",
        hit_points_modifier: 0,
        rounds_loaded: 4,
      },
      {
        id: "fa-b",
        weapon_id: "FIREARM-DB-2",
        is_equipped: false,
        storedAt: "backpack",
        hit_points_modifier: 0,
        rounds_loaded: 6,
      },
    ],
  };
  const sheet = { inventory: { firearms: {} } };

  renderStoredFirearms(selected, data, sheet);
  document.getElementById("firearm-stored-fa-b").classList.add("is-card-expanded");

  // fa-a moves to stash — a different storage-section <details> entirely, not just a
  // reorder within one. fa-b never moves; its expanded state must be untouched by it.
  selected.firearms[0].storedAt = "stash";
  renderStoredFirearms(selected, data, sheet);

  expect(
    document.getElementById("firearm-stored-fa-b").classList.contains("is-card-expanded"),
  ).toBe(true);
  expect(
    document.getElementById("firearm-stored-fa-a").classList.contains("is-card-expanded"),
  ).toBe(false);
  // Both rows kept their own distinct, stable id — the magazine row didn't bleed onto fa-b.
  expect(document.getElementById("firearm-stored-fa-a-magazine")).not.toBeNull();
  expect(document.getElementById("firearm-stored-fa-b-magazine")).not.toBeNull();
});

// Known limitation, not specific to firearms: a node that *itself* physically relocates to a
// different <details> parent (a cross-storage-location move) can lose DOM focus during that
// move even though idiomorph preserves its node identity — ignoreActiveValue only protects a
// value while the element *is* the active element, so once focus drops the fresh value wins.
// This only matters if the user is mid-typing in a row's own field at the exact moment that
// same row's storage location changes elsewhere in the same tick — narrow, but real; confirmed
// empirically against the vendored idiomorph rather than assumed. A row that stays in the same
// storage section (the common case — the other morph.test.js files cover it) is unaffected.
test("(documents a known limit) a row's own typed value is not guaranteed across its own cross-location move", () => {
  const selected = {
    firearms: [
      {
        id: "fa-a",
        weapon_id: "FIREARM-DB-1",
        is_equipped: false,
        storedAt: "backpack",
        hit_points_modifier: 0,
        rounds_loaded: 4,
      },
    ],
  };
  const sheet = { inventory: { firearms: {} } };

  renderStoredFirearms(selected, data, sheet);
  const roundsInputA = document.querySelector(
    "#firearm-stored-fa-a-magazine .stored-firearm-rounds",
  );
  roundsInputA.focus();
  roundsInputA.value = "2";

  selected.firearms[0].storedAt = "stash";
  renderStoredFirearms(selected, data, sheet);

  // Documents today's actual behavior (focus is lost, so the fresh value wins) rather than
  // asserting a guarantee that doesn't hold — a regression test for the opposite direction:
  // if this starts failing because the value now reverts to "4", that's progress, not a break.
  expect(
    document.querySelector("#firearm-stored-fa-a-magazine .stored-firearm-rounds")
      .value,
  ).toBe("4");
});
