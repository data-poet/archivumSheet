import {
  renderEquippedShield,
  renderStoredShields,
} from "dev/public/js/engine/inventory/shield/render.js";
import { resetDOM } from "tests/dev/helpers/domFixture.js";
import { resetState } from "tests/dev/helpers/stateFixture.js";

const data = {
  shields: [
    { shield_id: "SH-1", shield_name: "Escudo de Madeira", shield_tier: "Comum" },
    { shield_id: "SH-2", shield_name: "Escudo de Aço", shield_tier: "Fino" },
  ],
  materials: [],
};

beforeEach(() => {
  resetDOM(`<div id="shieldSlot"></div><div id="shieldStorageList"></div>`);
  resetState();
});

test("equipped shield: HP input keeps focus/typed value and the item-tabs <details> stays open across a re-render", () => {
  const selected = {
    shields: [{ id: "sh-equipped", shield_id: "SH-1", is_equipped: true, hit_points_modifier: 0 }],
  };
  const sheet = { inventory: { shield: { equipped: { id: "sh-equipped" } } } };

  renderEquippedShield(selected, data, sheet);

  const hpInput = document.querySelector("#shieldSlot .equipped-shield-hp");
  hpInput.focus();
  hpInput.value = "-3";

  const details = document.querySelector("#equipped-detail-sh-equipped details");
  details.setAttribute("open", "");

  // Simulate an unrelated re-render (e.g. material changed) while the user is mid-edit elsewhere.
  selected.shields[0].material_id = "mat-x";
  renderEquippedShield(selected, data, sheet);

  expect(document.activeElement.classList.contains("equipped-shield-hp")).toBe(true);
  expect(document.activeElement.value).toBe("-3");
  expect(document.querySelector("#equipped-detail-sh-equipped details").hasAttribute("open")).toBe(true);
});

test("stored shields: storage-section <details>, a row's is-card-expanded, and its detail-row keep state across a re-render, and don't cross-contaminate between rows", () => {
  const selected = {
    shields: [
      { id: "sh-a", shield_id: "SH-1", is_equipped: false, storedAt: "backpack", hit_points_modifier: 0 },
      { id: "sh-b", shield_id: "SH-2", is_equipped: false, storedAt: "backpack", hit_points_modifier: 0 },
    ],
  };
  const sheet = { inventory: { shield: {} } };

  renderStoredShields(selected, data, sheet);

  const backpackDetails = document.querySelector('[data-storage-loc="backpack"]');
  backpackDetails.setAttribute("open", "");

  const rowA = document.getElementById("shield-stored-sh-a");
  rowA.classList.add("is-card-expanded");

  const rowB = document.getElementById("shield-stored-sh-b");
  expect(rowB.classList.contains("is-card-expanded")).toBe(false);

  // Re-render after an unrelated change (e.g. sh-b's HP modifier changes).
  selected.shields[1].hit_points_modifier = -2;
  renderStoredShields(selected, data, sheet);

  expect(document.querySelector('[data-storage-loc="backpack"]').hasAttribute("open")).toBe(true);
  expect(document.getElementById("shield-stored-sh-a").classList.contains("is-card-expanded")).toBe(true);
  // sh-b must NOT have inherited sh-a's expanded state — distinct, stable per-row ids are the point.
  expect(document.getElementById("shield-stored-sh-b").classList.contains("is-card-expanded")).toBe(false);
});

test("reordering stored shields (moving storage location) doesn't misattribute is-card-expanded to the wrong item", () => {
  const selected = {
    shields: [
      { id: "sh-a", shield_id: "SH-1", is_equipped: false, storedAt: "stash", hit_points_modifier: 0 },
      { id: "sh-b", shield_id: "SH-2", is_equipped: false, storedAt: "backpack", hit_points_modifier: 0 },
    ],
  };
  const sheet = { inventory: { shield: {} } };

  renderStoredShields(selected, data, sheet);
  document.getElementById("shield-stored-sh-b").classList.add("is-card-expanded");

  // sh-a moves from stash to backpack, landing ABOVE sh-b in DOM order within that section —
  // the exact scenario where position-based matching (no ids) would move expanded state onto
  // the wrong row.
  selected.shields[0].storedAt = "backpack";
  renderStoredShields(selected, data, sheet);

  expect(document.getElementById("shield-stored-sh-a").classList.contains("is-card-expanded")).toBe(false);
  expect(document.getElementById("shield-stored-sh-b").classList.contains("is-card-expanded")).toBe(true);
});
