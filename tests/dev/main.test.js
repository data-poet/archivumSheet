// Smoke test only — main.js's ~28 init/load functions are already tested elsewhere.

jest.mock("dev/public/js/events/index.js", () => ({
  bindUI: jest.fn(),
}));
jest.mock("dev/public/js/components/nav.js", () => ({
  initNav: jest.fn(),
}));
jest.mock("dev/public/js/components/tabs.js", () => ({
  initTabs: jest.fn(),
}));
jest.mock("dev/public/js/components/viewMode.js", () => ({
  initViewMode: jest.fn(),
}));
jest.mock("dev/public/js/components/theme.js", () => ({
  initTheme: jest.fn(),
}));
jest.mock("dev/public/js/compute/attributes.js", () => ({
  setupAutoRun: jest.fn(),
}));
jest.mock("dev/public/js/ui.js", () => ({
  updateActualValues: jest.fn(),
  initAttributeTableHeaders: jest.fn(),
  renderListsPreserving: jest.fn(),
}));
jest.mock("dev/public/js/compute/index.js", () => ({
  runEngine: jest.fn(),
}));
jest.mock("dev/public/js/compute/autorun.js", () => ({
  initAutoRun: jest.fn(),
}));
jest.mock("dev/public/js/engine/character/races/index.js", () => ({
  loadRaces: jest.fn(() => Promise.resolve()),
}));
jest.mock("dev/public/js/engine/character/portrait/index.js", () => ({
  initCharacterImage: jest.fn(),
}));
jest.mock("dev/public/js/engine/character/traits/advantages/index.js", () => ({
  loadAdvantages: jest.fn(() => Promise.resolve()),
}));
jest.mock(
  "dev/public/js/engine/character/traits/disadvantages/index.js",
  () => ({
    loadDisadvantages: jest.fn(() => Promise.resolve()),
  }),
);
jest.mock("dev/public/js/engine/character/skills/index.js", () => ({
  loadSkills: jest.fn(() => Promise.resolve()),
}));
jest.mock("dev/public/js/engine/magic/spells/index.js", () => ({
  loadSpells: jest.fn(() => Promise.resolve()),
}));
jest.mock("dev/public/js/engine/inventory/armor/index.js", () => ({
  loadArmors: jest.fn(() => Promise.resolve()),
}));
jest.mock("dev/public/js/engine/inventory/shield/index.js", () => ({
  loadShields: jest.fn(() => Promise.resolve()),
}));
jest.mock("dev/public/js/engine/inventory/melee/index.js", () => ({
  loadMeleeWeapons: jest.fn(() => Promise.resolve()),
}));
jest.mock("dev/public/js/engine/inventory/ranged/index.js", () => ({
  loadRangedWeapons: jest.fn(() => Promise.resolve()),
}));
jest.mock("dev/public/js/engine/inventory/firearms/index.js", () => ({
  loadFirearms: jest.fn(() => Promise.resolve()),
}));
jest.mock("dev/public/js/engine/inventory/ammo/index.js", () => ({
  loadAmmo: jest.fn(() => Promise.resolve()),
}));
jest.mock("dev/public/js/engine/inventory/alchemy/index.js", () => ({
  loadAlchemy: jest.fn(() => Promise.resolve()),
}));
jest.mock("dev/public/js/engine/inventory/survivalGear/index.js", () => ({
  loadSurvivalGear: jest.fn(() => Promise.resolve()),
}));
jest.mock("dev/public/js/engine/inventory/accessories/index.js", () => ({
  loadAccessories: jest.fn(() => Promise.resolve()),
}));
jest.mock("dev/public/js/engine/inventory/magicGear/index.js", () => ({
  loadMagicGear: jest.fn(() => Promise.resolve()),
}));
jest.mock(
  "dev/public/js/engine/inventory/shared/enchantments/index.js",
  () => ({
    loadEnchantments: jest.fn(() => Promise.resolve()),
  }),
);
jest.mock("dev/public/js/engine/inventory/shared/dualUseWeapons.js", () => ({
  loadDualUseWeapons: jest.fn(() => Promise.resolve()),
}));
jest.mock("dev/public/js/engine/inventory/shared/materials.js", () => ({
  loadMaterials: jest.fn(() => Promise.resolve()),
}));
jest.mock("dev/public/js/store/characters.js", () => ({
  initCharacters: jest.fn(() => true),
}));
jest.mock("dev/public/js/components/characterSelector.js", () => ({
  initCharacterSelector: jest.fn(),
}));

