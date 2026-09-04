import { renderResume } from "dev/public/js/components/resume.js";
import { t } from "dev/public/js/localization/pt-BR/index.js";
import { resetResumeDOM } from "tests/dev/helpers/resumeDomFixture.js";

function id(x) {
  return document.getElementById(x);
}

beforeEach(() => {
  resetResumeDOM();
});

describe("renderResumeArmor", () => {
  test("shows one row per armor slot, with a dash row for an unequipped slot", () => {
    renderResume({
      inventory: {
        armor: {
          equipped: {
            torso: {
              final_damage_resistance: 4,
              armor_final_hit_points: 20,
            },
          },
        },
      },
    });

    const container = id("resume_armor_container");
    expect(container.hidden).toBe(false);
    const rows = container.querySelectorAll("tbody tr");
    expect(rows).toHaveLength(6); // all 6 ARMOR_SLOTS, equipped or not

    const torsoRow = Array.from(rows).find((r) =>
      r.textContent.includes("Tronco"),
    );
    expect(torsoRow.querySelectorAll("td")[1].textContent).toBe("4");

    const headRow = Array.from(rows).find((r) =>
      r.textContent.includes("Cabeça"),
    );
    expect(headRow.querySelectorAll("td")[1].textContent).toBe("—");
  });

  test("hides the container when nothing is equipped in any slot", () => {
    id("resume_armor_container").hidden = false;
    renderResume({ inventory: { armor: { equipped: {} } } });
    expect(id("resume_armor_container").hidden).toBe(true);
  });

  test("renders an HP stepper only when the piece has a positive max HP", () => {
    renderResume({
      inventory: {
        armor: {
          equipped: {
            torso: {
              armor_final_hit_points: 10,
              hit_points_modifier: -2,
            },
          },
        },
      },
    });
    const torsoRow = Array.from(
      id("resume_armor_container").querySelectorAll("tbody tr"),
    ).find((r) => r.textContent.includes("Tronco"));
    const input = torsoRow.querySelector(".resume-armor-hp");
    expect(input.value).toBe("-2");
    expect(torsoRow.textContent).toContain("8/10"); // actualHp = 10-2, maxHp = 10
  });

  test("omits the HP stepper when the piece has no hit points (e.g. cloth)", () => {
    renderResume({
      inventory: {
        armor: { equipped: { torso: { final_damage_resistance: 1 } } },
      },
    });
    const torsoRow = Array.from(
      id("resume_armor_container").querySelectorAll("tbody tr"),
    ).find((r) => r.textContent.includes("Tronco"));
    expect(torsoRow.querySelector(".resume-armor-hp")).toBeNull();
  });
});

describe("renderResumeShield", () => {
  test("hides the container when nothing is equipped", () => {
    id("resume_shield_container").hidden = false;
    renderResume({ inventory: { shield: {} } });
    expect(id("resume_shield_container").hidden).toBe(true);
  });

  test("shows name/dr/block and an HP stepper when equipped with hit points", () => {
    renderResume({
      inventory: {
        shield: {
          equipped: {
            shield_name: "Broquel",
            final_damage_resistance: 2,
            block: 8,
            shield_final_hit_points: 15,
            hit_points_modifier: 0,
          },
        },
      },
    });

    const container = id("resume_shield_container");
    expect(container.hidden).toBe(false);
    expect(container.textContent).toContain("Broquel");
    const cells = container.querySelectorAll("tbody td");
    expect(cells[1].textContent).toBe("2"); // dr
    expect(cells[2].textContent).toBe("8"); // block
    expect(container.querySelector(".resume-shield-hp")).not.toBeNull();
  });

  test("omits the HP stepper and shows dashes when the shield has no HP/DR/block data", () => {
    renderResume({ inventory: { shield: { equipped: {} } } });
    const container = id("resume_shield_container");
    const cells = container.querySelectorAll("tbody td");
    expect(cells[0].textContent).toBe("—"); // name
    expect(cells[1].textContent).toBe("—"); // dr
    expect(container.querySelector(".resume-shield-hp")).toBeNull();
  });
});

