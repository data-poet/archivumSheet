import {
  getMaterialName,
  updateInventoryUI,
} from "dev/public/js/components/inventory.js";
import {
  t,
  getEncumbranceLabel,
  getCarryLimitLabel,
} from "dev/public/js/localization/pt-BR.js";
import { resetDOM } from "tests/dev/helpers/domFixture.js";

function inventoryDOM() {
  document.body.insertAdjacentHTML(
    "beforeend",
    `
      <input id="weight" value="0" />
      <span id="armor_weight"></span>
      <span id="shield_weight"></span>
      <span id="melee_weight"></span>
      <span id="ranged_weight"></span>
      <span id="firearms_weight"></span>
      <span id="ammo_weight"></span>
      <span id="alchemy_weight"></span>
      <span id="survival_gear_weight"></span>
      <span id="custom_inventory_weight"></span>
      <span id="total_weight"></span>
      <span id="encumbrance"></span>
      <div id="carry_limits"></div>
    `,
  );
}

function carry(overrides = {}) {
  return {
    weight_modifier: 1,
    limits: { none: 10, light: 20, medium: 30, heavy: 40, veryHeavy: 50 },
    ...overrides,
  };
}

beforeEach(() => {
  resetDOM();
});

describe("getMaterialName", () => {
  const materials = [
    { material_id: "MAT-1", material_name: "Aço" },
    { material_id: "MAT-2", material_name: "Prata" },
  ];

  test("returns the matching material's name", () => {
    expect(getMaterialName("MAT-2", materials)).toBe("Prata");
  });

  test("returns the 'common' label when no materialId is given", () => {
    expect(getMaterialName(undefined, materials)).toBe(t("common.common"));
    expect(getMaterialName(null, materials)).toBe(t("common.common"));
    expect(getMaterialName("", materials)).toBe(t("common.common"));
  });

  test("returns 'unknown' when the materialId doesn't match any catalog row", () => {
    expect(getMaterialName("MAT-GHOST", materials)).toBe(t("common.unknown"));
  });

  test("defaults the materials list to empty and still returns 'unknown'", () => {
    expect(getMaterialName("MAT-1")).toBe(t("common.unknown"));
  });
});

describe("updateInventoryUI", () => {
  test("is a no-op when the sheet has no carry_weight yet", () => {
    inventoryDOM();
    updateInventoryUI({ inventory: {} });
    expect(document.getElementById("total_weight").textContent).toBe("");
  });

  test("is a no-op when no sheet is given at all", () => {
    inventoryDOM();
    expect(() => updateInventoryUI(undefined)).not.toThrow();
  });

  test("sums the base carried weight plus every equipment-type weight into total_weight", () => {
    inventoryDOM();
    document.getElementById("weight").value = "5";
    updateInventoryUI({
      inventory: {
        carry_weight: carry(),
        armor: { carried_armor_weight: 10 },
        shield: { carried_shield_weight: 3 },
        melee: { carried_melee_weapons_weight: 2 },
        ranged: { carried_ranged_weapons_weight: 1 },
        firearms: { carried_firearms_weight: 4 },
        ammo: { carried_ammo_weight: 0.5 },
        alchemy: { carried_alchemy_weight: 0.5 },
        survivalGear: { carried_survival_gear_weight: 1 },
        customInventory: { carried_custom_inventory_weight: 2 },
      },
    });

    // 5 base + 10+3+2+1+4+0.5+0.5+1+2 = 29
    expect(document.getElementById("total_weight").textContent).toBe("29");
    expect(document.getElementById("armor_weight").textContent).toBe("10");
    expect(document.getElementById("shield_weight").textContent).toBe("3");
  });

  test("treats missing per-type weight fields and a missing #weight input as 0", () => {
    inventoryDOM();
    document.getElementById("weight").remove();
    updateInventoryUI({ inventory: { carry_weight: carry() } });
    expect(document.getElementById("total_weight").textContent).toBe("0");
  });

  test("treats a non-numeric #weight input value as 0", () => {
    inventoryDOM();
    document.getElementById("weight").value = "abc";
    updateInventoryUI({ inventory: { carry_weight: carry() } });
    expect(document.getElementById("total_weight").textContent).toBe("0");
  });

  test("renders the carry-limits breakdown table with localized headers", () => {
    inventoryDOM();
    updateInventoryUI({ inventory: { carry_weight: carry() } });

    const table = document.getElementById("carry_limits");
    expect(table.textContent).toContain(getCarryLimitLabel("none"));
    expect(table.textContent).toContain(getCarryLimitLabel("veryHeavy"));
    const cells = table.querySelectorAll("td.col-num");
    expect(cells[0].textContent).toBe("10");
    expect(cells[4].textContent).toBe("50");
  });
});

describe("updateInventoryUI — encumbrance thresholds", () => {
  // NOTE: each threshold check maps to the label ONE TIER BELOW its name —
  // e.g. crossing `limits.veryHeavy` is reported as "overloaded", and
  // crossing `limits.heavy` is reported as "veryHeavy". This mirrors the
  // source exactly; it reads oddly but is intentional (locking it in here
  // so a future refactor doesn't accidentally "fix" it into a behavior
  // change).
  const limits = { none: 10, light: 20, medium: 30, heavy: 40, veryHeavy: 50 };

  function weightFor(w) {
    inventoryDOM();
    document.getElementById("weight").value = String(w);
    updateInventoryUI({
      inventory: { carry_weight: { weight_modifier: 2, limits } },
    });
    return document.getElementById("encumbrance").textContent;
  }

  test("at or below the 'none' limit: no encumbrance label", () => {
    expect(weightFor(10)).toBe(`${getEncumbranceLabel("none")} (×2)`);
  });

  test("just above 'none': light", () => {
    expect(weightFor(11)).toBe(`${getEncumbranceLabel("light")} (×2)`);
  });

  test("at the 'light' limit: medium", () => {
    expect(weightFor(20)).toBe(`${getEncumbranceLabel("medium")} (×2)`);
  });

  test("at the 'medium' limit: heavy", () => {
    expect(weightFor(30)).toBe(`${getEncumbranceLabel("heavy")} (×2)`);
  });

  test("at the 'heavy' limit: veryHeavy", () => {
    expect(weightFor(40)).toBe(`${getEncumbranceLabel("veryHeavy")} (×2)`);
  });

  test("at or above the 'veryHeavy' limit: overloaded", () => {
    expect(weightFor(50)).toBe(`${getEncumbranceLabel("overloaded")} (×2)`);
    expect(weightFor(999)).toBe(`${getEncumbranceLabel("overloaded")} (×2)`);
  });
});
