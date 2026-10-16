// Dumps what the engine produces from a frozen copy of data/ and either records it (GOLDEN_MODE=record)
// or compares it with the recorded dump (compare). A refactor must leave every dump identical, however
// the live CSVs are being edited. Driven by `npm run golden:record` and `npm run golden:compare`.
import fs from "fs";
import path from "path";
import { toEnginePayload } from "dev/public/js/shared/enginePayload.js";

const mode = process.env.GOLDEN_MODE === "record" ? "record" : "compare";
const ROOT = path.join(__dirname, "../..");
const GOLDEN = path.join(ROOT, ".golden");
const BASELINE = path.join(GOLDEN, "baseline");

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonical(value[key])]),
    );
  }
  return value === undefined ? null : value;
}

function differences(a, b, at = "$", found = []) {
  if (found.length >= 10) return found;
  if (JSON.stringify(a) === JSON.stringify(b)) return found;
  const bothObjects = a && b && typeof a === "object" && typeof b === "object";
  if (!bothObjects || Array.isArray(a) !== Array.isArray(b)) {
    found.push(
      `${at}: ${JSON.stringify(a)?.slice(0, 80)} -> ${JSON.stringify(b)?.slice(0, 80)}`,
    );
    return found;
  }
  new Set([...Object.keys(a), ...Object.keys(b)]).forEach((key) => {
    differences(a[key], b[key], `${at}.${key}`, found);
  });
  return found;
}

beforeAll(() => {
  process.chdir(GOLDEN);
});

function dumps() {
  // Required after the chdir: the engine caches what it loads from ./data.
  const { DATASETS, loadDataset } = require("helpers/datasets.js");
  const dumpList = {};

  Object.keys(DATASETS).forEach((key) => {
    dumpList[`datasets/${key}`] = () => loadDataset(key);
  });

  const loaders = {
    armor: () => require("engine/inventory/js/armor/armor")._getArmorDB(),
    shield: () => require("engine/inventory/js/shield/shield")._getShieldDB(),
    melee: () => require("engine/inventory/js/melee/melee")._getMeleeDB(),
    ranged: () => require("engine/inventory/js/ranged/ranged")._getRangedDB(),
    firearms: () =>
      require("engine/inventory/js/firearms/firearms")._getFirearmsDB(),
    ammo: () => require("engine/inventory/js/ammo/ammo")._getAmmoDB(),
    containers: () =>
      require("engine/inventory/js/ammo/ammo")._getContainerDB(),
    alchemy: () =>
      require("engine/inventory/js/alchemy/alchemy")._getAlchemyDB(),
    survivalGear: () =>
      require("engine/inventory/js/survivalGear/survivalGear")._getSurvivalGearDB(),
    accessories: () =>
      require("engine/inventory/js/accessories/accessories")._getAccessoriesDB(),
    magicGear: () =>
      require("engine/inventory/js/magicGear/magicGear")._getMagicGearDB(),
    materials: () =>
      require("engine/inventory/js/shared/materialsDB").getMaterialsDB(),
    enchantments: () =>
      require("engine/inventory/js/shared/enchantmentsDB").getEnchantmentsDB(),
  };
  Object.entries(loaders).forEach(([name, load]) => {
    dumpList[`loaders/${name}`] = load;
  });

  const constants = {
    rules: () => require("helpers/rules.js"),
    effectTypes: () =>
      require("engine/inventory/js/shared/enchantmentsConstants.js"),
    dualUse: () => {
      const dual = require("engine/inventory/js/shared/dualUseWeapons.js");
      return {
        MELEE_TO_RANGED: dual.MELEE_TO_RANGED,
        RANGED_TO_MELEE: dual.RANGED_TO_MELEE,
      };
    },
    equipLimits: () =>
      require("engine/inventory/js/magicGear/magicGearConstants.js")
        .MAGIC_GEAR_EQUIP_LIMITS,
    aptitudeIds: () =>
      Object.keys(require("helpers/ids.js").MAGIC_APTITUDE_TIERS),
    masterCategories: () => [
      ...require("helpers/taxonomy.js").MASTER_ELIGIBLE_CATEGORIES,
    ],
  };
  Object.entries(constants).forEach(([name, read]) => {
    dumpList[`constants/${name}`] = read;
  });

  const { buildSheet } = require("engine/buildSheet.js");
  const { remapLegacyIds } = require("tests/helpers/dataRefs");
  const fixture = remapLegacyIds(
    JSON.parse(
      fs.readFileSync(
        path.join(ROOT, "tests/dev/helpers/fixtures/sheet.full.json"),
        "utf8",
      ),
    ),
  );
  const withCharacter = (patch) => ({
    ...fixture,
    character: { ...fixture.character, ...patch },
  });
  const sheetInputs = {
    fixture,
    "fixture-damaged": withCharacter({
      secondary: {
        ...fixture.character.secondary,
        HP: { bought: 2, modifier: -40 },
        FP: { bought: 0, modifier: -14 },
      },
    }),
    "fixture-strong-and-heavy": {
      ...withCharacter({
        primary: {
          ...fixture.character.primary,
          ST: { base_value: 18, modifier: 2 },
        },
      }),
      inventory: { ...fixture.inventory, weight: 90 },
    },
    "fixture-no-inventory": { ...fixture, inventory: { weight: 0 } },
    minimal: {
      character: {
        primary: {
          ST: { base_value: 10, modifier: 0 },
          DX: { base_value: 10, modifier: 0 },
          IQ: { base_value: 10, modifier: 0 },
          HT: { base_value: 10, modifier: 0 },
        },
      },
    },
  };
  Object.entries(sheetInputs).forEach(([name, input]) => {
    dumpList[`sheets/${name}`] = () => buildSheet(toEnginePayload(input));
  });

  const alliesDir = path.join(GOLDEN, "data/allies");
  fs.readdirSync(alliesDir, { recursive: true })
    .filter((file) => file.endsWith(".json") && !file.includes("tierLogic"))
    .forEach((file) => {
      const ally = JSON.parse(
        fs.readFileSync(path.join(alliesDir, file), "utf8"),
      );
      dumpList[`allies/${path.basename(file, ".json")}`] = () =>
        buildSheet(toEnginePayload(ally));
    });

  return dumpList;
}

const dumpList = {};
beforeAll(() => {
  Object.assign(dumpList, dumps());
});

test("records or compares every dump", () => {
  const names = Object.keys(dumpList);
  expect(names.length).toBeGreaterThan(40);
  const mismatches = [];

  names.forEach((name) => {
    const actual = canonical(JSON.parse(JSON.stringify(dumpList[name]())));
    const file = path.join(BASELINE, `${name.replace("/", "__")}.json`);

    if (mode === "record") {
      fs.mkdirSync(BASELINE, { recursive: true });
      fs.writeFileSync(file, `${JSON.stringify(actual, null, 1)}\n`);
      return;
    }
    if (!fs.existsSync(file)) {
      mismatches.push(`${name}: no recorded baseline`);
      return;
    }
    const recorded = JSON.parse(fs.readFileSync(file, "utf8"));
    const found = differences(recorded, actual);
    if (found.length > 0)
      mismatches.push(`${name}\n    ${found.join("\n    ")}`);
  });

  expect(mismatches).toEqual([]);
});
