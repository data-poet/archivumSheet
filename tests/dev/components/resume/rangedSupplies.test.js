import { renderResume } from "dev/public/js/components/resume.js";
import { t } from "dev/public/js/localization/pt-BR/index.js";
import { resetResumeDOM } from "tests/dev/helpers/resumeDomFixture.js";

function id(x) {
  return document.getElementById(x);
}

beforeEach(() => {
  resetResumeDOM();
});

describe("renderResumeFirearms", () => {
  test("hides the container when nothing is equipped", () => {
    id("resume_firearms_container").hidden = false;
    renderResume({ inventory: { firearms: { equipped: [] } } });
    expect(id("resume_firearms_container").hidden).toBe(true);
  });

  test("shows TR/PREC/GDP damage, an HP stepper, and a rounds-loaded stepper", () => {
    renderResume({
      inventory: {
        firearms: {
          equipped: [
            {
              weapon_name: "Pistola",
              weapon_final_tr: "2d",
              weapon_final_prec: 1,
              weapon_gdp_damage: "2d+1",
              weapon_final_hit_points: 8,
              hit_points_modifier: -1,
              weapon_final_magazine_size: 12,
              rounds_loaded: 9,
              _instanceId: "inst-1",
            },
          ],
        },
      },
    });

    const container = id("resume_firearms_container");
    expect(container.hidden).toBe(false);
    const cells = container.querySelectorAll("tbody td");
    expect(cells[0].textContent).toBe("Pistola");
    expect(cells[1].textContent).toBe("2d");
    expect(cells[2].textContent).toBe("1");
    expect(cells[3].textContent).toBe("2d+1");

    const hpInput = container.querySelector(".resume-firearm-hp");
    expect(hpInput.value).toBe("-1");
    expect(hpInput.dataset.instanceId).toBe("inst-1");
    expect(container.textContent).toContain("7/8");

    const roundsInput = container.querySelector(".resume-firearm-rounds");
    expect(roundsInput.value).toBe("9");
    expect(roundsInput.getAttribute("data-max")).toBe("12");
    expect(roundsInput.getAttribute("data-min")).toBe("0");
    expect(container.querySelector(".resume-reload-firearm")).not.toBeNull();
  });

  test("omits the HP stepper (but always keeps a rounds stepper) when there's no max HP", () => {
    renderResume({
      inventory: {
        firearms: {
          equipped: [{ weapon_name: "Pistola", weapon_final_magazine_size: 6 }],
        },
      },
    });
    const container = id("resume_firearms_container");
    expect(container.querySelector(".resume-firearm-hp")).toBeNull();
    // Unlike the HP stepper, _roundsStepperCell is called unconditionally.
    const roundsInput = container.querySelector(".resume-firearm-rounds");
    expect(roundsInput).not.toBeNull();
    expect(roundsInput.value).toBe("0"); // rounds_loaded defaults to 0
  });

  test("defaults magazine size to 0 when the resolver hasn't provided one", () => {
    renderResume({
      inventory: { firearms: { equipped: [{ weapon_name: "x" }] } },
    });
    const roundsInput = id("resume_firearms_container").querySelector(
      ".resume-firearm-rounds",
    );
    expect(roundsInput.getAttribute("data-max")).toBe("0");
  });
});

