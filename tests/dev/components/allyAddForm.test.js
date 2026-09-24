jest.mock("dev/public/js/store/allies/allies.js", () => ({
  addRosterEntry: jest.fn(),
}));

import { addRosterEntry } from "dev/public/js/store/allies/allies.js";
import { initAllyAddForm } from "dev/public/js/components/allies/allyAddForm.js";
import { t } from "dev/public/js/localization/pt-BR/index.js";
import { resetDOM } from "tests/dev/helpers/domFixture.js";

function formDOM() {
  document.body.insertAdjacentHTML(
    "beforeend",
    `
      <label id="ally-add-type-label"></label>
      <select id="ally-add-type"></select>
      <label id="ally-add-subtype-label"></label>
      <select id="ally-add-subtype"></select>
      <label id="ally-add-name-label"></label>
      <select id="ally-add-name"></select>
      <button id="ally-add-btn"></button>
    `,
  );
}

const INDEX = [
  { ally_id: "ALLY_HUMANOID_001", name: "Bran", type: "humanoids", subtype: null },
  { ally_id: "ALLY_ANIMAL_001", name: "Lobo", type: "animals", subtype: null },
  { ally_id: "ALLY_ANIMAL_002", name: "Cavalo", type: "animals", subtype: "mounts" },
];

beforeEach(() => {
  resetDOM();
  formDOM();
  jest.clearAllMocks();
});

describe("initAllyAddForm", () => {
  test("applies static labels", () => {
    initAllyAddForm({ index: INDEX });
    expect(document.getElementById("ally-add-type-label").textContent).toBe(
      t("allies.typeLabel"),
    );
    expect(document.getElementById("ally-add-btn").textContent).toBe(
      t("allies.add"),
    );
  });

  test("populates the type select with every distinct type", () => {
    initAllyAddForm({ index: INDEX });
    const options = [...document.getElementById("ally-add-type").options].map(
      (o) => o.value,
    );
    expect(options.sort()).toEqual(["animals", "humanoids"]);
  });

  test("hides the subtype field for a type with no subtypes", () => {
    initAllyAddForm({ index: INDEX });
    document.getElementById("ally-add-type").value = "humanoids";
    document
      .getElementById("ally-add-type")
      .dispatchEvent(new Event("change", { bubbles: true }));

    const subtypeSelect = document.getElementById("ally-add-subtype");
    expect(subtypeSelect.closest(".ally-add-field")).toBeNull();
  });

  test("names default to the first (alphabetical) type on load", () => {
    initAllyAddForm({ index: INDEX });
    const names = [...document.getElementById("ally-add-name").options].map(
      (o) => o.value,
    );
    expect(names).toEqual(["ALLY_ANIMAL_001"]);
  });

  test("switching to a type with subtypes shows the subtype select with a 'none' option", () => {
    initAllyAddForm({ index: INDEX });
    document.getElementById("ally-add-type").value = "animals";
    document
      .getElementById("ally-add-type")
      .dispatchEvent(new Event("change", { bubbles: true }));

    const options = [...document.getElementById("ally-add-subtype").options].map(
      (o) => o.value,
    );
    expect(options).toEqual(["", "mounts"]);
  });

  test("names list combines type + null subtype until a subtype is chosen", () => {
    initAllyAddForm({ index: INDEX });
    document.getElementById("ally-add-type").value = "animals";
    document
      .getElementById("ally-add-type")
      .dispatchEvent(new Event("change", { bubbles: true }));

    const names = [...document.getElementById("ally-add-name").options].map(
      (o) => o.value,
    );
    expect(names).toEqual(["ALLY_ANIMAL_001"]);

    document.getElementById("ally-add-subtype").value = "mounts";
    document
      .getElementById("ally-add-subtype")
      .dispatchEvent(new Event("change", { bubbles: true }));

    const namesAfter = [...document.getElementById("ally-add-name").options].map(
      (o) => o.value,
    );
    expect(namesAfter).toEqual(["ALLY_ANIMAL_002"]);
  });

  test("clicking add calls addRosterEntry with the selected name and notifies onAdd", () => {
    const onAdd = jest.fn();
    addRosterEntry.mockReturnValue("ai-1");
    initAllyAddForm({ index: INDEX, onAdd });

    document.getElementById("ally-add-btn").click();

    expect(addRosterEntry).toHaveBeenCalledWith("ALLY_ANIMAL_001");
    expect(onAdd).toHaveBeenCalledWith("ai-1");
  });

  test("does not call onAdd when addRosterEntry returns null", () => {
    const onAdd = jest.fn();
    addRosterEntry.mockReturnValue(null);
    initAllyAddForm({ index: INDEX, onAdd });

    document.getElementById("ally-add-btn").click();

    expect(onAdd).not.toHaveBeenCalled();
  });
});
