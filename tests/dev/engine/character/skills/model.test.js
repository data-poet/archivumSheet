jest.mock("dev/public/js/api.js", () => ({ fetchSkills: jest.fn() }));
jest.mock("dev/public/js/compute/autorun.js", () => ({
  triggerAutoRun: jest.fn(),
}));
jest.mock("dev/public/js/components/undo.js", () => ({
  offerUndo: jest.fn(),
}));

import { fetchSkills } from "dev/public/js/api.js";
import { triggerAutoRun } from "dev/public/js/compute/autorun.js";
import { offerUndo } from "dev/public/js/components/undo.js";
import {
  loadSkills,
  filterSkillsByCategory,
  addSkill,
  removeSkill,
  updateSkill,
} from "dev/public/js/engine/character/skills/model.js";
import { state } from "dev/public/js/state.js";
import { t } from "dev/public/js/localization/pt-BR.js";
import { resetDOM } from "tests/dev/helpers/domFixture.js";
import { resetState } from "tests/dev/helpers/stateFixture.js";

const SKILL_ROWS = [
  {
    skill_id: "SK-1",
    skill_category: "Armas e Combate",
    skill_box_name: "Espada | IQ",
    skill_base_attribute: "DX",
  },
  {
    skill_id: "SK-2",
    skill_category: "Sociais",
    skill_box_name: "Diplomacia | IQ",
    skill_base_attribute: "IQ",
  },
];

function skillsDOM() {
  document.body.insertAdjacentHTML(
    "beforeend",
    `
      <select id="skillCategorySelect"></select>
      <select id="skillSelect"></select>
      <div id="skillList"></div>
    `,
  );
}

beforeEach(() => {
  resetDOM(); // default skeleton — includes ST/DX/IQ/HT_base/_mod inputs
  skillsDOM();
  resetState();
  jest.clearAllMocks();
});

describe("loadSkills", () => {
  test("populates the category filter with unique, sorted categories and the skill select", async () => {
    fetchSkills.mockResolvedValue(SKILL_ROWS);

    await loadSkills();

    const categoryOptions = Array.from(
      document.getElementById("skillCategorySelect").options,
    );
    expect(categoryOptions.map((o) => o.value)).toEqual([
      "",
      "Armas e Combate",
      "Sociais",
    ]);
    expect(categoryOptions[0].textContent).toBe(t("traits.categoryFilter"));

    const skillOptions = Array.from(
      document.getElementById("skillSelect").options,
    );
    expect(skillOptions.map((o) => o.value)).toEqual(["SK-1", "SK-2"]);
    expect(skillOptions[0].textContent).toBe("Espada | IQ");
  });
});

describe("filterSkillsByCategory", () => {
  beforeEach(() => {
    state.data.skills = SKILL_ROWS;
  });

  test("filters the skill select to the chosen category", () => {
    document.getElementById("skillCategorySelect").innerHTML =
      `<option value="Sociais" selected>x</option>`;
    filterSkillsByCategory();
    const options = Array.from(document.getElementById("skillSelect").options);
    expect(options.map((o) => o.value)).toEqual(["SK-2"]);
  });

  test("an empty category shows every skill", () => {
    document.getElementById("skillCategorySelect").innerHTML =
      `<option value="" selected>x</option>`;
    filterSkillsByCategory();
    const options = Array.from(document.getElementById("skillSelect").options);
    expect(options).toHaveLength(2);
  });
});

describe("addSkill", () => {
  beforeEach(() => {
    state.data.skills = SKILL_ROWS;
  });

  test("does nothing when nothing is selected", () => {
    document.getElementById("skillSelect").innerHTML =
      `<option value="" selected>x</option>`;
    addSkill();
    expect(state.selected.skills).toEqual({});
    expect(triggerAutoRun).not.toHaveBeenCalled();
  });

  test("adds a new skill using its base attribute's current value", () => {
    document.getElementById("skillSelect").innerHTML =
      `<option value="SK-1" selected>x</option>`;
    // getSkillAttributeBase() reads from state.sheet (engine output), not
    // the raw DOM inputs — those only matter to compute/attributes.js.
    state.sheet = {
      character: { primary_attributes: { DX: { base_value: 14 } } },
    };

    addSkill();

    expect(state.selected.skills["SK-1"]).toEqual({
      base_value: 14,
      modifier: 0,
      isTrainedWithMaster: false,
    });
    expect(triggerAutoRun).toHaveBeenCalledTimes(1);
  });

  test("defaults to DX when the skill row has no skill_base_attribute", () => {
    state.data.skills = [{ skill_id: "SK-3", skill_box_name: "x" }];
    document.getElementById("skillSelect").innerHTML =
      `<option value="SK-3" selected>x</option>`;
    state.sheet = {
      character: { primary_attributes: { DX: { base_value: 11 } } },
    };

    addSkill();

    expect(state.selected.skills["SK-3"].base_value).toBe(11);
  });

  test("does not overwrite an already-selected skill", () => {
    state.selected.skills["SK-1"] = {
      base_value: 99,
      modifier: 5,
      isTrainedWithMaster: true,
    };
    document.getElementById("skillSelect").innerHTML =
      `<option value="SK-1" selected>x</option>`;

    addSkill();

    expect(state.selected.skills["SK-1"]).toEqual({
      base_value: 99,
      modifier: 5,
      isTrainedWithMaster: true,
    });
  });
});

describe("removeSkill", () => {
  test("removes the skill, triggers autorun, and offers an undo that restores it", () => {
    state.selected.skills = {
      "SK-1": { base_value: 12, modifier: 0, isTrainedWithMaster: false },
      "SK-2": { base_value: 10, modifier: 0, isTrainedWithMaster: false },
    };

    removeSkill("SK-1");

    expect(state.selected.skills).toEqual({
      "SK-2": { base_value: 10, modifier: 0, isTrainedWithMaster: false },
    });
    expect(triggerAutoRun).toHaveBeenCalledTimes(1);
    expect(offerUndo).toHaveBeenCalledWith(expect.any(Function));

    // Invoking the undo callback restores the original full set.
    const undoFn = offerUndo.mock.calls[0][0];
    undoFn();
    expect(state.selected.skills).toEqual({
      "SK-1": { base_value: 12, modifier: 0, isTrainedWithMaster: false },
      "SK-2": { base_value: 10, modifier: 0, isTrainedWithMaster: false },
    });
    expect(triggerAutoRun).toHaveBeenCalledTimes(2); // once for remove, once for undo
  });
});

describe("updateSkill", () => {
  test("does nothing for a skill that isn't selected", () => {
    updateSkill("GHOST", "modifier", "3");
    expect(triggerAutoRun).not.toHaveBeenCalled();
  });

  test("updates the given field, coercing to a number", () => {
    state.selected.skills["SK-1"] = {
      base_value: 12,
      modifier: 0,
      isTrainedWithMaster: false,
    };
    updateSkill("SK-1", "modifier", "3");
    expect(state.selected.skills["SK-1"].modifier).toBe(3);
    expect(triggerAutoRun).toHaveBeenCalledTimes(1);
  });
});
