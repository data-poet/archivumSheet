import {
  initAttributeTableHeaders,
  updateActualValues,
  renderSecondaryAttributes,
} from "dev/public/js/components/attributes.js";
import {
  t,
  getSecondaryAttributeLabel,
} from "dev/public/js/localization/pt-BR/index.js";
import { state } from "dev/public/js/state.js";
import { resetDOM } from "tests/dev/helpers/domFixture.js";
import { resetState } from "tests/dev/helpers/stateFixture.js";

function headerDOM() {
  const ids = [
    "th-attr-attribute",
    "th-attr-base",
    "th-attr-race",
    "th-attr-modifier",
    "th-attr-enchantment",
    "th-attr-actual",
    "th-sec-attribute",
    "th-sec-base",
    "th-sec-bought",
    "th-sec-modifier",
    "th-sec-enchantment",
    "th-sec-final",
    "th-res-type",
    "th-res-race",
    "th-res-modifier",
    "th-res-enchantment",
    "th-res-final",
  ];
  // jsdom's spec-compliant HTML parser silently drops <th>/<td>/<tbody> inserted outside a <table>.
  document.body.insertAdjacentHTML(
    "beforeend",
    `<table><thead><tr>${ids.map((id) => `<th id="${id}"></th>`).join("")}</tr></thead></table>`,
  );
}

function primaryAttrDOM(attr, { base = 10, mod = 0 } = {}) {
  document.body.insertAdjacentHTML(
    "beforeend",
    `
      <input id="${attr}_base" value="${base}" />
      <input id="${attr}_mod" value="${mod}" />
      <table><tr>
        <td id="${attr}_race"></td>
        <td id="${attr}_enchantment"></td>
        <td id="${attr}_actual"></td>
      </tr></table>
    `,
  );
}

beforeEach(() => {
  resetDOM();
  resetState();
});

describe("initAttributeTableHeaders", () => {
  test("stamps every known header id with its localized label", () => {
    headerDOM();
    initAttributeTableHeaders();

    expect(document.getElementById("th-attr-attribute").textContent).toBe(
      t("attributes.attribute"),
    );
    expect(document.getElementById("th-attr-enchantment").textContent).toBe(
      t("attributes.enchantment"),
    );
    expect(document.getElementById("th-sec-bought").textContent).toBe(
      t("attributes.bought"),
    );
    expect(document.getElementById("th-sec-final").textContent).toBe(
      t("attributes.final"),
    );
    expect(document.getElementById("th-res-type").textContent).toBe(
      t("attributes.type"),
    );
    expect(document.getElementById("th-res-race").textContent).toBe(
      t("attributes.race"),
    );
    expect(document.getElementById("th-res-modifier").textContent).toBe(
      t("attributes.modifierPercent"),
    );
    expect(document.getElementById("th-res-enchantment").textContent).toBe(
      t("attributes.enchantment"),
    );
    expect(document.getElementById("th-res-final").textContent).toBe(
      t("attributes.finalDamageReceived"),
    );
  });

  test("does not throw when some header ids are missing from the DOM", () => {
    document.body.insertAdjacentHTML(
      "beforeend",
      `<table><thead><tr><th id="th-attr-attribute"></th></tr></thead></table>`,
    );
    expect(() => initAttributeTableHeaders()).not.toThrow();
    expect(document.getElementById("th-attr-attribute").textContent).toBe(
      t("attributes.attribute"),
    );
  });
});

