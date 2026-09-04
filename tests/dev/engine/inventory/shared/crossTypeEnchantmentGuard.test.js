// This is the regression test for the collision risk documented in the
// project's architecture notes: accessories, magicGear, and shield all
// render generic .enchantment-* buttons (from the shared
// enchantments/render.js), and all three wire them through
// createEnchantmentsHandlers' ownsFormKey guard. Nothing in the DOM
// distinguishes "this button belongs to an accessory" from "this button
// belongs to a shield" — the ONLY thing preventing one type's handler from
// acting on another type's instanceId is each handler's own
// findByInstanceId/getItems ownership check. This test proves that guard
// actually holds when all three handlers are live at once, not just in
// isolation (each type's own events.test.js mocks the OTHER types out of
// existence, which wouldn't catch a real collision).
//
// Note: armor also renders the same shared .enchantment-* buttons and
// isn't covered by this file — a pre-existing gap from before shield was
// added, not something introduced here. Worth folding armor in as a
// follow-up.
jest.mock("dev/public/js/engine/inventory/accessories/model.js", () => ({
  removeAccessoryEnchantment: jest.fn(),
  findAccessoryByInstanceId: jest.fn(),
  // Unused by this test but required since events.js imports them.
  addEquippedAccessory: jest.fn(),
  addStoredAccessory: jest.fn(),
  equipAccessory: jest.fn(),
  moveAccessory: jest.fn(),
  removeAccessory: jest.fn(),
  updateAccessoryPrice: jest.fn(),
  saveAccessoryCustomFields: jest.fn(),
  updateAccessoryEquipOptionAvailability: jest.fn(),
  addAccessoryEnchantment: jest.fn(),
  updateAccessoryEnchantment: jest.fn(),
}));
jest.mock("dev/public/js/engine/inventory/accessories/render.js", () => ({
  renderEquippedAccessories: jest.fn(),
  renderStoredAccessories: jest.fn(),
}));
jest.mock("dev/public/js/engine/inventory/magicGear/model.js", () => ({
  removeMagicGearEnchantment: jest.fn(),
  findMagicGearByInstanceId: jest.fn(),
  addEquippedMagicGear: jest.fn(),
  addStoredMagicGear: jest.fn(),
  equipMagicGear: jest.fn(),
  moveMagicGear: jest.fn(),
  removeMagicGear: jest.fn(),
  saveMagicGearCustomFields: jest.fn(),
  updateMagicGearEquipOptionAvailability: jest.fn(),
  addMagicGearEnchantment: jest.fn(),
  updateMagicGearEnchantment: jest.fn(),
}));
jest.mock("dev/public/js/engine/inventory/magicGear/render.js", () => ({
  renderEquippedMagicGear: jest.fn(),
  renderStoredMagicGear: jest.fn(),
}));
jest.mock("dev/public/js/engine/inventory/shield/model.js", () => ({
  removeShieldEnchantment: jest.fn(),
  findShieldByInstanceId: jest.fn(),
  equipShield: jest.fn(),
  addStoredShield: jest.fn(),
  moveShield: jest.fn(),
  removeShield: jest.fn(),
  saveShieldCustomFields: jest.fn(),
  addShieldEnchantment: jest.fn(),
  updateShieldEnchantment: jest.fn(),
}));
jest.mock("dev/public/js/engine/inventory/shield/render.js", () => ({
  renderEquippedShield: jest.fn(),
  renderStoredShields: jest.fn(),
}));

import * as accessoryModel from "dev/public/js/engine/inventory/accessories/model.js";
import * as magicGearModel from "dev/public/js/engine/inventory/magicGear/model.js";
import * as shieldModel from "dev/public/js/engine/inventory/shield/model.js";
import { handleAccessoryClick } from "dev/public/js/engine/inventory/accessories/events.js";
import { handleMagicGearClick } from "dev/public/js/engine/inventory/magicGear/events.js";
import { handleShieldClick } from "dev/public/js/engine/inventory/shield/events.js";
import { resetDOM } from "tests/dev/helpers/domFixture.js";
import { resetState } from "tests/dev/helpers/stateFixture.js";

function enchantmentRemoveButton(instanceId, entryInstanceId) {
  const target = document.createElement("button");
  target.classList.add("enchantment-remove-btn");
  target.dataset.instanceId = instanceId;
  target.dataset.entryInstanceId = entryInstanceId;
  return { target };
}

beforeEach(() => {
  resetDOM();
  resetState();
  jest.clearAllMocks();
  jest.useFakeTimers();

  // Each type only recognizes its OWN items — this is the realistic setup:
  // an accessory instanceId is genuinely unknown to magicGear's lookup,
  // and vice versa.
  accessoryModel.findAccessoryByInstanceId.mockImplementation((id) =>
    id === "ACC-1" ? { instance_id: "ACC-1" } : undefined,
  );
  magicGearModel.findMagicGearByInstanceId.mockImplementation((id) =>
    id === "MG-1" ? { instance_id: "MG-1" } : undefined,
  );
  shieldModel.findShieldByInstanceId.mockImplementation((id) =>
    id === "SHIELD-1" ? { instance_id: "SHIELD-1" } : undefined,
  );
});

