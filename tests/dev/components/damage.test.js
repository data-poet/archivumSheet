import { renderDamage } from "dev/public/js/components/damage.js";
import { resetDOM } from "tests/dev/helpers/domFixture.js";

beforeEach(() => {
  resetDOM(`<table><tbody id="damageTable"></tbody></table>`);
});

describe("renderDamage", () => {
  test("is a no-op when the sheet has no base_damage yet", () => {
    renderDamage({ character: {} });
    expect(document.getElementById("damageTable").innerHTML).toBe("");
  });

  test("is a no-op when no sheet is given at all", () => {
    renderDamage(undefined);
    expect(document.getElementById("damageTable").innerHTML).toBe("");
  });

  test("renders one row per damage type with dice, both modifiers, and an editable stepper", () => {
    const sheet = {
      character: {
        base_damage: {
          thrust: {
            dice: "1d-2",
            base_modifier: 0,
            modifier: 1,
            final_modifier: 1,
          },
          swing: {
            dice: "1d+1",
            base_modifier: 0,
            modifier: -1,
            final_modifier: -1,
          },
        },
      },
    };

    renderDamage(sheet);

    const rows = document.querySelectorAll("#damageTable tr");
    expect(rows).toHaveLength(2);

    const thrustRow = rows[0];
    expect(thrustRow.textContent).toContain("thrust");
    expect(thrustRow.textContent).toContain("1d-2");
    const stepperInput = thrustRow.querySelector(".damage-input");
    expect(stepperInput.dataset.type).toBe("thrust");
    expect(stepperInput.value).toBe("1");
    expect(thrustRow.textContent).toContain("1");
  });

  test("re-rendering replaces the previous rows rather than appending", () => {
    renderDamage({
      character: {
        base_damage: {
          thrust: {
            dice: "1d-2",
            base_modifier: 0,
            modifier: 0,
            final_modifier: 0,
          },
        },
      },
    });
    renderDamage({
      character: {
        base_damage: {
          swing: {
            dice: "1d+1",
            base_modifier: 0,
            modifier: 0,
            final_modifier: 0,
          },
        },
      },
    });

    const rows = document.querySelectorAll("#damageTable tr");
    expect(rows).toHaveLength(1);
    expect(rows[0].textContent).toContain("swing");
  });
});
