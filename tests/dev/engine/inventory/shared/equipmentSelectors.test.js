import {
  storageOptions,
  equippedMoveSelect,
  materialOptions,
  tierOptions,
} from "dev/public/js/engine/inventory/shared/equipmentSelectors.js";
import { STORAGE_LOCATIONS } from "dev/public/js/shared/constants.js";
import { t } from "dev/public/js/localization/pt-BR/index.js";

// Parse the HTML strings back into real <option> elements for reliable assertions.
function parseOptions(html) {
  const select = document.createElement("select");
  select.innerHTML = html;
  return Array.from(select.options);
}

function parseSelect(html) {
  const container = document.createElement("div");
  container.innerHTML = html;
  return container.querySelector("select");
}

describe("storageOptions", () => {
  test("renders one option per storage location, in order", () => {
    const options = parseOptions(storageOptions(null));
    expect(options.map((o) => o.value)).toEqual(STORAGE_LOCATIONS);
  });

  test("labels each option via the localization system", () => {
    const options = parseOptions(storageOptions(null));
    options.forEach((option, i) => {
      expect(option.textContent.trim()).toBe(
        t(`storage.${STORAGE_LOCATIONS[i]}`),
      );
    });
  });

  test("marks the current location's option as selected", () => {
    const options = parseOptions(storageOptions("stash"));
    expect(options.find((o) => o.value === "stash").selected).toBe(true);
    expect(options.filter((o) => o.selected)).toHaveLength(1);
  });

  test("marks no option's attribute as selected when currentLocation matches nothing", () => {
    // The live .selected property defaults to the first option even with none marked; check the attribute instead.
    const options = parseOptions(storageOptions("nowhere"));
    expect(options.some((o) => o.hasAttribute("selected"))).toBe(false);
  });
});

describe("equippedMoveSelect", () => {
  test("applies the given css class and extra data attributes to the <select>", () => {
    const select = parseSelect(
      equippedMoveSelect("move-select", 'data-slot="Tronco"'),
    );
    expect(select.className).toBe("move-select");
    expect(select.dataset.slot).toBe("Tronco");
  });

  test("has an 'Equipped' option with an empty value, followed by every storage location", () => {
    const select = parseSelect(equippedMoveSelect("move-select"));
    const options = Array.from(select.options);
    expect(options[0].value).toBe("");
    expect(options[0].textContent).toBe(t("storage.equipped"));
    expect(options.slice(1).map((o) => o.value)).toEqual(STORAGE_LOCATIONS);
  });
});

describe("materialOptions", () => {
  const materials = [
    { material_id: "MAT-001", material_name: "Aço" },
    { material_id: "MAT-002", material_name: "Mithril" },
  ];

  test("renders one option per material with its display name", () => {
    const options = parseOptions(materialOptions(materials, null));
    expect(options.map((o) => o.value)).toEqual(["MAT-001", "MAT-002"]);
    expect(options.map((o) => o.textContent)).toEqual(["Aço", "Mithril"]);
  });

  test("marks the selected material's option as selected", () => {
    const options = parseOptions(materialOptions(materials, "MAT-002"));
    expect(options.find((o) => o.value === "MAT-002").selected).toBe(true);
  });

  test("renders nothing for an empty materials array", () => {
    expect(materialOptions([], null)).toBe("");
  });
});

describe("tierOptions", () => {
  test("renders a placeholder '-' option when there are no tiers", () => {
    const options = parseOptions(tierOptions([], null));
    expect(options).toHaveLength(1);
    expect(options[0].value).toBe("");
    expect(options[0].textContent).toBe("-");
  });

  test("renders one option per tier, marking the selected one", () => {
    const options = parseOptions(tierOptions(["I", "II", "III"], "II"));
    expect(options.map((o) => o.value)).toEqual(["I", "II", "III"]);
    expect(options.find((o) => o.value === "II").selected).toBe(true);
  });
});
