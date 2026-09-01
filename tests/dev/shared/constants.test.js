// shared/constants.js has no functions, just exported values — several of
// which are load-bearing keys that must match strings coming from the CSV
// data files (e.g. ARMOR_SLOTS' Portuguese names matching
// db_equipment_armors.csv slot values). These tests are a regression lock:
// an accidental edit to any of these strings would break data matching
// silently rather than throwing, so pin the exact values.
//
// ACCESSORY_ITEM_CATEGORY / MAGIC_GEAR_ITEM_CATEGORY used to live here as
// hardcoded copies — they're covered instead by
// tests/dev/engine/inventory/shared/enchantments/model.test.js's
// getAccessoryItemCategory()/getMagicGearItemCategory() coverage now that
// they're fetched from the engine.
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
