// Materials must finish loading before any catalog that populates a material <select>
// (armor/shield/melee/ranged/firearms) starts its own fetch — see store/catalogs.js's comment.
// Mocked wholesale: this test only asserts ordering, not what any loader actually does.
const callOrder = [];

function mockLoader(name, resolveDelayMs = 0) {
  return jest.fn(
    () =>
      new Promise((resolve) => {
        setTimeout(() => {
          callOrder.push(name);
          resolve();
        }, resolveDelayMs);
      }),
  );
}

jest.mock("dev/public/js/shared/availability.js", () => ({
  setCatalogAudience: jest.fn(),
}));
jest.mock("dev/public/js/engine/character/races/index.js", () => ({
  loadRaces: mockLoader("races"),
}));
jest.mock("dev/public/js/engine/character/metaRaces/index.js", () => ({
  loadMetaRaces: mockLoader("metaRaces"),
}));
jest.mock("dev/public/js/engine/character/conditions/index.js", () => ({
  loadConditions: mockLoader("conditions"),
}));
jest.mock("dev/public/js/engine/character/traits/advantages/index.js", () => ({
  loadAdvantages: mockLoader("advantages"),
}));
jest.mock(
  "dev/public/js/engine/character/traits/disadvantages/index.js",
  () => ({
    loadDisadvantages: mockLoader("disadvantages"),
  }),
);
jest.mock("dev/public/js/engine/character/skills/index.js", () => ({
  loadSkills: mockLoader("skills"),
}));
jest.mock("dev/public/js/engine/magic/spells/index.js", () => ({
  loadSpells: mockLoader("spells"),
}));
jest.mock("dev/public/js/engine/inventory/armor/index.js", () => ({
  loadArmors: mockLoader("armors"),
}));
jest.mock("dev/public/js/engine/inventory/shield/index.js", () => ({
  loadShields: mockLoader("shields"),
}));
jest.mock("dev/public/js/engine/inventory/melee/index.js", () => ({
  loadMeleeWeapons: mockLoader("melee"),
}));
jest.mock("dev/public/js/engine/inventory/ranged/index.js", () => ({
  loadRangedWeapons: mockLoader("ranged"),
}));
jest.mock("dev/public/js/engine/inventory/firearms/index.js", () => ({
  loadFirearms: mockLoader("firearms"),
}));
jest.mock("dev/public/js/engine/inventory/ammo/index.js", () => ({
  loadAmmo: mockLoader("ammo"),
}));
jest.mock("dev/public/js/engine/inventory/alchemy/index.js", () => ({
  loadAlchemy: mockLoader("alchemy"),
}));
jest.mock("dev/public/js/engine/inventory/survivalGear/index.js", () => ({
  loadSurvivalGear: mockLoader("survivalGear"),
}));
jest.mock("dev/public/js/engine/inventory/accessories/index.js", () => ({
  loadAccessories: mockLoader("accessories"),
}));
jest.mock("dev/public/js/engine/inventory/magicGear/index.js", () => ({
  loadMagicGear: mockLoader("magicGear"),
}));
jest.mock(
  "dev/public/js/engine/inventory/shared/enchantments/index.js",
  () => ({
    loadEnchantments: mockLoader("enchantments"),
  }),
);
jest.mock("dev/public/js/engine/inventory/shared/dualUseWeapons.js", () => ({
  loadDualUseWeapons: mockLoader("dualUseWeapons"),
}));
// Materials resolves slower than it would in practice specifically to prove the fix: if it were
// still inside the Promise.all, a fast loader like melee/armor/etc. (0ms delay) would finish and
// populate its material <select> first, reproducing the empty-dropdown bug.
jest.mock("dev/public/js/engine/inventory/shared/materials.js", () => ({
  loadMaterials: mockLoader("materials", 10),
}));
jest.mock("dev/public/js/shared/rules.js", () => ({
  loadRules: mockLoader("rules"),
}));

import { reloadCatalogs } from "dev/public/js/store/catalogs.js";
import { loadArmors } from "dev/public/js/engine/inventory/armor/index.js";
import { loadMeleeWeapons } from "dev/public/js/engine/inventory/melee/index.js";

beforeEach(() => {
  callOrder.length = 0;
});

test("materials finishes loading before any material-dependent catalog starts fetching", async () => {
  await reloadCatalogs("pc");

  const materialsIndex = callOrder.indexOf("materials");
  expect(materialsIndex).toBe(0);
  expect(loadArmors).toHaveBeenCalledTimes(1);
  expect(loadMeleeWeapons).toHaveBeenCalledTimes(1);
});

test("every catalog loads exactly once", async () => {
  await reloadCatalogs("pc");

  expect(callOrder).toHaveLength(21);
  expect(new Set(callOrder).size).toBe(21);
});
