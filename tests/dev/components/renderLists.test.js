jest.mock("dev/public/js/engine/character/traits/render.js", () => ({
  renderAdvantages: jest.fn(),
  renderDisadvantages: jest.fn(),
}));
jest.mock("dev/public/js/engine/character/skills/render.js", () => ({
  renderSkills: jest.fn(),
}));
jest.mock("dev/public/js/engine/magic/spells/render.js", () => ({
  renderSpells: jest.fn(),
}));
jest.mock("dev/public/js/engine/inventory/armor/render.js", () => ({
  renderArmorSlots: jest.fn(),
  renderStoredArmors: jest.fn(),
}));
jest.mock("dev/public/js/engine/inventory/shield/render.js", () => ({
  renderEquippedShield: jest.fn(),
  renderStoredShields: jest.fn(),
}));
jest.mock("dev/public/js/engine/inventory/melee/render.js", () => ({
  renderEquippedMelee: jest.fn(),
  renderStoredMelee: jest.fn(),
}));
jest.mock("dev/public/js/engine/inventory/ranged/render.js", () => ({
  renderEquippedRanged: jest.fn(),
  renderStoredRanged: jest.fn(),
}));
jest.mock("dev/public/js/engine/inventory/firearms/render.js", () => ({
  renderEquippedFirearms: jest.fn(),
  renderStoredFirearms: jest.fn(),
}));
jest.mock("dev/public/js/engine/inventory/ammo/render.js", () => ({
  renderAmmoContainers: jest.fn(),
  renderLooseAmmo: jest.fn(),
}));
jest.mock("dev/public/js/engine/inventory/alchemy/render.js", () => ({
  renderAlchemy: jest.fn(),
}));
jest.mock("dev/public/js/engine/inventory/survivalGear/render.js", () => ({
  renderSurvivalGear: jest.fn(),
}));
jest.mock("dev/public/js/engine/inventory/accessories/render.js", () => ({
  renderEquippedAccessories: jest.fn(),
  renderStoredAccessories: jest.fn(),
}));
jest.mock("dev/public/js/engine/inventory/magicGear/render.js", () => ({
  renderEquippedMagicGear: jest.fn(),
  renderStoredMagicGear: jest.fn(),
}));
jest.mock("dev/public/js/engine/inventory/customInventory/render.js", () => ({
  renderCustomInventory: jest.fn(),
}));
jest.mock("dev/public/js/engine/inventory/coinPurse/render.js", () => ({
  renderCoinPurse: jest.fn(),
}));
jest.mock("dev/public/js/shared/openState.js", () => ({
  snapshotAll: jest.fn(),
  restoreAll: jest.fn(),
}));

import {
  renderAdvantages,
  renderDisadvantages,
} from "dev/public/js/engine/character/traits/render.js";
import { renderSkills } from "dev/public/js/engine/character/skills/render.js";
import { renderSpells } from "dev/public/js/engine/magic/spells/render.js";
import {
  renderArmorSlots,
  renderStoredArmors,
} from "dev/public/js/engine/inventory/armor/render.js";
import {
  renderEquippedShield,
  renderStoredShields,
} from "dev/public/js/engine/inventory/shield/render.js";
import {
  renderEquippedMelee,
  renderStoredMelee,
} from "dev/public/js/engine/inventory/melee/render.js";
import {
  renderEquippedRanged,
  renderStoredRanged,
} from "dev/public/js/engine/inventory/ranged/render.js";
import {
  renderEquippedFirearms,
  renderStoredFirearms,
} from "dev/public/js/engine/inventory/firearms/render.js";
import {
  renderAmmoContainers,
  renderLooseAmmo,
} from "dev/public/js/engine/inventory/ammo/render.js";
import { renderAlchemy } from "dev/public/js/engine/inventory/alchemy/render.js";
import { renderSurvivalGear } from "dev/public/js/engine/inventory/survivalGear/render.js";
import {
  renderEquippedAccessories,
  renderStoredAccessories,
} from "dev/public/js/engine/inventory/accessories/render.js";
import {
  renderEquippedMagicGear,
  renderStoredMagicGear,
} from "dev/public/js/engine/inventory/magicGear/render.js";
import { renderCustomInventory } from "dev/public/js/engine/inventory/customInventory/render.js";
import { renderCoinPurse } from "dev/public/js/engine/inventory/coinPurse/render.js";
import { snapshotAll, restoreAll } from "dev/public/js/shared/openState.js";
import {
  renderLists,
  renderListsPreserving,
} from "dev/public/js/components/renderLists.js";

