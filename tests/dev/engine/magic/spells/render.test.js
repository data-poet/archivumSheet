import { renderSpells } from "dev/public/js/engine/magic/spells/render.js";
import { t } from "dev/public/js/localization/pt-BR.js";
import { resetDOM } from "tests/dev/helpers/domFixture.js";

function spellList() {
  return document.getElementById("spellList");
}

beforeEach(() => {
  resetDOM(`<div id="spellList"></div>`);
});

describe("renderSpells — empty state", () => {
  test("shows a single empty row (no aptitude column, sheet absent) when there are no spells", () => {
    renderSpells({ spells: {} }, { spells: [] }, undefined);
    const row = spellList().querySelector(".empty-row");
    expect(row).not.toBeNull();
    expect(row.querySelector("td").getAttribute("colspan")).toBe("9"); // 8 cols + detail col
  });
});

describe("renderSpells — a purely player-selected spell (engine hasn't run yet)", () => {
  const data = {
    spells: [
      {
        spell_name: "bola-de-fogo",
        spell_box_name: "Bola de Fogo",
        spell_school: "Fogo",
        spell_tier: "Aprendiz",
        spell_difficulty: "Difícil",
        spell_type: "Ataque",
        spell_cost: "3",
        spell_cast_time: "1 turno",
        spell_target_type: "Único",
        spell_range: "10m",
        spell_effect_area: "—",
        spell_duration: "Instantâneo",
      },
    ],
  };

  test("renders editable base/mod steppers, a remove button, and a locally-estimated tier/final", () => {
    const selected = {
      spells: { "bola-de-fogo": { base_value: 10, modifier: 2 } },
    };

    renderSpells(selected, data, undefined);

    const row = spellList().querySelector("tbody tr");
    expect(row.textContent).toContain("bola-de-fogo"); // name cell uses the raw key, not box_name
    const baseInput = row.querySelector('input[data-field="base_value"]');
    const modInput = row.querySelector('input[data-field="modifier"]');
    expect(baseInput.value).toBe("10");
    expect(baseInput.classList.contains("spell-input")).toBe(true);
    expect(modInput.value).toBe("2");
    expect(row.querySelector(".remove-spell")).not.toBeNull();
    expect(row.classList.contains("trait-enchantment")).toBe(false);
    // final = base(10) + mod(2) + aptitude(0) = 12 → tier "Aprendiz" (<=12)
    expect(row.textContent).toContain("12");
    expect(row.querySelector("td:nth-child(4)").textContent).toBe("Aprendiz");
  });

  test("does not show the aptitude column when the sheet grants no Magic Aptitude advantage", () => {
    const selected = {
      spells: { "bola-de-fogo": { base_value: 10, modifier: 0 } },
    };
    renderSpells(selected, data, { character: { advantages: {} } });
    expect(spellList().textContent).not.toContain(t("traits.aptitude"));
  });

  test("shows the aptitude column and value when the sheet grants Magic Aptitude", () => {
    const selected = {
      spells: { "bola-de-fogo": { base_value: 10, modifier: 0 } },
    };
    const sheet = {
      character: { advantages: { "ADV-064": true } },
      grimoire: {
        "SPELL-1": {
          name: "bola-de-fogo",
          aptitude_level: 4,
          base_value: 10,
          modifier: 0,
        },
      },
    };

    renderSpells(selected, data, sheet);

    expect(spellList().textContent).toContain(t("traits.aptitude"));
    const row = spellList().querySelector("tbody tr");
    // 9 cols now: name/school/diff/tier/base/mod/aptitude/enchantment/final
    const cells = row.querySelectorAll("td");
    expect(cells).toHaveLength(9 + 1); // +1 for the action column
  });
});

describe("renderSpells — an item-granted (pure enchantment) spell", () => {
  test("is included even though it's absent from selected.spells, with plain cells and no remove button", () => {
    const data = { spells: [] };
    const selected = { spells: {} };
    const sheet = {
      character: { advantages: {} },
      grimoire: {
        "SPELL-1": {
          name: "bola-de-fogo",
          is_enchantment: true,
          base_value: 14,
          modifier: 1,
          value: 15,
          tier: "Experiente",
        },
      },
    };

    renderSpells(selected, data, sheet);

    const row = spellList().querySelector("tbody tr");
    expect(row.classList.contains("trait-enchantment")).toBe(true);
    expect(row.textContent).toContain(t("character.enchanted"));
    expect(row.querySelector(".remove-spell")).toBeNull();
    expect(row.querySelector("input.spell-input")).toBeNull(); // no editable steppers
    expect(row.textContent).toContain("15"); // engine's final value, used as-is
    expect(row.querySelector("td:nth-child(4)").textContent).toBe("Experiente"); // engine's tier, used as-is
  });
});