describe("renderResumeAmmo", () => {
  test("aggregates equipped-container quantities per ammo_id, resolving names from data.ammo", () => {
    renderResume(
      {
        inventory: {
          ammo: {
            containers: {
              equipped: [
                { contents: [{ ammo_id: "AMMO-1", quantity: 10 }] },
                { contents: [{ ammo_id: "AMMO-1", quantity: 5 }] },
              ],
            },
          },
        },
      },
      { ammo: [{ ammo_id: "AMMO-1", ammo_name: "Flecha" }] },
    );

    const container = id("resume_ammo_container");
    expect(container.hidden).toBe(false);
    expect(container.textContent).toContain(t("sections.munition"));
    const rows = container.querySelectorAll("tbody tr");
    expect(rows).toHaveLength(1);
    expect(rows[0].textContent).toContain("Flecha");
    const qtyInput = rows[0].querySelector(".resume-ammo-qty");
    expect(qtyInput.value).toBe("15");
  });

  test("falls back to the raw ammo_id as the display name when the catalog has no match", () => {
    renderResume(
      {
        inventory: {
          ammo: {
            containers: {
              equipped: [{ contents: [{ ammo_id: "AMMO-X", quantity: 1 }] }],
            },
          },
        },
      },
      { ammo: [] },
    );
    expect(
      id("resume_ammo_container").querySelector("tbody").textContent,
    ).toContain("AMMO-X");
  });

  test("uses the first SELECTED equipped container holding that ammo_id as the stepper's instance target", () => {
    renderResume(
      {
        inventory: {
          ammo: {
            containers: {
              equipped: [{ contents: [{ ammo_id: "AMMO-1", quantity: 5 }] }],
            },
          },
        },
      },
      { ammo: [] },
      {
        ammo_containers: [
          {
            storedAt: "stash",
            _instanceId: "wrong-scope",
            contents: [{ ammo_id: "AMMO-1" }],
          },
          {
            storedAt: "equipped",
            _instanceId: "right-one",
            contents: [{ ammo_id: "AMMO-1" }],
          },
        ],
      },
    );

    const qtyInput = id("resume_ammo_container").querySelector(
      ".resume-ammo-qty",
    );
    expect(qtyInput.dataset.instanceId).toBe("right-one");
  });

  test("leaves instanceId blank when no matching selected container is found", () => {
    renderResume(
      {
        inventory: {
          ammo: {
            containers: {
              equipped: [{ contents: [{ ammo_id: "AMMO-1", quantity: 1 }] }],
            },
          },
        },
      },
      { ammo: [] },
      { ammo_containers: [] },
    );
    const qtyInput = id("resume_ammo_container").querySelector(
      ".resume-ammo-qty",
    );
    expect(qtyInput.dataset.instanceId).toBe("");
  });

  test("hides the container when there are no equipped ammo containers at all", () => {
    id("resume_ammo_container").hidden = false;
    renderResume(
      { inventory: { ammo: { containers: { equipped: [] } } } },
      { ammo: [] },
    );
    expect(id("resume_ammo_container").hidden).toBe(true);
  });

  test("hides the container when equipped containers exist but are all empty", () => {
    renderResume(
      { inventory: { ammo: { containers: { equipped: [{ contents: [] }] } } } },
      { ammo: [] },
    );
    expect(id("resume_ammo_container").hidden).toBe(true);
  });
});

describe("renderResumeAlchemy", () => {
  test("hides the container when the backpack is empty", () => {
    id("resume_alchemy_container").hidden = false;
    renderResume({ inventory: { alchemy: { backpack: [] } } });
    expect(id("resume_alchemy_container").hidden).toBe(true);
  });

  test("renders name/tier/quantity per backpack item", () => {
    renderResume({
      inventory: {
        alchemy: {
          backpack: [
            {
              consumable_id: "POT-1",
              consumable_name: "Poção de Cura",
              consumable_tier: 2,
              quantity: 3,
              storedAt: "backpack",
            },
          ],
        },
      },
    });

    const container = id("resume_alchemy_container");
    expect(container.hidden).toBe(false);
    expect(container.textContent).toContain(t("alchemy.title"));
    const cells = container.querySelectorAll("tbody td");
    expect(cells[0].textContent).toBe("Poção de Cura");
    expect(cells[1].textContent).toBe("2");
    const qtyInput = container.querySelector(".alchemy-qty");
    expect(qtyInput.value).toBe("3");
    expect(qtyInput.dataset.consumableId).toBe("POT-1");
    expect(qtyInput.dataset.storedAt).toBe("backpack");
  });

  test("defaults quantity to 1 when the entry has none", () => {
    renderResume({
      inventory: { alchemy: { backpack: [{ consumable_id: "POT-1" }] } },
    });
    expect(
      id("resume_alchemy_container").querySelector(".alchemy-qty").value,
    ).toBe("1");
  });
});