// Order matters: this list mirrors the exact call order in renderLists()'s source.
const ALL_RENDER_FNS = [
  renderAdvantages,
  renderDisadvantages,
  renderSkills,
  renderSpells,
  renderArmorSlots,
  renderStoredArmors,
  renderEquippedShield,
  renderStoredShields,
  renderEquippedMelee,
  renderStoredMelee,
  renderEquippedRanged,
  renderStoredRanged,
  renderEquippedFirearms,
  renderStoredFirearms,
  renderAmmoContainers,
  renderLooseAmmo,
  renderAlchemy,
  renderSurvivalGear,
  renderEquippedAccessories,
  renderStoredAccessories,
  renderEquippedMagicGear,
  renderStoredMagicGear,
  renderCoinPurse,
  renderCustomInventory,
];

const selected = { fake: "selected" };
const data = { fake: "data" };
const sheet = { fake: "sheet" };

beforeEach(() => {
  jest.clearAllMocks();
});

describe("renderLists", () => {
  test("calls every managed render function exactly once, forwarding selected/data/sheet unchanged", () => {
    renderLists(selected, data, sheet);

    ALL_RENDER_FNS.forEach((fn) => {
      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith(selected, data, sheet);
    });
  });

  test("calls them in the exact order listed in the source (character/magic first, then equipment, coin purse and custom inventory last)", () => {
    const callOrder = [];
    ALL_RENDER_FNS.forEach((fn) =>
      fn.mockImplementation((...args) => callOrder.push(fn)),
    );

    renderLists(selected, data, sheet);

    expect(callOrder).toEqual(ALL_RENDER_FNS);
  });

  test("does not call snapshotAll/restoreAll on its own (that's renderListsPreserving's job)", () => {
    renderLists(selected, data, sheet);
    expect(snapshotAll).not.toHaveBeenCalled();
    expect(restoreAll).not.toHaveBeenCalled();
  });

  test("forwards a missing sheet argument through as undefined rather than substituting a default", () => {
    renderLists(selected, data);
    expect(renderAdvantages).toHaveBeenCalledWith(selected, data, undefined);
  });
});

describe("renderListsPreserving", () => {
  test("snapshots before rendering and restores with that exact snapshot afterward, in order", () => {
    const fakeSnapshot = { some: "snapshot" };
    snapshotAll.mockReturnValue(fakeSnapshot);
    const callOrder = [];
    snapshotAll.mockImplementation(() => {
      callOrder.push("snapshot");
      return fakeSnapshot;
    });
    renderAdvantages.mockImplementation(() => callOrder.push("render"));
    restoreAll.mockImplementation(() => callOrder.push("restore"));

    renderListsPreserving(selected, data, sheet);

    expect(callOrder).toEqual(["snapshot", "render", "restore"]);
    expect(restoreAll).toHaveBeenCalledWith(fakeSnapshot);
  });

  test("still renders every managed section, same as calling renderLists directly", () => {
    renderListsPreserving(selected, data, sheet);
    ALL_RENDER_FNS.forEach((fn) => {
      expect(fn).toHaveBeenCalledWith(selected, data, sheet);
    });
  });

  test("restores even when a snapshot came back empty/falsy, rather than skipping restore", () => {
    snapshotAll.mockReturnValue(null);
    renderListsPreserving(selected, data, sheet);
    expect(restoreAll).toHaveBeenCalledWith(null);
  });
});