describe("renderSpells — engine (grimoire) values take precedence once the engine has run", () => {
  test("uses the grimoire's final value/tier rather than recomputing them locally", () => {
    const selected = {
      spells: { "bola-de-fogo": { base_value: 10, modifier: 0 } },
    };
    const sheet = {
      character: { advantages: {} },
      grimoire: {
        "SPELL-1": {
          name: "bola-de-fogo",
          base_value: 10,
          modifier: 0,
          value: 99, // deliberately inconsistent with base+mod, to prove it's not recomputed
          tier: "Mestre",
        },
      },
    };

    renderSpells(selected, { spells: [] }, sheet);

    const row = spellList().querySelector("tbody tr");
    expect(row.textContent).toContain("99");
    expect(row.querySelector("td:nth-child(4)").textContent).toBe("Mestre");
  });
});

describe("renderSpells — enchantment modifier display", () => {
  const baseSelected = {
    spells: { "bola-de-fogo": { base_value: 10, modifier: 0 } },
  };

  test("shows a '+' prefixed positive enchantment modifier and highlights the cell", () => {
    const sheet = {
      character: { advantages: {} },
      grimoire: {
        "SPELL-1": {
          name: "bola-de-fogo",
          has_enchantment_modifier: true,
          enchantment_modifier: 3,
        },
      },
    };
    renderSpells(baseSelected, { spells: [] }, sheet);
    const cell = spellList().querySelector(".enchantment-mod-cell");
    expect(cell.textContent).toBe("+3");
    expect(cell.classList.contains("enchantment-mod-active")).toBe(true);
  });

  test("shows a negative enchantment modifier without an extra sign", () => {
    const sheet = {
      character: { advantages: {} },
      grimoire: {
        "SPELL-1": {
          name: "bola-de-fogo",
          has_enchantment_modifier: true,
          enchantment_modifier: -2,
        },
      },
    };
    renderSpells(baseSelected, { spells: [] }, sheet);
    const cell = spellList().querySelector(".enchantment-mod-cell");
    expect(cell.textContent).toBe("-2");
  });

  test("shows an em-dash and no highlight when there is no enchantment modifier at all", () => {
    renderSpells(baseSelected, { spells: [] }, undefined);
    const cell = spellList().querySelector(".enchantment-mod-cell");
    expect(cell.textContent).toBe("—");
    expect(cell.classList.contains("enchantment-mod-active")).toBe(false);
  });
});

describe("renderSpells — catalog lookup by name+tier, falling back to name only", () => {
  test("prefers the row matching both spell_name and the resolved tier", () => {
    const data = {
      spells: [
        {
          spell_name: "bola-de-fogo",
          spell_tier: "Aprendiz",
          spell_school: "Errado",
        },
        {
          spell_name: "bola-de-fogo",
          spell_tier: "Veterano",
          spell_school: "Fogo",
        },
      ],
    };
    const selected = {
      spells: { "bola-de-fogo": { base_value: 16, modifier: 0 } }, // final 16 → tier "Veterano"
    };

    renderSpells(selected, data, undefined);

    expect(spellList().textContent).toContain("Fogo");
    expect(spellList().textContent).not.toContain("Errado");
  });

  test("falls back to matching by name alone when no row matches the resolved tier", () => {
    const data = {
      spells: [
        {
          spell_name: "bola-de-fogo",
          spell_tier: "Mestre",
          spell_school: "Fogo",
        },
      ],
    };
    const selected = {
      spells: { "bola-de-fogo": { base_value: 10, modifier: 0 } }, // final 10 → tier "Aprendiz", no exact match
    };

    renderSpells(selected, data, undefined);

    expect(spellList().textContent).toContain("Fogo");
  });

  test("shows placeholder dashes for every catalog field when no catalog row matches at all", () => {
    const selected = {
      spells: { "spell-desconhecido": { base_value: 10, modifier: 0 } },
    };

    renderSpells(selected, { spells: [] }, undefined);

    const row = spellList().querySelector("tbody tr");
    expect(row.children[1].textContent).toBe("—"); // school
    expect(row.children[2].textContent).toBe("—"); // difficulty
  });
});

describe("renderSpells — detail row", () => {
  test("includes non-empty fields and omits scaling/description/observation when absent", () => {
    const data = {
      spells: [
        {
          spell_name: "bola-de-fogo",
          spell_type: "Ataque",
          spell_cost: "3",
          spell_cast_time: "1 turno",
          spell_target_type: "Único",
          spell_range: "10m",
          spell_effect_area: "—",
          spell_duration: "Instantâneo",
        },
      ],
    };
    const selected = {
      spells: { "bola-de-fogo": { base_value: 10, modifier: 0 } },
    };

    renderSpells(selected, data, undefined);

    expect(spellList().textContent).toContain(t("traits.spellType"));
    expect(spellList().textContent).toContain("Ataque");
    expect(spellList().textContent).toContain(t("traits.cast"));
    expect(spellList().textContent).toContain("1 turno");
    expect(spellList().textContent).not.toContain(t("traits.description"));
  });

  test("renders a rich-text description block when present", () => {
    const data = {
      spells: [
        {
          spell_name: "bola-de-fogo",
          spell_description: "Causa dano de fogo.",
        },
      ],
    };
    const selected = {
      spells: { "bola-de-fogo": { base_value: 10, modifier: 0 } },
    };

    renderSpells(selected, data, undefined);

    expect(spellList().textContent).toContain(t("traits.description"));
    expect(spellList().textContent).toContain("Causa dano de fogo.");
  });
});
