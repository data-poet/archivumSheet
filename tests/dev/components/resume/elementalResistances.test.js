import { renderResume } from "dev/public/js/components/resume.js";
import {
  t,
  getElementalResistanceLabel,
} from "dev/public/js/localization/pt-BR/index.js";
import { resetResumeDOM } from "tests/dev/helpers/resumeDomFixture.js";

function id(x) {
  return document.getElementById(x);
}

function entry(final, overrides = {}) {
  return {
    race_base: 1,
    modifier: 0,
    enchantment_modifier: 0,
    has_enchantment_modifier: false,
    final,
    ...overrides,
  };
}

beforeEach(() => {
  resetResumeDOM();
});

describe("renderResumeElementalResistances (view mode, read-only)", () => {
  test("hides the container when every element is at normal damage (final === 1)", () => {
    id("resume_elemental_resistances_container").hidden = false;
    renderResume({
      character: {
        elemental_resistances: {
          Fire: entry(1),
          Ice: entry(1),
        },
      },
    });
    expect(id("resume_elemental_resistances_container").hidden).toBe(true);
  });

  test("hides the container when there are no elemental_resistances at all", () => {
    id("resume_elemental_resistances_container").hidden = false;
    renderResume({ character: {} });
    expect(id("resume_elemental_resistances_container").hidden).toBe(true);
  });

  test("shows only the elements whose final value differs from normal damage", () => {
    renderResume({
      character: {
        elemental_resistances: {
          Fire: entry(0.5),
          Ice: entry(1), // normal — filtered out
          Arcane: entry(1.5),
        },
      },
    });

    const container = id("resume_elemental_resistances_container");
    expect(container.hidden).toBe(false);
    expect(container.textContent).toContain(t("resume.elementalResistances"));
    expect(container.textContent).toContain(
      t("attributes.finalDamageReceived"),
    );

    const rows = container.querySelectorAll("tbody tr");
    expect(rows).toHaveLength(2);
    expect(container.textContent).toContain(
      getElementalResistanceLabel("Fire"),
    );
    expect(container.textContent).toContain(
      getElementalResistanceLabel("Arcane"),
    );
    expect(container.textContent).not.toContain(
      getElementalResistanceLabel("Ice"),
    );
  });

  test("shows an element that became weaker than normal via a negative-flooring case", () => {
    renderResume({
      character: {
        elemental_resistances: { Fire: entry(0) },
      },
    });

    const cells = id("resume_elemental_resistances_container").querySelectorAll(
      "tbody td",
    );
    expect(cells[0].textContent).toBe(getElementalResistanceLabel("Fire"));
    expect(cells[1].textContent).toBe("0%"); // immune — displayed as a percentage now
  });

  test("displays double and half damage as 200% and 50%", () => {
    renderResume({
      character: {
        elemental_resistances: {
          Necrotic: entry(2), // double damage
          Ice: entry(0.5), // half damage
        },
      },
    });

    const container = id("resume_elemental_resistances_container");
    expect(container.textContent).toContain("200%");
    expect(container.textContent).toContain("50%");
  });

  test("renders the localized element label, not the raw engine key", () => {
    renderResume({
      character: {
        elemental_resistances: { Necrotic: entry(2) },
      },
    });

    const container = id("resume_elemental_resistances_container");
    expect(container.textContent).toContain("Necrótico");
    expect(container.textContent).not.toContain("Necrotic");
  });

  test("is read-only — no stepper/input elements in the rendered rows", () => {
    renderResume({
      character: {
        elemental_resistances: { Fire: entry(0.5) },
      },
    });

    const container = id("resume_elemental_resistances_container");
    expect(container.querySelector("input")).toBeNull();
  });
});
