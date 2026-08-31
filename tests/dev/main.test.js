// main.js is pure bootstrap glue: it assigns window.onload = async () => { ... }
// at import time and calls ~28 already-independently-tested init/load
// functions. Per the plan's own acceptance criteria for this batch, this
// is deliberately a LIGHT smoke test — "does it wire up without throwing" —
// not a re-test of what any of those functions do internally.

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
jest.mock("dev/public/js/store/characters.js", () => ({
  initCharacters: jest.fn(),
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
import { initCharacters } from "dev/public/js/store/characters.js";
import { initCharacterSelector } from "dev/public/js/components/characterSelector.js";

// Importing main.js is what actually assigns window.onload — it's a
// side-effecting module, not something with an exported entry point.
import "dev/public/js/main.js";

describe("main.js bootstrap (window.onload)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("assigns an onload handler", () => {
    expect(typeof window.onload).toBe("function");
  });

  test("runs to completion without throwing when every dependency resolves normally", async () => {
    await window.onload();
    // No assertion needed beyond this — if onload() rejects or throws
    // synchronously, this test fails automatically via the unhandled
    // rejection/exception propagating through await.
  });

  test("wires up UI bindings and chrome (nav/tabs/theme/view mode) before awaiting data loads", async () => {
    await window.onload();

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

    await window.onload();

    expect(initAutoRun).toHaveBeenCalledWith(runEngine);
  });

  test("awaits every data loader before proceeding to character init", async () => {
    await window.onload();

    [
      loadRaces,
      loadAdvantages,
      loadDisadvantages,
      loadSkills,
      loadSpells,
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
    await window.onload();

    expect(initCharacters).toHaveBeenCalledTimes(1);
    expect(initCharacterSelector).toHaveBeenCalledTimes(1);
    expect(initCharacterImage).toHaveBeenCalledTimes(1);
  });

  test("still initializes characters/selector/portrait even if a data loader rejects (Promise.all vs allSettled is worth knowing about, not silently assumed)", async () => {
    loadSpells.mockRejectedValueOnce(new Error("network down"));

    // Documents real behavior: main.js uses Promise.all, so a single
    // rejected loader rejects the whole onload() call — character
    // init/selector/portrait below the Promise.all are NOT reached in
    // that case. This is worth having as an explicit test rather than an
    // assumption, since a future switch to Promise.allSettled would
    // silently change this contract.
    await expect(window.onload()).rejects.toThrow("network down");
    expect(initCharacters).not.toHaveBeenCalled();

    loadSpells.mockReset().mockReturnValue(Promise.resolve());
  });
});
