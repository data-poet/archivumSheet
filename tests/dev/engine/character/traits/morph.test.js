import {
  renderAdvantages,
  renderDisadvantages,
} from "dev/public/js/engine/character/traits/render.js";
import { resetDOM } from "tests/dev/helpers/domFixture.js";

beforeEach(() => {
  resetDOM(`<div id="advList"></div><div id="disList"></div>`);
});

test("the detail <details> for an advantage stays open across a re-render", () => {
  const selected = { advantages: { "ADV-1": true } };
  const data = {
    advantages: [
      {
        advantage_id: "ADV-1",
        advantage_box_name: "Visão Aguçada",
        advantage_source_book: "Básico",
        advantage_source_page: "50",
      },
    ],
  };

  renderAdvantages(selected, data, undefined);

  const details = document.querySelector("#detail-row-adv-ADV-1 details");
  details.setAttribute("open", "");

  renderAdvantages(selected, data, undefined);

  expect(
    document.querySelector("#detail-row-adv-ADV-1 details").hasAttribute("open"),
  ).toBe(true);
});

test("reordering advantages (alphabetical by name change) doesn't misattribute is-card-expanded to the wrong row", () => {
  const selected = { advantages: { "ADV-1": true, "ADV-2": true } };
  const data = {
    advantages: [
      { advantage_id: "ADV-1", advantage_box_name: "Visão Aguçada" },
      { advantage_id: "ADV-2", advantage_box_name: "Vontade de Ferro" },
    ],
  };

  renderAdvantages(selected, data, undefined);
  document.getElementById("adv-ADV-2").classList.add("is-card-expanded");

  // Removing ADV-1 and re-adding shifts DOM order.
  delete selected.advantages["ADV-1"];
  renderAdvantages(selected, data, undefined);
  selected.advantages["ADV-1"] = true;
  renderAdvantages(selected, data, undefined);

  expect(
    document.getElementById("adv-ADV-2").classList.contains("is-card-expanded"),
  ).toBe(true);
  expect(
    document.getElementById("adv-ADV-1").classList.contains("is-card-expanded"),
  ).toBe(false);
});

test("disadvantages: the detail <details> survives a re-render, independent of advList's own ids", () => {
  const selected = { disadvantages: { "DIS-1": true } };
  const data = {
    disadvantages: [
      {
        disadvantage_id: "DIS-1",
        disadvantage_box_name: "Coxeadura",
        disadvantage_source_book: "Básico",
        disadvantage_source_page: "12",
      },
    ],
  };

  renderDisadvantages(selected, data, undefined);
  document
    .querySelector("#detail-row-dis-DIS-1 details")
    .setAttribute("open", "");

  renderDisadvantages(selected, data, undefined);

  expect(
    document
      .querySelector("#detail-row-dis-DIS-1 details")
      .hasAttribute("open"),
  ).toBe(true);
});
