import { renderSkills } from "dev/public/js/engine/character/skills/render.js";
import { t } from "dev/public/js/localization/pt-BR/index.js";
import { resetDOM } from "tests/dev/helpers/domFixture.js";

function parse() {
  return document.getElementById("skillList");
}

beforeEach(() => {
  resetDOM(`<div id="skillList"></div>`);
});

describe("renderSkills — empty state", () => {
  test("shows an empty row when there are no skills at all", () => {
    renderSkills({ skills: {} }, {}, undefined);
    expect(parse().querySelector("td[colspan]")).not.toBeNull();
  });
});

describe("renderSkills — a purely player-selected skill (engine hasn't run yet)", () => {
  test("uses the local base+modifier estimate for the final value", () => {
    const selected = {
      skills: {
        "SK-1": { base_value: 12, modifier: 2, isTrainedWithMaster: false },
      },
    };
    const data = {
      skills: [
        {
          skill_id: "SK-1",
          skill_name: "Espada",
          skill_category: "Armas e Combate",
        },
      ],
    };

    renderSkills(selected, data, undefined);

    const row = parse().querySelector("tbody tr");
    expect(row.querySelector("td").textContent).toBe("Espada");
    expect(row.querySelector("td strong").textContent).toBe("14");
    expect(row.querySelector(".remove-skill")).not.toBeNull();
    expect(row.querySelector(".skill-input")).not.toBeNull();
  });
});

describe("renderSkills — engine has run (sheet present)", () => {
  test("reads the final value straight from the engine, not a local recompute", () => {
    const selected = {
      skills: {
        "SK-1": { base_value: 12, modifier: 2, isTrainedWithMaster: false },
      },
    };
    const data = { skills: [{ skill_id: "SK-1", skill_name: "Espada" }] };
    const sheet = {
      character: { skills: { "SK-1": { value: 99, is_enchantment: false } } },
    };

    renderSkills(selected, data, sheet);

    expect(parse().querySelector("td strong").textContent).toBe("99");
  });
});

describe("renderSkills — a purely engine-granted skill (item enchantment)", () => {
  test("renders read-only cells, no remove button, and the enchanted tag", () => {
    const selected = { skills: {} };
    const data = { skills: [] };
    const sheet = {
      character: {
        skills: {
          "SK-GRANT": {
            name: "Perícia Concedida",
            base_value: 10,
            modifier: 3,
            value: 13,
            is_enchantment: true,
          },
        },
      },
    };

    renderSkills(selected, data, sheet);

    const row = parse().querySelector("tbody tr");
    expect(row.classList.contains("trait-enchantment")).toBe(true);
    expect(row.textContent).toContain(t("character.enchanted"));
    expect(row.querySelector(".remove-skill")).toBeNull();
    expect(row.querySelector(".skill-input")).toBeNull();
    expect(row.querySelector("td strong").textContent).toBe("13");
  });

  test("falls back to the id itself when even the sheet has no name", () => {
    const sheet = {
      character: { skills: { "SK-UNKNOWN": { is_enchantment: true } } },
    };
    renderSkills({ skills: {} }, { skills: [] }, sheet);
    expect(parse().querySelector("tbody tr td").textContent).toContain(
      "SK-UNKNOWN",
    );
  });
});

describe("renderSkills — master-training eligibility", () => {
  test("shows the actions + master-checkbox detail items for an eligible, non-granted skill", () => {
    const selected = {
      skills: {
        "SK-1": { base_value: 12, modifier: 0, isTrainedWithMaster: true },
      },
    };
    const data = {
      skills: [{ skill_id: "SK-1", skill_category: "Armas e Combate" }],
    };
    const sheet = { character: { skills: { "SK-1": { actions: 2 } } } };

    renderSkills(selected, data, sheet);

    const checkbox = parse().querySelector(".skill-master-checkbox");
    expect(checkbox).not.toBeNull();
    expect(checkbox.checked).toBe(true);
    expect(parse().textContent).toContain(t("traits.actions"));
  });

  test("omits actions/master-checkbox for a non-eligible category", () => {
    const selected = { skills: { "SK-2": { base_value: 10, modifier: 0 } } };
    const data = { skills: [{ skill_id: "SK-2", skill_category: "Sociais" }] };

    renderSkills(selected, data, undefined);

    expect(parse().querySelector(".skill-master-checkbox")).toBeNull();
  });

  test("omits actions/master-checkbox for an eligible category if the skill is engine-granted", () => {
    const sheet = {
      character: {
        skills: {
          "SK-GRANT": { is_enchantment: true, value: 10 },
        },
      },
    };
    const data = {
      skills: [{ skill_id: "SK-GRANT", skill_category: "Armas e Combate" }],
    };

    renderSkills({ skills: {} }, data, sheet);

    expect(parse().querySelector(".skill-master-checkbox")).toBeNull();
  });
});

describe("renderSkills — enchantment modifier display", () => {
  test("shows a '+' prefix for a positive enchantment modifier and marks the cell active", () => {
    const selected = { skills: { "SK-1": { base_value: 10, modifier: 0 } } };
    const sheet = {
      character: {
        skills: {
          "SK-1": { has_enchantment_modifier: true, enchantment_modifier: 2 },
        },
      },
    };

    renderSkills(selected, { skills: [] }, sheet);

    const cell = parse().querySelector(".enchantment-mod-cell");
    expect(cell.textContent).toBe("+2");
    expect(cell.classList.contains("enchantment-mod-active")).toBe(true);
  });

  test("shows the raw (already-signed) value for a negative modifier", () => {
    const selected = { skills: { "SK-1": { base_value: 10, modifier: 0 } } };
    const sheet = {
      character: {
        skills: {
          "SK-1": { has_enchantment_modifier: true, enchantment_modifier: -2 },
        },
      },
    };
    renderSkills(selected, { skills: [] }, sheet);
    expect(parse().querySelector(".enchantment-mod-cell").textContent).toBe(
      "-2",
    );
  });

  test("shows '—' and no active class when there's no enchantment modifier", () => {
    const selected = { skills: { "SK-1": { base_value: 10, modifier: 0 } } };
    renderSkills(selected, { skills: [] }, undefined);
    const cell = parse().querySelector(".enchantment-mod-cell");
    expect(cell.textContent).toBe("—");
    expect(cell.classList.contains("enchantment-mod-active")).toBe(false);
  });
});

describe("renderSkills — parry detail", () => {
  test("includes a parry detail item when present", () => {
    const selected = { skills: { "SK-1": { base_value: 10, modifier: 0 } } };
    const sheet = { character: { skills: { "SK-1": { parry: 9 } } } };
    renderSkills(selected, { skills: [] }, sheet);
    expect(parse().textContent).toContain(t("traits.parry"));
  });

  test("omits the parry detail item when absent", () => {
    const selected = { skills: { "SK-1": { base_value: 10, modifier: 0 } } };
    renderSkills(selected, { skills: [] }, undefined);
    expect(parse().textContent).not.toContain(t("traits.parry"));
  });
});