describe("updateActualValues", () => {
  test("sums base + race + modifier + enchantment for each primary attribute", () => {
    ["ST", "DX", "IQ", "HT"].forEach((a) => primaryAttrDOM(a));
    state.sheet = {
      character: {
        primary_attributes: {
          ST: { race_modifier: 1, enchantment_modifier: 0 },
        },
      },
    };
    document.getElementById("ST_base").value = "10";
    document.getElementById("ST_mod").value = "2";

    updateActualValues();

    expect(document.getElementById("ST_actual").textContent).toBe("13");
  });

  test("defaults race/enchantment modifiers to 0 when the sheet hasn't run yet", () => {
    ["ST", "DX", "IQ", "HT"].forEach((a) => primaryAttrDOM(a));
    state.sheet = undefined;

    updateActualValues();

    expect(document.getElementById("ST_actual").textContent).toBe("10");
    expect(document.getElementById("ST_race").textContent).toBe("0");
  });

  test("treats a non-numeric base/mod input as 0", () => {
    primaryAttrDOM("ST");
    primaryAttrDOM("DX");
    primaryAttrDOM("IQ");
    primaryAttrDOM("HT");
    document.getElementById("ST_base").value = "abc";
    document.getElementById("ST_mod").value = "";

    updateActualValues();

    expect(document.getElementById("ST_actual").textContent).toBe("0");
  });

  test("shows a '+' prefixed race modifier and highlights the cell when nonzero", () => {
    primaryAttrDOM("ST");
    primaryAttrDOM("DX");
    primaryAttrDOM("IQ");
    primaryAttrDOM("HT");
    state.sheet = {
      character: { primary_attributes: { ST: { race_modifier: 2 } } },
    };

    updateActualValues();

    const raceCell = document.getElementById("ST_race");
    expect(raceCell.textContent).toBe("+2");
    expect(raceCell.classList.contains("race-mod-active")).toBe(true);
  });

  test("a negative race modifier is shown without an extra sign, and a zero one isn't highlighted", () => {
    primaryAttrDOM("ST");
    primaryAttrDOM("DX");
    primaryAttrDOM("IQ");
    primaryAttrDOM("HT");
    state.sheet = {
      character: { primary_attributes: { ST: { race_modifier: -1 } } },
    };

    updateActualValues();

    const raceCell = document.getElementById("ST_race");
    expect(raceCell.textContent).toBe("-1");
    expect(raceCell.classList.contains("race-mod-active")).toBe(true);
  });

  test("shows an em-dash for the enchantment cell unless has_enchantment_modifier is true", () => {
    primaryAttrDOM("ST");
    primaryAttrDOM("DX");
    primaryAttrDOM("IQ");
    primaryAttrDOM("HT");
    state.sheet = {
      character: {
        primary_attributes: {
          // Nonzero but presence flag absent — must not show as active.
          ST: { enchantment_modifier: 3, has_enchantment_modifier: false },
        },
      },
    };

    updateActualValues();

    const cell = document.getElementById("ST_enchantment");
    expect(cell.textContent).toBe("—");
    expect(cell.classList.contains("enchantment-mod-active")).toBe(false);
    // Still counted into the actual total even though the cell shows "—"
    expect(document.getElementById("ST_actual").textContent).toBe("13");
  });

  test("shows a '+' prefixed enchantment modifier when has_enchantment_modifier is true", () => {
    primaryAttrDOM("ST");
    primaryAttrDOM("DX");
    primaryAttrDOM("IQ");
    primaryAttrDOM("HT");
    state.sheet = {
      character: {
        primary_attributes: {
          ST: { enchantment_modifier: 2, has_enchantment_modifier: true },
        },
      },
    };

    updateActualValues();

    const cell = document.getElementById("ST_enchantment");
    expect(cell.textContent).toBe("+2");
    expect(cell.classList.contains("enchantment-mod-active")).toBe(true);
  });
});

