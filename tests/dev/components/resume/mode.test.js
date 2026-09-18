// R1: `mode: "ally"` renders a consult-only sheet. The load-bearing assertion is the
// absence of stepper classes — the delegated handlers in engine/**/events.js match on
// those, so an ally row that lacks them cannot dispatch a write to the PC's state.
import {
  renderResume,
  RESUME_MODES,
} from "dev/public/js/components/resume/index.js";
import { resetResumeDOM } from "tests/dev/helpers/resumeDomFixture.js";

function id(x) {
  return document.getElementById(x);
}

// Every editable control the resume can render, by the class its handler matches on.
const EQUIPMENT_STEPPER_CLASSES = [
  "resume-armor-hp",
  "resume-shield-hp",
  "resume-melee-hp",
  "resume-ranged-hp",
  "resume-firearm-hp",
  "resume-firearm-rounds",
  "resume-ammo-qty",
];

const FULL_SHEET = {
  pc: { image: { uploaded: false } },
  character: {
    primary_attributes: {
      ST: { value: 12, modifier: 0 },
      DX: { value: 11, modifier: 0 },
      IQ: { value: 10, modifier: 0 },
      HT: { value: 13, modifier: 0 },
    },
    secondary_attributes: {
      HP: { value: 13, base_value: 13, bought: 0, modifier: -2 },
      Mana: { value: 10, base_value: 10, bought: 0, modifier: 0 },
      Toxicity: { value: 10, base_value: 10, bought: 0, modifier: 0 },
      Will: { value: 10, modifier: 0 },
      Dodge: { value: 8, modifier: 0 },
    },
    character_points: { primary_attributes: 20, skills: 4 },
  },
  inventory: {
    armor: {
      equipped: {
        torso: { final_damage_resistance: 4, armor_final_hit_points: 20 },
      },
    },
    shield: {
      equipped: {
        shield_name: "Escudo",
        final_damage_resistance: 3,
        shield_final_hit_points: 30,
        block: 10,
      },
    },
    melee: {
      equipped: [
        {
          _instanceId: "m1",
          weapon_name: "Espada",
          weapon_final_hit_points: 18,
          hit_points_modifier: -2,
        },
      ],
    },
    ranged: {
      equipped: [
        { _instanceId: "r1", weapon_name: "Arco", weapon_final_hit_points: 12 },
      ],
    },
    firearms: {
      equipped: [
        {
          _instanceId: "f1",
          weapon_name: "Mosquete",
          weapon_final_hit_points: 15,
          weapon_final_magazine_size: 6,
          rounds_loaded: 4,
        },
      ],
    },
    ammo: {
      containers: {
        equipped: [
          {
            _instanceId: "c1",
            contents: [{ ammo_id: "AMMO-001", quantity: 12 }],
          },
        ],
      },
    },
    alchemy: {
      backpack: [
        { consumable_id: "ALC-1", consumable_name: "Poção", quantity: 2 },
      ],
    },
  },
};

const DATA = { ammo: [{ ammo_id: "AMMO-001", ammo_name: "Flecha" }] };
const SELECTED = {
  ammo_containers: [
    {
      _instanceId: "c1",
      storedAt: "equipped",
      contents: [{ ammo_id: "AMMO-001", quantity: 12 }],
    },
  ],
};

beforeEach(() => {
  resetResumeDOM();
});

describe("renderResume mode: pc (default)", () => {
  test("renders every equipment stepper, so the sheet keeps its play surface", () => {
    renderResume(FULL_SHEET, DATA, SELECTED);

    EQUIPMENT_STEPPER_CLASSES.forEach((cls) => {
      expect(document.querySelectorAll(`.${cls}`).length).toBeGreaterThan(0);
    });
  });

  test("renders the pc-only accounting sections", () => {
    renderResume(FULL_SHEET, DATA, SELECTED);

    expect(id("resume_weight_tbody").innerHTML).not.toBe("");
    expect(id("resume_value_tbody").innerHTML).not.toBe("");
    expect(id("resume_points_tbody").innerHTML).not.toBe("");
    expect(id("resume_alchemy_container").hidden).toBe(false);
    expect(id("resume_bar_experience").innerHTML).not.toBe("");
  });

  test("an explicit pc mode matches the default", () => {
    renderResume(FULL_SHEET, DATA, SELECTED, { mode: RESUME_MODES.PC });
    const withMode = id("resume_armor_container").innerHTML;

    resetResumeDOM();
    renderResume(FULL_SHEET, DATA, SELECTED);

    expect(id("resume_armor_container").innerHTML).toBe(withMode);
  });
});

