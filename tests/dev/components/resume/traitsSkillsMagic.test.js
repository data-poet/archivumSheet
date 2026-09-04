import { renderResume } from "dev/public/js/components/resume.js";
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
          "SK-1": { name: "Espadas", value: 14, parry: 10, actions: "1 ação" },
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
    expect(cells[2].textContent).toBe("10");
    expect(cells[3].textContent).toBe("1 ação");
  });

  test("shows an em-dash for missing name/value/actions, but allows parry of 0 through", () => {
    renderResume({
      character: { skills: { "SK-1": { parry: 0 } } },
    });
    const cells = id("resume_skills_container").querySelectorAll("tbody td");
    expect(cells[0].textContent).toBe("—");
    expect(cells[1].textContent).toBe("—");
    expect(cells[2].textContent).toBe("0"); // 0 is a real value, not "missing"
    expect(cells[3].textContent).toBe("—");
  });

  test("hides the container when there are no skills", () => {
    id("resume_skills_container").hidden = false;
    renderResume({ character: { skills: {} } });
    expect(id("resume_skills_container").hidden).toBe(true);
  });
});

describe("renderResumeMagic", () => {
  test("renders a row per grimoire spell, resolving cost from the catalog by spell_id", () => {
    renderResume(
      { grimoire: { "SPELL-1": { name: "Bola de Fogo", value: 15 } } },
      { spells: [{ spell_id: "SPELL-1", spell_cost: "3" }] },
    );

    const container = id("resume_magic_container");
    expect(container.hidden).toBe(false);
    expect(container.textContent).toContain(t("resume.spells"));
    const cells = container.querySelectorAll("tbody td");
    expect(cells[0].textContent).toBe("Bola de Fogo");
    expect(cells[1].textContent).toBe("3");
    expect(cells[2].textContent).toBe("15");
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