describe("renderResumeMelee", () => {
  test("hides the container when nothing is equipped", () => {
    id("resume_melee_container").hidden = false;
    renderResume({ inventory: { melee: { equipped: [] } } });
    expect(id("resume_melee_container").hidden).toBe(true);
  });

  test("uses weapon_final_hit_points directly as max HP when present", () => {
    renderResume({
      inventory: {
        melee: {
          equipped: [
            {
              weapon_name: "Espada Longa",
              weapon_final_hit_points: 12, // authoritative — should win over the derived value
              final_hit_points: 999, // deliberately inconsistent, to prove it's ignored
              hit_points_modifier: -1,
            },
          ],
        },
      },
    });

    const row = id("resume_melee_container").querySelector("tbody tr");
    expect(row.textContent).toContain("11/12"); // actualHp = 12-1, maxHp = 12 (not 999-ish)
  });

  test("falls back to final_hit_points minus the modifier when weapon_final_hit_points is absent", () => {
    renderResume({
      inventory: {
        melee: {
          equipped: [
            {
              weapon_name: "Adaga",
              final_hit_points: 8, // = maxHp(10) + modifier(-2)
              hit_points_modifier: -2,
            },
          ],
        },
      },
    });

    const row = id("resume_melee_container").querySelector("tbody tr");
    // derived maxHp = final_hit_points(8) - modifier(-2) = 10
    expect(row.textContent).toContain("8/10");
  });

  test("omits the HP stepper when there's no derivable max HP at all", () => {
    renderResume({
      inventory: { melee: { equipped: [{ weapon_name: "Adaga" }] } },
    });
    const row = id("resume_melee_container").querySelector("tbody tr");
    expect(row.querySelector(".resume-melee-hp")).toBeNull();
  });

  test("shows reach/BAL/GDP damage with em-dash fallbacks", () => {
    renderResume({
      inventory: {
        melee: {
          equipped: [
            {
              weapon_name: "Adaga",
              weapon_reach: "C,1",
              weapon_bal_damage: "1d",
            },
          ],
        },
      },
    });
    const cells = id("resume_melee_container").querySelectorAll("tbody td");
    expect(cells[1].textContent).toBe("C,1");
    expect(cells[2].textContent).toBe("1d");
    expect(cells[3].textContent).toBe("—"); // gdp damage, absent
  });

  test("renders one row per equipped weapon, each with its own instance id on the stepper", () => {
    renderResume({
      inventory: {
        melee: {
          equipped: [
            {
              weapon_name: "A",
              weapon_final_hit_points: 5,
              _instanceId: "inst-a",
            },
            {
              weapon_name: "B",
              weapon_final_hit_points: 5,
              _instanceId: "inst-b",
            },
          ],
        },
      },
    });
    const rows = id("resume_melee_container").querySelectorAll("tbody tr");
    expect(rows).toHaveLength(2);
    expect(rows[0].querySelector(".resume-melee-hp").dataset.instanceId).toBe(
      "inst-a",
    );
    expect(rows[1].querySelector(".resume-melee-hp").dataset.instanceId).toBe(
      "inst-b",
    );
  });
});

describe("renderResumeRanged", () => {
  test("hides the container when nothing is equipped", () => {
    id("resume_ranged_container").hidden = false;
    renderResume({ inventory: { ranged: { equipped: [] } } });
    expect(id("resume_ranged_container").hidden).toBe(true);
  });

  test("shows TR/PREC/GDP damage and an HP stepper driven by weapon_final_hit_points", () => {
    renderResume({
      inventory: {
        ranged: {
          equipped: [
            {
              weapon_name: "Arco Longo",
              weapon_tr: "1x2",
              weapon_prec: 2,
              weapon_gdp_damage: "1d+2",
              weapon_final_hit_points: 6,
              hit_points_modifier: 0,
            },
          ],
        },
      },
    });

    const row = id("resume_ranged_container").querySelector("tbody tr");
    const cells = row.querySelectorAll("td");
    expect(cells[0].textContent).toBe("Arco Longo");
    expect(cells[1].textContent).toBe("1x2");
    expect(cells[2].textContent).toBe("2");
    expect(cells[3].textContent).toBe("1d+2");
    expect(row.textContent).toContain("6/6");
  });

  test("unlike melee, does NOT fall back to a derived max HP — omits the stepper when weapon_final_hit_points is absent", () => {
    renderResume({
      inventory: {
        ranged: {
          equipped: [
            {
              weapon_name: "Funda",
              final_hit_points: 8,
              hit_points_modifier: -1,
            },
          ],
        },
      },
    });
    const row = id("resume_ranged_container").querySelector("tbody tr");
    expect(row.querySelector(".resume-ranged-hp")).toBeNull();
  });
});
