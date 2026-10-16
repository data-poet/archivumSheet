import { renderResume } from "dev/public/js/components/resume/index.js";
import { resetResumeDOM } from "tests/dev/helpers/resumeDomFixture.js";

function id(x) {
  return document.getElementById(x);
}

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
          id: "m1",
          weapon_name: "Espada",
          weapon_final_hit_points: 18,
          hit_points_modifier: -2,
        },
      ],
    },
    ranged: {
      equipped: [
        { id: "r1", weapon_name: "Arco", weapon_final_hit_points: 12 },
      ],
    },
    firearms: {
      equipped: [
        {
          id: "f1",
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
            id: "c1",
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
      id: "c1",
      storedAt: "equipped",
      contents: [{ ammo_id: "AMMO-001", quantity: 12 }],
    },
  ],
};

beforeEach(() => {
  resetResumeDOM();
});

describe("renderResume", () => {
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

  test("renders the primary and secondary attribute inputs", () => {
    renderResume(FULL_SHEET, DATA, SELECTED);

    expect(
      id("resume_primary_attrs").querySelectorAll(".resume-primary-mod-input"),
    ).toHaveLength(4);
    expect(
      id("resume_secondary_snapshot").querySelectorAll(".secondary-input")
        .length,
    ).toBeGreaterThan(0);
    expect(
      id("resume_bar_hp").querySelectorAll(".secondary-input"),
    ).toHaveLength(2);
  });

  test("hides the portrait when the sheet has no uploaded image", () => {
    renderResume(FULL_SHEET, DATA, SELECTED);

    expect(id("resume-charimg-wrapper").hidden).toBe(true);
  });
});