describe("renderResume mode: ally", () => {
  test("renders no equipment stepper class anywhere — writes cannot be dispatched", () => {
    renderResume(FULL_SHEET, DATA, SELECTED, { mode: RESUME_MODES.ALLY });

    EQUIPMENT_STEPPER_CLASSES.forEach((cls) => {
      expect(document.querySelectorAll(`.${cls}`)).toHaveLength(0);
    });
  });

  test("renders no <input> in any equipment or supplies section", () => {
    renderResume(FULL_SHEET, DATA, SELECTED, { mode: RESUME_MODES.ALLY });

    [
      "resume_armor_container",
      "resume_shield_container",
      "resume_melee_container",
      "resume_ranged_container",
      "resume_firearms_container",
      "resume_ammo_container",
    ].forEach((containerId) => {
      expect(id(containerId).querySelectorAll("input")).toHaveLength(0);
    });
  });

  test("still shows the consult values it replaced the steppers with", () => {
    renderResume(FULL_SHEET, DATA, SELECTED, { mode: RESUME_MODES.ALLY });

    expect(id("resume_armor_container").textContent).toContain("20");
    // melee: 18 max with a -2 modifier -> 16 actual
    expect(id("resume_melee_container").textContent).toContain("16");
    expect(id("resume_firearms_container").textContent).toContain("4");
    expect(id("resume_firearms_container").textContent).toContain("6");
    expect(id("resume_ammo_container").textContent).toContain("12");
  });

  test("keeps primary and secondary attributes editable — an ally tracks its own damage", () => {
    renderResume(FULL_SHEET, DATA, SELECTED, { mode: RESUME_MODES.ALLY });

    expect(
      id("resume_primary_attrs").querySelectorAll(".resume-primary-mod-input"),
    ).toHaveLength(4);
    expect(
      id("resume_secondary_snapshot").querySelectorAll(".secondary-input")
        .length,
    ).toBeGreaterThan(0);
    expect(
      id("resume_bar_hp").querySelectorAll(".secondary-input"),
    ).toHaveLength(1);
  });

  test("drops the experience bar and the point, weight, value and alchemy sections", () => {
    renderResume(FULL_SHEET, DATA, SELECTED, { mode: RESUME_MODES.ALLY });

    expect(id("resume_weight_tbody").innerHTML).toBe("");
    expect(id("resume_value_tbody").innerHTML).toBe("");
    expect(id("resume_points_tbody").innerHTML).toBe("");
    expect(id("resume_alchemy_container").innerHTML).toBe("");
    expect(id("resume_bar_experience").innerHTML).toBe("");
  });

  test("still renders the consult-only sections an ally does have", () => {
    renderResume(FULL_SHEET, DATA, SELECTED, { mode: RESUME_MODES.ALLY });

    expect(id("resume_armor_container").hidden).toBe(false);
    expect(id("resume_shield_container").hidden).toBe(false);
    expect(id("resume_melee_container").hidden).toBe(false);
    expect(id("resume_firearms_container").hidden).toBe(false);
  });

  test("uses the passed sheet's portrait plus a path fallback, not the live PC image", () => {
    renderResume(
      { ...FULL_SHEET, pc: { image: { uploaded: false } } },
      DATA,
      SELECTED,
      { mode: RESUME_MODES.ALLY, portraitSrc: "/images/allies/ALLY-000.png" },
    );

    const img = document.getElementById("resume-charimg-img");
    expect(img.getAttribute("src")).toBe("/images/allies/ALLY-000.png");
  });

  test("hides the portrait when the ally has neither an upload nor a path", () => {
    renderResume(FULL_SHEET, DATA, SELECTED, { mode: RESUME_MODES.ALLY });

    expect(id("resume-charimg-wrapper").hidden).toBe(true);
  });
});
