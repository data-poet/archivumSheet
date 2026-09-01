import { renderResume } from "dev/public/js/components/resume.js";
import {
  t,
  getEncumbranceLabel,
  getCarryLimitLabel,
} from "dev/public/js/localization/pt-BR/index.js";
import { resetResumeDOM } from "tests/dev/helpers/resumeDomFixture.js";

function id(x) {
  return document.getElementById(x);
}

function carry(overrides = {}) {
  return {
    weight_modifier: 1,
    limits: { none: 10, light: 20, medium: 30, heavy: 40, veryHeavy: 50 },
    ...overrides,
  };
}

beforeEach(() => {
  resetResumeDOM();
});

describe("renderResumeWeight", () => {
  test("sums the base #weight input plus every equipment type's carried weight", () => {
    id("weight").value = "5";
    renderResume({
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
        magicGear: { carried_magic_gear_weight: 1 },
        customInventory: { carried_custom_inventory_weight: 1 },
        coinPurse: { carried_coin_purse_weight: 1 },
      },
    });

    // 5 base + 10+3+2+1+4+0.5+0.5+1+1+1+1 = 30
    expect(id("resume_total_weight_cell").textContent).toContain("30");
    expect(id("total_weight").textContent).toBe("30");
    expect(id("armor_weight").textContent).toBe("10");
  });

  test("rounds up (ceiling, not nearest) to 3 decimal places — a documented quirk, not a rounding bug", () => {
    // 0.1 + 0.2 in raw JS float math is 0.30000000000000004. The source
    // uses Math.ceil(total * 1000) / 1000, which pushes that up to 0.301
    // rather than down to the "intuitively correct" 0.3 — worth locking in
    // explicitly so a future "fix" to Math.round doesn't silently change
    // carry-weight totals across every character sheet.
    id("weight").value = "0.1";
    renderResume({
      inventory: {
        carry_weight: carry(),
        armor: { carried_armor_weight: 0.2 },
      },
    });
    expect(id("total_weight").textContent).toBe("0.301");
  });

  test("treats a missing #weight input and missing per-type fields as 0", () => {
    id("weight").remove();
    renderResume({ inventory: { carry_weight: carry() } });
    expect(id("total_weight").textContent).toBe("0");
  });

  test("renders the per-type weight breakdown table with localized labels", () => {
    renderResume({
      inventory: { carry_weight: carry(), armor: { carried_armor_weight: 7 } },
    });
    const tbody = id("resume_weight_tbody");
    expect(tbody.textContent).toContain(t("resume.armorWeight"));
    expect(tbody.textContent).toContain(t("sections.firearms"));
    expect(tbody.textContent).toContain(t("coinPurse.coinPurseWeight"));
    expect(tbody.querySelector("td.col-num").textContent).toBe("7");
  });

  test("renders the carry-limits table only when carry_weight data exists", () => {
    id("weight").value = "0";
    renderResume({ inventory: {} }); // no carry_weight at all
    expect(id("carry_limits").innerHTML).toBe("");

    renderResume({ inventory: { carry_weight: carry() } });
    const limitsTable = id("carry_limits");
    expect(limitsTable.textContent).toContain(getCarryLimitLabel("none"));
    const cells = limitsTable.querySelectorAll("td.col-num");
    expect(cells[0].textContent).toBe("10");
    expect(cells[4].textContent).toBe("50");
  });

  test("shows an em-dash encumbrance label when there's no carry_weight to compare against", () => {
    renderResume({ inventory: {} });
    expect(id("encumbrance").textContent).toBe("—");
  });

  // Same "reports the tier one below the crossed threshold" behavior already
  // locked in for components/inventory.js in Batch 7c — resume.js duplicates
  // this exact threshold ladder rather than sharing it, so it's worth
  // re-verifying here in case the two copies ever drift apart.
  describe("encumbrance thresholds (mirrors inventory.js's ladder)", () => {
    const limits = {
      none: 10,
      light: 20,
      medium: 30,
      heavy: 40,
      veryHeavy: 50,
    };

    function weightFor(w) {
      id("weight").value = String(w);
      renderResume({
        inventory: { carry_weight: { weight_modifier: 3, limits } },
      });
      return id("encumbrance").textContent;
    }

    test("at the 'none' limit exactly: still none", () => {
      expect(weightFor(10)).toBe(`${getEncumbranceLabel("none")} (×3)`);
    });

    test("just above 'none': light", () => {
      expect(weightFor(11)).toBe(`${getEncumbranceLabel("light")} (×3)`);
    });

    test("at or above 'veryHeavy': overloaded", () => {
      expect(weightFor(50)).toBe(`${getEncumbranceLabel("overloaded")} (×3)`);
      expect(weightFor(500)).toBe(`${getEncumbranceLabel("overloaded")} (×3)`);
    });
  });
});

