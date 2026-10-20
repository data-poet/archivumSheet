import { renderEquippedShield } from "dev/public/js/engine/inventory/shield/render.js";
import { t } from "dev/public/js/localization/pt-BR/index.js";
import { resetDOM } from "tests/dev/helpers/domFixture.js";
import { resetState } from "tests/dev/helpers/stateFixture.js";

const data = {
  shields: [
    {
      shield_id: "SH-1",
      shield_name: "Escudo",
      shield_tier: "Comum",
      shield_type: "Escudo",
    },
  ],
  materials: [],
};
const selected = {
  shields: [{ id: "sh-1", shield_id: "SH-1", is_equipped: true }],
};
const sheetWith = (shield) => ({
  inventory: { shield: { equipped: { id: "sh-1", ...shield } } },
});

function blockCell() {
  const labels = [...document.querySelectorAll("#shieldSlot .detail-label")];
  const label = labels.find((node) => node.textContent === t("shield.block"));
  return label?.nextElementSibling ?? label?.parentElement;
}

beforeEach(() => {
  resetDOM(`<div id="shieldSlot"></div>`);
  resetState();
});

describe("renderEquippedShield — Block", () => {
  test("shows the effective Block with the base beside it when a condition applies", () => {
    renderEquippedShield(
      selected,
      data,
      sheetWith({ block: 9, effective_block: 5 }),
    );

    const modified = document.querySelector("#shieldSlot .condition-modified");
    expect(modified.textContent).toMatch(/^5\s+\(9\)$/);
    expect(modified.title).toBe("Condições −4 (base 9)");
  });

  test("shows a plain Block otherwise", () => {
    renderEquippedShield(selected, data, sheetWith({ block: 9 }));

    expect(
      document.querySelector("#shieldSlot .condition-modified"),
    ).toBeNull();
    expect(document.getElementById("shieldSlot").textContent).toContain("9");
  });

  test("shows a dash while the engine has not built the shield yet", () => {
    renderEquippedShield(selected, data, undefined);

    expect(
      document.querySelector("#shieldSlot .condition-modified"),
    ).toBeNull();
    expect(blockCell()?.textContent ?? "—").toContain("—");
  });
});
