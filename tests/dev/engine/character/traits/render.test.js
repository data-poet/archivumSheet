import {
  renderAdvantages,
  renderDisadvantages,
} from "dev/public/js/engine/character/traits/render.js";
import { t } from "dev/public/js/localization/pt-BR.js";
import { resetDOM } from "tests/dev/helpers/domFixture.js";

function advList() {
  return document.getElementById("advList");
}
function disList() {
  return document.getElementById("disList");
}

beforeEach(() => {
  resetDOM(`<div id="advList"></div><div id="disList"></div>`);
});

describe("renderAdvantages — empty state", () => {
  test("shows an empty row when there are no advantages at all", () => {
    renderAdvantages({ advantages: {} }, {}, undefined);
    expect(advList().querySelector("td[colspan]")).not.toBeNull();
  });
});

describe("renderAdvantages — a purely player-selected advantage (engine hasn't run yet)", () => {
  test("renders name/cost/type from the catalog row, plus a remove button", () => {
    const selected = { advantages: { "ADV-1": true } };
    const data = {
      advantages: [
        {
          advantage_id: "ADV-1",
          advantage_box_name: "Visão Aguçada",
          advantage_cost: 15,
          advantage_type: "Físico",
          advantage_source_book: "Básico",
          advantage_source_page: "35",
          advantage_description: "Enxerga longe.",
        },
      ],
    };

    renderAdvantages(selected, data, undefined);

    const row = advList().querySelector("tbody tr");
    expect(row.textContent).toContain("Visão Aguçada");
    expect(row.querySelector(".col-num").textContent).toBe("15");
    expect(row.textContent).toContain("Físico");
    expect(row.querySelector(".remove-adv")).not.toBeNull();
    expect(row.classList.contains("trait-innate")).toBe(false);
    expect(row.classList.contains("trait-enchantment")).toBe(false);
  });
});

describe("renderAdvantages — engine has run (sheet present)", () => {
  test("reads the advantage map from the sheet, not selected", () => {
    const selected = { advantages: { "ADV-STALE": true } };
    const data = { advantages: [] };
    const sheet = {
      character: {
        advantages: { "ADV-1": { name: "Do Sheet", is_race_innate: false } },
      },
    };

    renderAdvantages(selected, data, sheet);

    expect(advList().textContent).toContain("Do Sheet");
    expect(advList().textContent).not.toContain("ADV-STALE");
  });
});

describe("renderAdvantages — race-innate entries", () => {
  test("forces cost to 0, tags as innate, and omits the remove button", () => {
    const selected = {
      advantages: {
        "ADV-1": { is_race_innate: true, name: "Visão no Escuro" },
      },
    };
    const data = { advantages: [] };

    renderAdvantages(selected, data, undefined);

    const row = advList().querySelector("tbody tr");
    expect(row.classList.contains("trait-innate")).toBe(true);
    expect(row.textContent).toContain(t("character.innate"));
    expect(row.querySelector(".col-num").textContent).toBe("0");
    expect(row.querySelector(".remove-adv")).toBeNull();
  });
});

describe("renderAdvantages — item-enchantment-granted entries", () => {
  test("forces cost to 0, tags as enchanted, and omits the remove button", () => {
    const selected = {
      advantages: { "ADV-1": { is_enchantment: true, name: "Concedida" } },
    };
    const data = { advantages: [] };

    renderAdvantages(selected, data, undefined);

    const row = advList().querySelector("tbody tr");
    expect(row.classList.contains("trait-enchantment")).toBe(true);
    expect(row.textContent).toContain(t("character.enchanted"));
    expect(row.querySelector(".col-num").textContent).toBe("0");
    expect(row.querySelector(".remove-adv")).toBeNull();
  });
});

describe("renderAdvantages — name fallback", () => {
  test("falls back to the sheet entry's name, then the id, when the catalog row is missing", () => {
    renderAdvantages(
      { advantages: { "ADV-1": { name: "Nome do Sheet" } } },
      { advantages: [] },
      undefined,
    );
    expect(advList().querySelector("tbody tr td").textContent).toContain(
      "Nome do Sheet",
    );
  });

  test("falls back to the raw id when neither the catalog nor the sheet entry has a name", () => {
    renderAdvantages(
      { advantages: { "ADV-UNKNOWN": true } },
      { advantages: [] },
      undefined,
    );
    expect(advList().querySelector("tbody tr td").textContent).toContain(
      "ADV-UNKNOWN",
    );
  });
});

