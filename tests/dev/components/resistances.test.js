import {
  renderElementalResistances,
  decimalToPercent,
  percentToDecimal,
} from "dev/public/js/components/resistances.js";
import { resetDOM } from "tests/dev/helpers/domFixture.js";

beforeEach(() => {
  resetDOM(`<table><tbody id="resistancesTable"></tbody></table>`);
});

describe("renderElementalResistances", () => {
  test("is a no-op when the sheet has no elemental_resistances yet", () => {
    renderElementalResistances({ character: {} });
    expect(document.getElementById("resistancesTable").innerHTML).toBe("");
  });

  test("is a no-op when no sheet is given at all", () => {
    renderElementalResistances(undefined);
    expect(document.getElementById("resistancesTable").innerHTML).toBe("");
  });

  test("is a no-op when the #resistancesTable container isn't in the DOM", () => {
    resetDOM(`<div></div>`);
    expect(() =>
      renderElementalResistances({
        character: {
          elemental_resistances: {
            Fire: {
              race_base: 1,
              modifier: 0,
              enchantment_modifier: 0,
              has_enchantment_modifier: false,
              final: 1,
            },
          },
        },
      }),
    ).not.toThrow();
  });

  test("renders race base and final as whole percentages (1 = 100%, 2 = double damage, 0.5 = half damage)", () => {
    const sheet = {
      character: {
        elemental_resistances: {
          Fire: {
            race_base: 0.5, // half damage
            modifier: -0.2,
            enchantment_modifier: 0,
            has_enchantment_modifier: false,
            final: 0.3,
          },
          Necrotic: {
            race_base: 2, // double damage
            modifier: 0,
            enchantment_modifier: 0,
            has_enchantment_modifier: false,
            final: 2,
          },
        },
      },
    };

    renderElementalResistances(sheet);

    const rows = document.querySelectorAll("#resistancesTable tr");
    expect(rows).toHaveLength(2);

    const fireRow = rows[0];
    expect(fireRow.textContent).toContain("Fogo"); // localized label, not the raw key
    expect(fireRow.textContent).toContain("50%"); // race base
    expect(fireRow.textContent).toContain("30%"); // final

    const necroticRow = rows[1];
    expect(necroticRow.textContent).toContain("200%"); // double damage
  });

  test("the modifier stepper displays and steps in whole percentage points", () => {
    renderElementalResistances({
      character: {
        elemental_resistances: {
          Fire: {
            race_base: 1,
            modifier: -0.2,
            enchantment_modifier: 0,
            has_enchantment_modifier: false,
            final: 0.8,
          },
        },
      },
    });

    const stepperInput = document.querySelector(".resistance-input");
    expect(stepperInput.dataset.type).toBe("Fire");
    // -0.2 (raw decimal modifier) displays as -20 (whole percentage points)
    expect(stepperInput.value).toBe("-20");
    // 5-percentage-point step, so +/- taps swing by 0.05 once converted back
    expect(stepperInput.dataset.step).toBe("5");
  });

  test("shows an em-dash for the enchantment cell unless has_enchantment_modifier is true", () => {
    renderElementalResistances({
      character: {
        elemental_resistances: {
          Holy: {
            race_base: 1,
            modifier: 0,
            enchantment_modifier: 0.2,
            has_enchantment_modifier: false,
            final: 1,
          },
        },
      },
    });

    const cell = document.querySelector(
      "#resistancesTable .enchantment-mod-cell",
    );
    expect(cell.textContent).toBe("—");
    expect(cell.classList.contains("enchantment-mod-active")).toBe(false);
  });

  test("shows a '+' prefixed enchantment modifier, as a whole percentage, when has_enchantment_modifier is true", () => {
    renderElementalResistances({
      character: {
        elemental_resistances: {
          Holy: {
            race_base: 1,
            modifier: 0,
            enchantment_modifier: 0.2,
            has_enchantment_modifier: true,
            final: 1.2,
          },
        },
      },
    });

    const cell = document.querySelector(
      "#resistancesTable .enchantment-mod-cell",
    );
    expect(cell.textContent).toBe("+20%");
    expect(cell.classList.contains("enchantment-mod-active")).toBe(true);
  });

  test("shows an unprefixed negative enchantment percentage", () => {
    renderElementalResistances({
      character: {
        elemental_resistances: {
          Holy: {
            race_base: 1,
            modifier: 0,
            enchantment_modifier: -0.1,
            has_enchantment_modifier: true,
            final: 0.9,
          },
        },
      },
    });

    const cell = document.querySelector(
      "#resistancesTable .enchantment-mod-cell",
    );
    expect(cell.textContent).toBe("-10%");
  });

  test("re-rendering replaces the previous rows rather than appending", () => {
    const entry = {
      race_base: 1,
      modifier: 0,
      enchantment_modifier: 0,
      has_enchantment_modifier: false,
      final: 1,
    };

    renderElementalResistances({
      character: { elemental_resistances: { Fire: entry } },
    });
    renderElementalResistances({
      character: { elemental_resistances: { Ice: entry } },
    });

    const rows = document.querySelectorAll("#resistancesTable tr");
    expect(rows).toHaveLength(1);
    expect(rows[0].textContent).toContain("Gelo");
  });
});

describe("decimalToPercent / percentToDecimal", () => {
  test("decimalToPercent converts a raw decimal multiplier to whole percentage points", () => {
    expect(decimalToPercent(1)).toBe(100); // normal damage
    expect(decimalToPercent(2)).toBe(200); // double damage
    expect(decimalToPercent(0.5)).toBe(50); // half damage
    expect(decimalToPercent(0)).toBe(0); // immune
    expect(decimalToPercent(0.2)).toBe(20);
    expect(decimalToPercent(-0.2)).toBe(-20);
  });

  test("decimalToPercent treats a missing/undefined value as 0", () => {
    expect(decimalToPercent(undefined)).toBe(0);
  });

  test("percentToDecimal converts whole percentage points back to a raw decimal multiplier", () => {
    expect(percentToDecimal(100)).toBe(1);
    expect(percentToDecimal(200)).toBe(2);
    expect(percentToDecimal(50)).toBe(0.5);
    expect(percentToDecimal(20)).toBe(0.2);
    expect(percentToDecimal(-20)).toBe(-0.2);
    expect(percentToDecimal(0)).toBe(0);
  });

  test("the two conversions round-trip without floating-point drift", () => {
    [5, -5, 12.5, -33, 0, 100, -100, 200].forEach((percent) => {
      expect(decimalToPercent(percentToDecimal(percent))).toBe(percent);
    });
  });
});
