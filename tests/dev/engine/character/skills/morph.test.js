import { renderSkills } from "dev/public/js/engine/character/skills/render.js";
import { resetDOM } from "tests/dev/helpers/domFixture.js";

beforeEach(() => {
  resetDOM(`<div id="skillList"></div>`);
});

test("base-value input keeps focus/typed value and the detail <details> stays open across a re-render", () => {
  const selected = {
    skills: { "SK-1": { base_value: 12, modifier: 0 } },
  };
  const data = {
    skills: [{ skill_id: "SK-1", skill_name: "Espada", skill_source_book: "Básico", skill_source_page: "1" }],
  };

  renderSkills(selected, data, undefined);

  const baseInput = document.querySelector(
    '.skill-input[data-id="SK-1"][data-field="base_value"]',
  );
  baseInput.focus();
  baseInput.value = "15";

  document
    .querySelector("#detail-row-skill-SK-1 details")
    .setAttribute("open", "");

  selected.skills["SK-1"].modifier = 1;
  renderSkills(selected, data, undefined);

  expect(document.activeElement.classList.contains("skill-input")).toBe(true);
  expect(document.activeElement.value).toBe("15");
  expect(
    document.querySelector("#detail-row-skill-SK-1 details").hasAttribute("open"),
  ).toBe(true);
});

test("reordering skills (adding/removing one) doesn't misattribute is-card-expanded to the wrong row", () => {
  const selected = {
    skills: {
      "SK-1": { base_value: 10, modifier: 0 },
      "SK-2": { base_value: 10, modifier: 0 },
    },
  };
  const data = {
    skills: [
      { skill_id: "SK-1", skill_name: "Espada" },
      { skill_id: "SK-2", skill_name: "Furtividade" },
    ],
  };

  renderSkills(selected, data, undefined);
  document.getElementById("skill-SK-2").classList.add("is-card-expanded");

  delete selected.skills["SK-1"];
  renderSkills(selected, data, undefined);
  selected.skills["SK-1"] = { base_value: 10, modifier: 0 };
  renderSkills(selected, data, undefined);

  expect(
    document.getElementById("skill-SK-2").classList.contains("is-card-expanded"),
  ).toBe(true);
  expect(
    document.getElementById("skill-SK-1").classList.contains("is-card-expanded"),
  ).toBe(false);
});
