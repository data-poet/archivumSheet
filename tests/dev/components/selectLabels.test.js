import { initSelectLabels } from "dev/public/js/components/selectLabels.js";
import { t } from "dev/public/js/localization/pt-BR/index.js";
import { resetDOM } from "tests/dev/helpers/domFixture.js";

function selectsDOM(...ids) {
  document.body.insertAdjacentHTML(
    "beforeend",
    ids.map((id) => `<select id="${id}"></select>`).join(""),
  );
}

beforeEach(() => {
  resetDOM();
});

describe("initSelectLabels", () => {
  test("composes '<field> — <domain>' from the localization layer", () => {
    selectsDOM("meleeNameSelect", "meleeStorage", "looseAmmoTypeFilter");

    initSelectLabels();

    expect(
      document.getElementById("meleeNameSelect").getAttribute("aria-label"),
    ).toBe(`${t("common.name")} — ${t("tabs.equipment.melee")}`);
    expect(
      document.getElementById("meleeStorage").getAttribute("aria-label"),
    ).toBe(`${t("common.storage")} — ${t("tabs.equipment.melee")}`);
    expect(
      document.getElementById("looseAmmoTypeFilter").getAttribute("aria-label"),
    ).toBe(`${t("common.type")} — ${t("ammo.looseAmmo")}`);
  });

  test("uses the field name alone when there's no domain to qualify it", () => {
    selectsDOM("raceNameSelect", "raceSubSelect");

    initSelectLabels();

    expect(
      document.getElementById("raceNameSelect").getAttribute("aria-label"),
    ).toBe(t("character.race"));
    expect(
      document.getElementById("raceSubSelect").getAttribute("aria-label"),
    ).toBe(t("character.subRace"));
  });

  test("never writes an empty or dangling label — every key in the map resolves", () => {
    const ids = [
      "advTypeSelect",
      "skillCategorySelect",
      "spellSchoolSelect",
      "armorSlotSelect",
      "firearmMaterialSelect",
      "ammoContainerSelect",
      "customItemStorage",
      "survivalGearNameSelect",
      "accessoryStorage",
      "alchemyTierSelect",
    ];
    selectsDOM(...ids);

    initSelectLabels();

    ids.forEach((id) => {
      const label = document.getElementById(id).getAttribute("aria-label");
      expect(label).toBeTruthy();
      expect(label).not.toMatch(/^\s*—|—\s*$/);
    });
  });

  test("skips ids that aren't in the DOM instead of throwing", () => {
    expect(() => initSelectLabels()).not.toThrow();
  });
});
