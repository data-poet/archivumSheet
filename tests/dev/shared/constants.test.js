// These values are load-bearing keys matched against CSV data (e.g. ARMOR_SLOTS vs db_equipment_armors.csv); pinning them locks in a regression that would otherwise fail silently.
import fs from "fs";
import path from "path";
import {
  STORED_AT,
  STORAGE_LOCATIONS,
  STORAGE_LABELS,
  ARMOR_SLOTS,
  RACIAL_TRAIT_TYPE,
  DEFAULT_MATERIAL_ID,
} from "dev/public/js/shared/constants.js";
import * as engineStorage from "helpers/storage.js";
import { LABELS } from "dev/public/js/localization/pt-BR/index.js";

describe("STORED_AT", () => {
  test("mirrors the engine registry in helpers/storage.js", () => {
    expect(STORED_AT).toEqual(engineStorage.STORED_AT);
  });

  test("STORAGE_LOCATIONS lists the same locations as the engine's VALID_STORED_AT", () => {
    expect([...STORAGE_LOCATIONS].sort()).toEqual(
      [...engineStorage.VALID_STORED_AT].sort(),
    );
  });
});

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

  test("is the only place the frontend spells the default material id", () => {
    const jsDir = path.join(__dirname, "../../../dev/public/js");
    const offenders = fs
      .readdirSync(jsDir, { recursive: true })
      .filter((f) => f.endsWith(".js"))
      .filter((f) => f !== path.join("shared", "constants.js"))
      .filter((f) =>
        fs.readFileSync(path.join(jsDir, f), "utf8").includes('"MAT-000"'),
      );
    expect(offenders).toEqual([]);
  });
});