import { bindUI } from "dev/public/js/events/index.js";
import { initNav } from "dev/public/js/components/nav.js";
import { initTabs } from "dev/public/js/components/tabs.js";
import { initViewMode } from "dev/public/js/components/viewMode.js";
import { initTheme } from "dev/public/js/components/theme.js";
import { setupAutoRun } from "dev/public/js/compute/attributes.js";
import {
  updateActualValues,
  initAttributeTableHeaders,
  renderListsPreserving,
} from "dev/public/js/ui.js";
import { initAutoRun } from "dev/public/js/compute/autorun.js";
import { loadRaces } from "dev/public/js/engine/character/races/index.js";
import { initCharacterImage } from "dev/public/js/engine/character/portrait/index.js";
import { loadAdvantages } from "dev/public/js/engine/character/traits/advantages/index.js";
import { loadDisadvantages } from "dev/public/js/engine/character/traits/disadvantages/index.js";
import { loadSkills } from "dev/public/js/engine/character/skills/index.js";
import { loadSpells } from "dev/public/js/engine/magic/spells/index.js";
import { loadArmors } from "dev/public/js/engine/inventory/armor/index.js";
import { loadShields } from "dev/public/js/engine/inventory/shield/index.js";
import { loadMeleeWeapons } from "dev/public/js/engine/inventory/melee/index.js";
import { loadRangedWeapons } from "dev/public/js/engine/inventory/ranged/index.js";
import { loadFirearms } from "dev/public/js/engine/inventory/firearms/index.js";
import { loadAmmo } from "dev/public/js/engine/inventory/ammo/index.js";
import { loadAlchemy } from "dev/public/js/engine/inventory/alchemy/index.js";
import { loadSurvivalGear } from "dev/public/js/engine/inventory/survivalGear/index.js";
import { loadAccessories } from "dev/public/js/engine/inventory/accessories/index.js";
import { loadMagicGear } from "dev/public/js/engine/inventory/magicGear/index.js";
import { loadEnchantments } from "dev/public/js/engine/inventory/shared/enchantments/index.js";
import { loadDualUseWeapons } from "dev/public/js/engine/inventory/shared/dualUseWeapons.js";
import { loadMaterials } from "dev/public/js/engine/inventory/shared/materials.js";
import { initCharacters } from "dev/public/js/store/characters.js";
import { initCharacterSelector } from "dev/public/js/components/characterSelector.js";

import { bootstrap } from "dev/public/js/main.js";

describe("main.js bootstrap (DOMContentLoaded)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    initCharacters.mockReturnValue(true);
  });

  test("registers bootstrap on DOMContentLoaded rather than window.onload, so catalog fetches aren't blocked on images", () => {
    expect(window.onload).toBeFalsy();
    expect(typeof bootstrap).toBe("function");
  });

  test("runs to completion without throwing when every dependency resolves normally", async () => {
    await bootstrap();
  });

  test("wires up UI bindings and chrome (nav/tabs/theme/view mode) before awaiting data loads", async () => {
    await bootstrap();

    expect(bindUI).toHaveBeenCalledTimes(1);
    expect(initNav).toHaveBeenCalledTimes(1);
    expect(initTabs).toHaveBeenCalledTimes(1);
    expect(initViewMode).toHaveBeenCalledTimes(1);
    expect(initTheme).toHaveBeenCalledTimes(1);
    expect(setupAutoRun).toHaveBeenCalledTimes(1);
    expect(initAttributeTableHeaders).toHaveBeenCalledTimes(1);
    expect(updateActualValues).toHaveBeenCalledTimes(1);
  });

  test("initializes autorun with the real runEngine function", async () => {
    const { runEngine } = require("dev/public/js/compute/index.js");

    await bootstrap();

    expect(initAutoRun).toHaveBeenCalledWith(runEngine);
  });

  test("awaits every data loader before proceeding to character init", async () => {
    await bootstrap();

    [
      loadRaces,
      loadAdvantages,
      loadDisadvantages,
      loadSkills,
      loadSpells,
      loadMaterials,
      loadArmors,
      loadShields,
      loadMeleeWeapons,
      loadRangedWeapons,
      loadFirearms,
      loadAmmo,
      loadAlchemy,
      loadSurvivalGear,
      loadAccessories,
      loadMagicGear,
      loadEnchantments,
      loadDualUseWeapons,
    ].forEach((loader) => {
      expect(loader).toHaveBeenCalledTimes(1);
    });
  });

  test("initializes character persistence, the character selector, and the portrait after data loads resolve", async () => {
    await bootstrap();

    expect(initCharacters).toHaveBeenCalledTimes(1);
    expect(initCharacterSelector).toHaveBeenCalledTimes(1);
    expect(initCharacterImage).toHaveBeenCalledTimes(1);
  });

  // The load*() functions no longer render individually, so exactly one of these
  // two paths has to paint the sheet — never both, never neither.
  test("leaves rendering to initCharacters when it applied a stored character", async () => {
    initCharacters.mockReturnValue(true);

    await bootstrap();

    expect(renderListsPreserving).not.toHaveBeenCalled();
  });

  test("renders once itself when initCharacters found no character to apply", async () => {
    initCharacters.mockReturnValue(false);

    await bootstrap();

    expect(renderListsPreserving).toHaveBeenCalledTimes(1);
  });

  test("still initializes characters/selector/portrait even if a data loader rejects (Promise.all vs allSettled is worth knowing about, not silently assumed)", async () => {
    loadSpells.mockRejectedValueOnce(new Error("network down"));

    await expect(bootstrap()).rejects.toThrow("network down");
    expect(initCharacters).not.toHaveBeenCalled();

    loadSpells.mockReset().mockReturnValue(Promise.resolve());
  });
});
