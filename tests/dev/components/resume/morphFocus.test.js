// End-to-end proof, through the real renderResume() pipeline (not a synthetic morph test),
// that equipping a new weapon above the row someone is mid-editing doesn't steal their input.
import { renderResume } from "dev/public/js/components/resume/index.js";
import { resetResumeDOM } from "tests/dev/helpers/resumeDomFixture.js";

function id(x) {
  return document.getElementById(x);
}

beforeEach(() => {
  resetResumeDOM();
});

function meleeSheet(weapons) {
  return { inventory: { melee: { equipped: weapons } } };
}

describe("morph focus/caret survival", () => {
  test("typing in a weapon's HP stepper survives a new weapon being equipped above it", () => {
    renderResume(
      meleeSheet([
        { id: "weapon-a", weapon_name: "Adaga", weapon_final_hit_points: 10 },
        {
          id: "weapon-b",
          weapon_name: "Espada",
          weapon_final_hit_points: 12,
        },
      ]),
    );

    const inputB = document.querySelector(
      '#resume_melee_container input.resume-melee-hp[data-instance-id="weapon-b"]',
    );
    inputB.focus();
    inputB.value = "-3";
    inputB.setSelectionRange(1, 2);

    // A third weapon gets equipped and lands first — the same shape a fresh engine response takes.
    renderResume(
      meleeSheet([
        { id: "weapon-c", weapon_name: "Machado", weapon_final_hit_points: 8 },
        { id: "weapon-a", weapon_name: "Adaga", weapon_final_hit_points: 10 },
        {
          id: "weapon-b",
          weapon_name: "Espada",
          weapon_final_hit_points: 12,
        },
      ]),
    );

    const stillFocused = document.activeElement;
    expect(stillFocused.dataset.instanceId).toBe("weapon-b");
    expect(stillFocused.value).toBe("-3");
    expect(stillFocused.selectionStart).toBe(1);
    expect(stillFocused.selectionEnd).toBe(2);

    const rows = Array.from(
      id("resume_melee_container").querySelectorAll("tbody tr"),
    );
    expect(rows.map((r) => r.id)).toEqual([
      "resume-weapon-resume_melee_container-weapon-c",
      "resume-weapon-resume_melee_container-weapon-a",
      "resume-weapon-resume_melee_container-weapon-b",
    ]);
  });

  test("a vital bar's fill node survives a re-render (the CSS width transition can run)", () => {
    const sheet = {
      character: { secondary_attributes: { HP: { final_base_value: 20 } } },
    };
    renderResume(sheet);
    const fillBefore = id("resume_bar_hp").querySelector(".resume-bar-fill");

    renderResume({
      character: {
        secondary_attributes: { HP: { final_base_value: 20, modifier: -5 } },
      },
    });

    expect(id("resume_bar_hp").querySelector(".resume-bar-fill")).toBe(
      fillBefore,
    );
  });

  test("the active-conditions list keeps focus on its remove button across a re-render", () => {
    const data = {
      conditions: [
        {
          condition_key: "dor-leve",
          condition_name: "Dor Leve",
          condition_group: "dor",
        },
        {
          condition_key: "atordoado",
          condition_name: "Atordoado",
          condition_group: "outros",
        },
      ],
    };
    const selected = { conditions: { "dor-leve": true, atordoado: true } };
    const sheet = {
      character: {
        conditions: {
          active: [{ key: "dor-leve" }, { key: "atordoado" }],
          modifiers: {},
          tags: [],
        },
      },
    };

    renderResume(sheet, data, selected);

    const removeBtn = document.querySelector(
      '#resume_conditions_container [data-condition-key="atordoado"].condition-remove',
    );
    removeBtn.focus();

    // The exact re-render a toggle triggers: same data, one more active condition reported.
    renderResume(
      {
        character: {
          conditions: {
            active: [
              { key: "dor-leve" },
              { key: "atordoado" },
              { key: "nausea" },
            ],
            modifiers: {},
            tags: [],
          },
        },
      },
      {
        conditions: [
          ...data.conditions,
          {
            condition_key: "nausea",
            condition_name: "Náusea",
            condition_group: "outros",
          },
        ],
      },
      {
        conditions: { ...selected.conditions, nausea: true },
      },
    );

    expect(document.activeElement).toBe(removeBtn);
    expect(document.activeElement.dataset.conditionKey).toBe("atordoado");
  });
});
