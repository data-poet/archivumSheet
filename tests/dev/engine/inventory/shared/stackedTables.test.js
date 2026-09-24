import { renderStoredMelee } from "dev/public/js/engine/inventory/melee/render.js";
import { renderStoredArmors } from "dev/public/js/engine/inventory/armor/render.js";
import { renderStoredFirearms } from "dev/public/js/engine/inventory/firearms/render.js";
import { renderAlchemy } from "dev/public/js/engine/inventory/alchemy/render.js";
import { renderCoinPurse } from "dev/public/js/engine/inventory/coinPurse/render.js";
import { resetDOM } from "tests/dev/helpers/domFixture.js";

// Collapsed by default, and the row must be keyable — the click-to-expand state (a
// separate concern, see shared/cardCollapse.js and shared/openState.js) only survives
// this section's frequent full re-renders if openState's row-identity lookup finds a key.
function expectCollapsibleCard(row) {
  const toggle = row.querySelector(".card-toggle");
  expect(toggle).not.toBeNull();
  expect(toggle.getAttribute("aria-expanded")).toBe("false");
  expect(row.classList.contains("is-card-expanded")).toBe(false);
}

const MATERIALS = [{ material_id: "MAT-001", material_name: "Aço" }];

function stackedRows(containerId) {
  return [
    ...document.querySelectorAll(
      `#${containerId} .table-wrapper--stack tbody tr`,
    ),
  ].filter((tr) => !tr.matches(".empty-row, .detail-row, .magazine-row"));
}

// The card layout hides <thead>, so every data cell has to carry its own label:
// exactly one .col-title for the card heading, and a data-label on everything else
// that isn't the button cluster. A new column without one renders as a bare value.
function expectEveryCellLabelled(row) {
  const cells = [...row.children];
  expect(cells.filter((td) => td.classList.contains("col-title"))).toHaveLength(
    1,
  );

  const unlabelled = cells.filter(
    (td) =>
      !td.classList.contains("col-title") &&
      !td.classList.contains("col-action") &&
      !td.hasAttribute("data-label"),
  );
  expect(unlabelled.map((td) => td.outerHTML)).toEqual([]);
}

beforeEach(() => {
  resetDOM(`
    <div id="meleeStorageList"></div>
    <div id="armorStorageList"></div>
    <div id="firearmStorageList"></div>
    <div id="alchemyList"></div>
    <div id="coinPurseList"></div>
  `);
});

describe("stored inventory tables opt into the stacked card layout", () => {
  test("melee labels every cell and titles the card with the weapon name", () => {
    renderStoredMelee(
      {
        melee_weapons: [
          {
            _instanceId: "MELEE-1",
            weapon_id: "MELEE-DB-1",
            material_id: "MAT-001",
            storedAt: "backpack",
            is_equipped: false,
          },
        ],
      },
      {
        melee_weapons: [
          {
            weapon_id: "MELEE-DB-1",
            weapon_name: "Espada Longa",
            weapon_tier: "I",
            weapon_hit_points: 10,
          },
        ],
        materials: MATERIALS,
      },
      null,
    );

    const rows = stackedRows("meleeStorageList");
    expect(rows).toHaveLength(1);
    expectEveryCellLabelled(rows[0]);
    expect(rows[0].querySelector(".card-title-text").textContent).toBe(
      "Espada Longa",
    );
    expectCollapsibleCard(rows[0]);
  });

  test("armor titles the card with the name, not the leading body-slot cell", () => {
    renderStoredArmors(
      {
        armors: [
          {
            _instanceId: "ARMOR-1",
            armor_id: "ARMOR-DB-1",
            material_id: "MAT-001",
            storedAt: "backpack",
            is_equipped: false,
          },
        ],
      },
      {
        armors: [
          {
            armor_id: "ARMOR-DB-1",
            armor_name: "Cota de Malha",
            armor_piece_location: "Tronco",
            armor_tier: "I",
            armor_hit_points: 12,
          },
        ],
        materials: MATERIALS,
      },
      null,
    );

    const rows = stackedRows("armorStorageList");
    expect(rows).toHaveLength(1);
    expectEveryCellLabelled(rows[0]);

    const cells = [...rows[0].children];
    expect(cells[0].dataset.label).toBeTruthy();
    expect(cells[0].textContent).toBe("Tronco");
    expect(rows[0].querySelector(".card-title-text").textContent).toBe(
      "Cota de Malha",
    );
    expectCollapsibleCard(rows[0]);
  });

  test("the firearms magazine row is classed so it joins the card above it", () => {
    renderStoredFirearms(
      {
        firearms: [
          {
            _instanceId: "FIREARM-1",
            weapon_id: "FIREARM-DB-1",
            material_id: "MAT-001",
            storedAt: "backpack",
            is_equipped: false,
            rounds_loaded: 3,
          },
        ],
      },
      {
        firearms: [
          {
            weapon_id: "FIREARM-DB-1",
            weapon_name: "Mosquete",
            weapon_tier: "I",
            weapon_hit_points: 8,
            weapon_magazine_size: 6,
          },
        ],
        materials: MATERIALS,
      },
      null,
    );

    const all = [
      ...document.querySelectorAll("#firearmStorageList tbody tr"),
    ].filter((tr) => !tr.matches(".empty-row"));

    // Without the class the magazine cell would be styled as a card heading and
    // detach the tab strip below it into a third floating card.
    expect(all.map((tr) => tr.className)).toEqual([
      "",
      "magazine-row",
      "detail-row",
    ]);
  });

  // Alchemy/survivalGear/coinPurse key their rows on domain-specific attributes
  // (data-consumable-id, data-gear-id, data-coin-type) rather than data-instance-id — these
  // had to be added to openState.js's ROW_KEY_ATTRS for the expand state to survive a
  // re-render at all (see that module).
  test("alchemy's card is collapsible and its row resolves a stable key via data-consumable-id", () => {
    renderAlchemy(
      {
        alchemy: [
          { consumable_id: "CONS-1", quantity: 2, storedAt: "backpack" },
        ],
      },
      {
        alchemy: [
          {
            consumable_id: "CONS-1",
            consumable_name: "Poção de Cura",
            consumable_tier: "I",
          },
        ],
      },
      null,
    );

    const rows = stackedRows("alchemyList");
    expect(rows).toHaveLength(1);
    expect(rows[0].querySelector(".card-title-text").textContent).toBe(
      "Poção de Cura",
    );
    expectCollapsibleCard(rows[0]);
    expect(rows[0].querySelector("[data-consumable-id]")).not.toBeNull();
  });

  test("coin purse's card is collapsible and its row resolves a stable key via data-coin-type", () => {
    renderCoinPurse(
      { coins: [{ coin_type: "gold", quantity: 5, storedAt: "backpack" }] },
      {},
      null,
    );

    const rows = stackedRows("coinPurseList");
    expect(rows).toHaveLength(1);
    expectCollapsibleCard(rows[0]);
    expect(rows[0].querySelector("[data-coin-type]")).not.toBeNull();
  });
});
