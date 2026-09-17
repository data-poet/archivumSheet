import { renderStoredMelee } from "dev/public/js/engine/inventory/melee/render.js";
import { renderStoredArmors } from "dev/public/js/engine/inventory/armor/render.js";
import { renderStoredFirearms } from "dev/public/js/engine/inventory/firearms/render.js";
import { resetDOM } from "tests/dev/helpers/domFixture.js";

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
    expect(rows[0].querySelector(".col-title").textContent).toBe(
      "Espada Longa",
    );
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
    expect(rows[0].querySelector(".col-title").textContent).toBe(
      "Cota de Malha",
    );
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
});
