import { renderResume } from "dev/public/js/components/resume/index.js";
import { t } from "dev/public/js/localization/pt-BR/index.js";
import { resetResumeDOM } from "tests/dev/helpers/resumeDomFixture.js";

function id(x) {
  return document.getElementById(x);
}

beforeEach(() => {
  resetResumeDOM();
});

describe("renderResumeTraits — advantages", () => {
  test("lists each advantage's name as a row and shows the container", () => {
    renderResume({
      character: {
        advantages: {
          "ADV-1": { name: "Visão Aguçada" },
          "ADV-2": { name: "Vontade de Ferro" },
        },
      },
    });

    const container = id("resume_advantages_container");
    expect(container.hidden).toBe(false);
    expect(container.textContent).toContain(t("resume.advantages"));
    const rows = container.querySelectorAll("tbody tr");
    expect(rows).toHaveLength(2);
    expect(rows[0].textContent).toBe("Visão Aguçada");
  });

  test("hides the container when there are no advantages", () => {
    id("resume_advantages_container").hidden = false;
    renderResume({ character: { advantages: {} } });
    expect(id("resume_advantages_container").hidden).toBe(true);
  });

  test("falls back to an em-dash for an entry with no name", () => {
    renderResume({ character: { advantages: { "ADV-1": {} } } });
    expect(
      id("resume_advantages_container").querySelector("tbody tr").textContent,
    ).toBe("—");
  });
});

describe("renderResumeTraits — disadvantages", () => {
  test("lists each disadvantage's name in its own container, independent of advantages", () => {
    renderResume({
      character: {
        advantages: { "ADV-1": { name: "Vantagem" } },
        disadvantages: { "DIS-1": { name: "Coxeadura" } },
      },
    });

    expect(
      id("resume_disadvantages_container").querySelector("tbody tr")
        .textContent,
    ).toBe("Coxeadura");
    expect(id("resume_disadvantages_container").textContent).toContain(
      t("resume.disadvantages"),
    );
    expect(id("resume_advantages_container").hidden).toBe(false);
  });

  test("hides the container when there are no disadvantages, even if advantages exist", () => {
    renderResume({
      character: {
        advantages: { "ADV-1": { name: "Vantagem" } },
        disadvantages: {},
      },
    });
    expect(id("resume_disadvantages_container").hidden).toBe(true);
    expect(id("resume_advantages_container").hidden).toBe(false);
  });
});

describe("renderResumeSkills", () => {
  test("renders a row per skill with value/parry/actions, and shows the container", () => {
    renderResume({
      character: {
        skills: {
          "SK-1": {
            name: "Espadas",
            value: 14,
            critical: { success: 4, failure: 17 },
            parry: 10,
            actions: "1 ação",
          },
        },
      },
    });

    const container = id("resume_skills_container");
    expect(container.hidden).toBe(false);
    expect(container.textContent).toContain(t("resume.skills"));
    const row = container.querySelector("tbody tr");
    const cells = row.querySelectorAll("td");
    expect(cells[0].textContent).toBe("Espadas");
    expect(cells[1].textContent).toBe("14");
    expect(cells[2].textContent).toBe("≤4 · ≥17");
    expect(cells[3].textContent).toBe("10");
    expect(cells[4].textContent).toBe("1 ação");
    expect(container.querySelector("thead").textContent).toContain(
      t("traits.critical"),
    );
  });

  test("shows an em-dash for missing name/value/actions, but allows parry of 0 through", () => {
    renderResume({
      character: { skills: { "SK-1": { parry: 0 } } },
    });
    const cells = id("resume_skills_container").querySelectorAll("tbody td");
    expect(cells[0].textContent).toBe("—");
    expect(cells[1].textContent).toBe("—");
    expect(cells[2].textContent).toBe("—");
    expect(cells[3].textContent).toBe("0"); // 0 is a real value, not "missing"
    expect(cells[4].textContent).toBe("—");
  });

  test("hides the container when there are no skills", () => {
    id("resume_skills_container").hidden = false;
    renderResume({ character: { skills: {} } });
    expect(id("resume_skills_container").hidden).toBe(true);
  });
});