describe("renderResumeValue", () => {
  test("sums carried value across all 11 valued equipment types", () => {
    renderResume({
      inventory: {
        armor: { carried_armor_value: 100 },
        shield: { carried_shield_value: 50 },
        melee: { carried_melee_weapons_value: 20 },
        ranged: { carried_ranged_weapons_value: 30 },
        firearms: { carried_firearms_value: 200 },
        ammo: { carried_ammo_value: 5 },
        alchemy: { carried_alchemy_value: 15 },
        survivalGear: { carried_survival_gear_value: 10 },
        accessories: { carried_accessory_value: 25 },
        magicGear: { carried_magic_gear_value: 300 },
        customInventory: { carried_custom_inventory_value: 1 },
      },
    });

    expect(id("resume_total_value_cell").textContent).toContain("756");
  });

  test("treats every missing per-type value field as 0", () => {
    renderResume({ inventory: {} });
    expect(id("resume_total_value_cell").textContent).toContain("0");
  });

  test("renders the per-type value breakdown with localized labels", () => {
    renderResume({
      inventory: { magicGear: { carried_magic_gear_value: 42 } },
    });
    const tbody = id("resume_value_tbody");
    expect(tbody.textContent).toContain(t("magicGear.title"));
    expect(tbody.textContent).toContain(t("sections.accessories"));
    const magicRow = Array.from(tbody.querySelectorAll("tr")).find((r) =>
      r.textContent.includes(t("magicGear.title")),
    );
    expect(magicRow.querySelector("td.col-num").textContent).toBe("42");
  });

  test("shows the coins row and formatted total only when the coin purse backpack has entries", () => {
    renderResume({
      inventory: {
        coinPurse: {
          backpack: [{ total_value: 1000 }, { total_value: 234.5 }],
        },
      },
    });
    expect(id("resume_coins_row").hidden).toBe(false);
    expect(document.querySelector(".resume-coins-value").textContent).toBe(
      (1234.5).toLocaleString("pt-BR"),
    );
  });

  test("hides the coins row when the backpack is empty or absent", () => {
    id("resume_coins_row").hidden = false;
    renderResume({ inventory: {} });
    expect(id("resume_coins_row").hidden).toBe(true);
  });
});

describe("renderResumePoints", () => {
  test("sums points across all 6 character-point categories", () => {
    renderResume({
      character: {
        character_points: {
          primary_attributes: 20,
          secondary_attributes: 5,
          advantages: 30,
          disadvantages: -10,
          skills: 15,
          spells: 8,
        },
      },
    });
    expect(id("resume_total_points_cell").textContent).toContain("68");
  });

  test("treats a missing character_points object as all zeros", () => {
    renderResume({ character: {} });
    expect(id("resume_total_points_cell").textContent).toContain("0");
  });

  test("renders the per-category breakdown with localized labels", () => {
    renderResume({
      character: { character_points: { advantages: 12 } },
    });
    const tbody = id("resume_points_tbody");
    expect(tbody.textContent).toContain(t("resume.primaryAttributes"));
    expect(tbody.textContent).toContain(t("resume.advantages"));
    const advRow = Array.from(tbody.querySelectorAll("tr")).find((r) =>
      r.textContent.includes(t("resume.advantages")),
    );
    expect(advRow.querySelector("td.col-num").textContent).toBe("12");
  });

  test("allows a negative disadvantages total to pull the grand total down", () => {
    renderResume({
      character: {
        character_points: { primary_attributes: 20, disadvantages: -30 },
      },
    });
    expect(id("resume_total_points_cell").textContent).toContain("-10");
  });
});