describe("renderAdvantages — detail row", () => {
  test("includes source book/page and a rich-text description", () => {
    const selected = { advantages: { "ADV-1": true } };
    const data = {
      advantages: [
        {
          advantage_id: "ADV-1",
          advantage_box_name: "Visão Aguçada",
          advantage_source_book: "Básico",
          advantage_source_page: "35",
          advantage_description: "Enxerga longe.",
        },
      ],
    };

    renderAdvantages(selected, data, undefined);

    expect(advList().textContent).toContain(t("traits.source"));
    expect(advList().textContent).toContain("Básico p.35");
    expect(advList().textContent).toContain(t("traits.description"));
    expect(advList().textContent).toContain("Enxerga longe.");
  });

  test("omits the source field when the catalog row has none", () => {
    renderAdvantages(
      { advantages: { "ADV-1": true } },
      { advantages: [{ advantage_id: "ADV-1", advantage_box_name: "x" }] },
      undefined,
    );
    expect(advList().textContent).not.toContain(t("traits.source"));
  });
});

// ── Disadvantages: same shape as advantages, mirror-tested for parity ──────

describe("renderDisadvantages — empty state", () => {
  test("shows an empty row when there are no disadvantages at all", () => {
    renderDisadvantages({ disadvantages: {} }, {}, undefined);
    expect(disList().querySelector("td[colspan]")).not.toBeNull();
  });
});

describe("renderDisadvantages — a purely player-selected disadvantage", () => {
  test("renders name/cost/type from the catalog row, plus a remove button", () => {
    const selected = { disadvantages: { "DIS-1": true } };
    const data = {
      disadvantages: [
        {
          disadvantage_id: "DIS-1",
          disadvantage_box_name: "Coxeadura",
          disadvantage_cost: -10,
          disadvantage_type: "Físico",
        },
      ],
    };

    renderDisadvantages(selected, data, undefined);

    const row = disList().querySelector("tbody tr");
    expect(row.textContent).toContain("Coxeadura");
    expect(row.querySelector(".col-num").textContent).toBe("-10");
    expect(row.querySelector(".remove-dis")).not.toBeNull();
  });
});

describe("renderDisadvantages — race-innate and enchantment-granted entries", () => {
  test("innate: forces cost to 0, tags as innate, omits the remove button", () => {
    renderDisadvantages(
      {
        disadvantages: {
          "DIS-1": { is_race_innate: true, name: "Vulnerabilidade" },
        },
      },
      { disadvantages: [] },
      undefined,
    );
    const row = disList().querySelector("tbody tr");
    expect(row.classList.contains("trait-innate")).toBe(true);
    expect(row.textContent).toContain(t("character.innate"));
    expect(row.querySelector(".col-num").textContent).toBe("0");
    expect(row.querySelector(".remove-dis")).toBeNull();
  });

  test("enchantment: forces cost to 0, tags as enchanted, omits the remove button", () => {
    renderDisadvantages(
      {
        disadvantages: { "DIS-1": { is_enchantment: true, name: "Maldição" } },
      },
      { disadvantages: [] },
      undefined,
    );
    const row = disList().querySelector("tbody tr");
    expect(row.classList.contains("trait-enchantment")).toBe(true);
    expect(row.textContent).toContain(t("character.enchanted"));
    expect(row.querySelector(".remove-dis")).toBeNull();
  });
});

describe("renderDisadvantages — engine has run (sheet present)", () => {
  test("reads the disadvantage map from the sheet, not selected", () => {
    const selected = { disadvantages: { "DIS-STALE": true } };
    const sheet = {
      character: { disadvantages: { "DIS-1": { name: "Do Sheet" } } },
    };

    renderDisadvantages(selected, { disadvantages: [] }, sheet);

    expect(disList().textContent).toContain("Do Sheet");
    expect(disList().textContent).not.toContain("DIS-STALE");
  });
});
