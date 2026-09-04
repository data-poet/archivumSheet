// These values are load-bearing keys matched against CSV data (e.g. ARMOR_SLOTS vs db_equipment_armors.csv); pinning them locks in a regression that would otherwise fail silently.
import {
  STORAGE_LOCATIONS,
  STORAGE_LABELS,
  ARMOR_SLOTS,
  RACIAL_TRAIT_TYPE,
  DEFAULT_MATERIAL_ID,
} from "dev/public/js/shared/constants.js";
import { LABELS } from "dev/public/js/localization/pt-BR/index.js";

describe("STORAGE_LOCATIONS", () => {
  test("is exactly backpack, stash, camp, in that order", () => {
    expect(STORAGE_LOCATIONS).toEqual(["backpack", "stash", "camp"]);
  });
});

describe("STORAGE_LABELS", () => {
  test("is sourced from LABELS.storage, not a hardcoded copy", () => {
    expect(STORAGE_LABELS).toBe(LABELS.storage);
  });

  test("has a label for every storage location plus 'equipped'", () => {
    STORAGE_LOCATIONS.forEach((location) => {
      expect(STORAGE_LABELS[location]).toEqual(expect.any(String));
    });
    expect(STORAGE_LABELS.equipped).toEqual(expect.any(String));
  });
});

describe("ARMOR_SLOTS", () => {
  test("is the 6 Portuguese slot names, in order", () => {
    expect(ARMOR_SLOTS).toEqual([
      "Cabeça",
      "Tronco",
      "Braços",
      "Mãos",
      "Pernas",
      "Pés",
    ]);
  });
});

describe("RACIAL_TRAIT_TYPE", () => {
  test("matches the trait type used to exclude race-innate grants from pickers", () => {
    expect(RACIAL_TRAIT_TYPE).toBe("Racial");
  });
});

describe("DEFAULT_MATERIAL_ID", () => {
  test("matches the CSV's default material row id", () => {
    expect(DEFAULT_MATERIAL_ID).toBe("MAT-000");
  });
});