describe("renderResumeSkills — hides skills already shown via gear", () => {
  function names(container) {
    return Array.from(
      container.querySelectorAll("tbody tr td:first-child"),
      (td) => td.textContent,
    );
  }

  test("hides a skill used by an equipped melee weapon's skill check", () => {
    renderResume({
      character: {
        skills: {
          "SK-SWORD": { name: "Espadas Longas" },
          "SK-OTHER": { name: "Furtividade" },
        },
      },
      inventory: {
        melee: {
          equipped: [
            { weapon_name: "Espada", skill_check: { skill_id: "SK-SWORD" } },
          ],
        },
      },
    });
    expect(names(id("resume_skills_container"))).toEqual(["Furtividade"]);
  });

  test("hides a skill used by ranged, firearms or the equipped shield", () => {
    renderResume({
      character: {
        skills: {
          "SK-BOW": { name: "Arco" },
          "SK-GUN": { name: "Armas de Pólvora" },
          "SK-SHIELD": { name: "Escudo" },
        },
      },
      inventory: {
        ranged: { equipped: [{ skill_check: { skill_id: "SK-BOW" } }] },
        firearms: { equipped: [{ skill_check: { skill_id: "SK-GUN" } }] },
        shield: { equipped: { skill_check: { skill_id: "SK-SHIELD" } } },
      },
    });
    expect(id("resume_skills_container").hidden).toBe(true);
  });

  test("hides a skill shown as an unarmed row", () => {
    renderResume({
      character: {
        skills: { "SK-KARATE": { name: "Caratê" } },
        unarmed: [{ skill_id: "SK-KARATE", name: "Caratê" }],
      },
    });
    expect(id("resume_skills_container").hidden).toBe(true);
  });

  test("keeps a combat skill visible when no equipped gear or unarmed row uses it", () => {
    renderResume({
      character: {
        skills: { "SK-JUDO": { name: "Judô" } },
        unarmed: [{ skill_id: null, name: null }],
      },
      inventory: { melee: { equipped: [] } },
    });
    expect(names(id("resume_skills_container"))).toEqual(["Judô"]);
  });

  test("tolerates a weapon or shield with no skill_check at all", () => {
    renderResume({
      character: { skills: { "SK-1": { name: "Perícia" } } },
      inventory: {
        melee: { equipped: [{ weapon_name: "Sem perícia" }] },
        shield: { equipped: { shield_name: "Sem perícia" } },
      },
    });
    expect(names(id("resume_skills_container"))).toEqual(["Perícia"]);
  });
});

describe("renderResumeMagic", () => {
  test("renders a row per grimoire spell, resolving cost from the catalog by spell_id", () => {
    renderResume(
      {
        grimoire: {
          "SPELL-1": {
            name: "Bola de Fogo",
            value: 15,
            critical: { success: 5, failure: 17 },
          },
        },
      },
      { spells: [{ spell_id: "SPELL-1", spell_cost: "3" }] },
    );

    const container = id("resume_magic_container");
    expect(container.hidden).toBe(false);
    expect(container.textContent).toContain(t("resume.spells"));
    const cells = container.querySelectorAll("tbody td");
    expect(cells[0].textContent).toBe("Bola de Fogo");
    expect(cells[1].textContent).toBe("3");
    expect(cells[2].textContent).toBe("15");
    expect(cells[3].textContent).toBe("≤5 · ≥17");
  });

  test("shows an em-dash cost when the spell isn't found in the catalog", () => {
    renderResume(
      { grimoire: { "SPELL-1": { name: "Bola de Fogo", value: 15 } } },
      { spells: [] },
    );
    const cells = id("resume_magic_container").querySelectorAll("tbody td");
    expect(cells[1].textContent).toBe("—");
  });

  test("treats a missing data.spells catalog the same as an empty one", () => {
    renderResume({ grimoire: { "SPELL-1": { name: "x", value: 1 } } }, {});
    expect(
      id("resume_magic_container").querySelector("tbody td:nth-child(2)")
        .textContent,
    ).toBe("—");
  });

  test("hides the container when the grimoire is empty", () => {
    id("resume_magic_container").hidden = false;
    renderResume({ grimoire: {} }, { spells: [] });
    expect(id("resume_magic_container").hidden).toBe(true);
  });
});