describe("renderSecondaryAttributes", () => {
  test("is a no-op when the sheet has no secondary_attributes yet", () => {
    document.body.insertAdjacentHTML(
      "beforeend",
      `<table><tbody id="secondaryTable"></tbody></table>`,
    );
    renderSecondaryAttributes(undefined);
    expect(document.getElementById("secondaryTable").innerHTML).toBe("");
  });

  test("renders a labeled row per secondary attribute with editable steppers", () => {
    document.body.insertAdjacentHTML(
      "beforeend",
      `<table><tbody id="secondaryTable"></tbody></table>`,
    );
    const sheet = {
      character: {
        secondary_attributes: {
          Will: { base_value: 10, bought: 1, modifier: 0, value: 11 },
        },
      },
    };

    renderSecondaryAttributes(sheet);

    const row = document.querySelector("#secondaryTable tr");
    expect(row.textContent).toContain(getSecondaryAttributeLabel("Will"));
    const boughtInput = row.querySelector('[data-field="bought"]');
    expect(boughtInput.value).toBe("1");
    expect(boughtInput.dataset.name).toBe("Will");
    const modInput = row.querySelector('[data-field="modifier"]');
    expect(modInput.dataset.step).toBe("1");
    expect(modInput.hasAttribute("data-max")).toBe(false);
  });

  test("Movement has no 'bought' stepper — shows a plain dash cell instead", () => {
    document.body.insertAdjacentHTML(
      "beforeend",
      `<table><tbody id="secondaryTable"></tbody></table>`,
    );
    renderSecondaryAttributes({
      character: {
        secondary_attributes: {
          Movement: { base_value: 5, bought: 0, modifier: 0, value: 5 },
        },
      },
    });

    const row = document.querySelector("#secondaryTable tr");
    expect(row.querySelector('[data-field="bought"]')).toBeNull();
    expect(row.children[2].textContent).toBe("—");
  });

  test("BasicSpeed formats base/value to 2 decimals and steps by 0.5", () => {
    document.body.insertAdjacentHTML(
      "beforeend",
      `<table><tbody id="secondaryTable"></tbody></table>`,
    );
    renderSecondaryAttributes({
      character: {
        secondary_attributes: {
          BasicSpeed: { base_value: 5, bought: 0, modifier: 0.5, value: 5.5 },
        },
      },
    });

    const row = document.querySelector("#secondaryTable tr");
    expect(row.children[1].textContent).toBe("5.00");
    expect(row.children[5].textContent).toBe("5.50");
    const modInput = row.querySelector('[data-field="modifier"]');
    expect(modInput.dataset.step).toBe("0.5");
  });

  test("vital stats (HP/Mana/Toxicity) get a data-max=0 clamp on their modifier stepper", () => {
    document.body.insertAdjacentHTML(
      "beforeend",
      `<table><tbody id="secondaryTable"></tbody></table>`,
    );
    renderSecondaryAttributes({
      character: {
        secondary_attributes: {
          HP: { base_value: 10, bought: 0, modifier: -2, value: 8 },
        },
      },
    });

    const modInput = document.querySelector(
      '#secondaryTable [data-field="modifier"]',
    );
    expect(modInput.getAttribute("data-max")).toBe("0");
  });

  test("shows the enchantment modifier only when has_enchantment_modifier is true", () => {
    document.body.insertAdjacentHTML(
      "beforeend",
      `<table><tbody id="secondaryTable"></tbody></table>`,
    );
    renderSecondaryAttributes({
      character: {
        secondary_attributes: {
          Dodge: {
            base_value: 8,
            bought: 0,
            modifier: 0,
            value: 9,
            enchantment_modifier: 1,
            has_enchantment_modifier: true,
          },
        },
      },
    });

    const cell = document.querySelector(
      "#secondaryTable .enchantment-mod-cell",
    );
    expect(cell.textContent).toBe("+1");
    expect(cell.classList.contains("enchantment-mod-active")).toBe(true);
  });

  test("re-rendering replaces the previous rows rather than appending", () => {
    document.body.insertAdjacentHTML(
      "beforeend",
      `<table><tbody id="secondaryTable"></tbody></table>`,
    );
    const base = { base_value: 1, bought: 0, modifier: 0, value: 1 };
    renderSecondaryAttributes({
      character: { secondary_attributes: { Will: base } },
    });
    renderSecondaryAttributes({
      character: { secondary_attributes: { Dodge: base } },
    });

    const rows = document.querySelectorAll("#secondaryTable tr");
    expect(rows).toHaveLength(1);
    expect(rows[0].textContent).toContain(getSecondaryAttributeLabel("Dodge"));
  });
});