afterEach(() => {
  jest.useRealTimers();
});

describe("_ownsEnchantmentFormKey cross-type collision guard", () => {
  test("accessories' handler acts on an accessory's own enchantment entry", () => {
    const result = handleAccessoryClick(
      enchantmentRemoveButton("ACC-1", "ENTRY-1"),
    );
    jest.advanceTimersToNextFrame();

    expect(result).toBe(true);
    expect(accessoryModel.removeAccessoryEnchantment).toHaveBeenCalledWith(
      "ACC-1",
      "ENTRY-1",
    );
  });

  test("magicGear's handler acts on its own enchantment entry", () => {
    const result = handleMagicGearClick(
      enchantmentRemoveButton("MG-1", "ENTRY-2"),
    );
    jest.advanceTimersToNextFrame();

    expect(result).toBe(true);
    expect(magicGearModel.removeMagicGearEnchantment).toHaveBeenCalledWith(
      "MG-1",
      "ENTRY-2",
    );
  });

  test("shield's handler acts on its own enchantment entry", () => {
    const result = handleShieldClick(
      enchantmentRemoveButton("SHIELD-1", "ENTRY-3"),
    );
    jest.advanceTimersToNextFrame();

    expect(result).toBe(true);
    expect(shieldModel.removeShieldEnchantment).toHaveBeenCalledWith(
      "SHIELD-1",
      "ENTRY-3",
    );
  });

  test("accessories' handler refuses a magicGear instanceId — no cross-type mutation", () => {
    const result = handleAccessoryClick(
      enchantmentRemoveButton("MG-1", "ENTRY-2"),
    );
    jest.advanceTimersToNextFrame();

    expect(result).toBe(false);
    expect(accessoryModel.removeAccessoryEnchantment).not.toHaveBeenCalled();
  });

  test("magicGear's handler refuses an accessory instanceId — no cross-type mutation", () => {
    const result = handleMagicGearClick(
      enchantmentRemoveButton("ACC-1", "ENTRY-1"),
    );
    jest.advanceTimersToNextFrame();

    expect(result).toBe(false);
    expect(magicGearModel.removeMagicGearEnchantment).not.toHaveBeenCalled();
  });

  test("shield's handler refuses an accessory or magicGear instanceId — no cross-type mutation", () => {
    const accResult = handleShieldClick(
      enchantmentRemoveButton("ACC-1", "ENTRY-1"),
    );
    const mgResult = handleShieldClick(
      enchantmentRemoveButton("MG-1", "ENTRY-2"),
    );
    jest.advanceTimersToNextFrame();

    expect(accResult).toBe(false);
    expect(mgResult).toBe(false);
    expect(shieldModel.removeShieldEnchantment).not.toHaveBeenCalled();
  });

  test("accessories' and magicGear's handlers refuse a shield instanceId — no cross-type mutation", () => {
    const accResult = handleAccessoryClick(
      enchantmentRemoveButton("SHIELD-1", "ENTRY-3"),
    );
    const mgResult = handleMagicGearClick(
      enchantmentRemoveButton("SHIELD-1", "ENTRY-3"),
    );
    jest.advanceTimersToNextFrame();

    expect(accResult).toBe(false);
    expect(mgResult).toBe(false);
    expect(accessoryModel.removeAccessoryEnchantment).not.toHaveBeenCalled();
    expect(magicGearModel.removeMagicGearEnchantment).not.toHaveBeenCalled();
  });

  test("neither handler acts on an entryInstanceId belonging to the other type", () => {
    // Simulates the more subtle collision: the outer instanceId is unknown
    // to both (e.g. a stale/mismatched dataset), but an entryInstanceId
    // happens to coincide. Neither should fire.
    const accessoryResult = handleAccessoryClick(
      enchantmentRemoveButton("GHOST", "SAME-ENTRY-ID"),
    );
    const magicGearResult = handleMagicGearClick(
      enchantmentRemoveButton("GHOST", "SAME-ENTRY-ID"),
    );
    const shieldResult = handleShieldClick(
      enchantmentRemoveButton("GHOST", "SAME-ENTRY-ID"),
    );
    jest.advanceTimersToNextFrame();

    expect(accessoryResult).toBe(false);
    expect(magicGearResult).toBe(false);
    expect(shieldResult).toBe(false);
    expect(accessoryModel.removeAccessoryEnchantment).not.toHaveBeenCalled();
    expect(magicGearModel.removeMagicGearEnchantment).not.toHaveBeenCalled();
    expect(shieldModel.removeShieldEnchantment).not.toHaveBeenCalled();
  });
});
