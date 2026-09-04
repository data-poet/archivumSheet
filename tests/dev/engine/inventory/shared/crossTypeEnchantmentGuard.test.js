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
jest.mock("dev/public/js/engine/inventory/melee/model.js", () => ({
  removeMeleeEnchantment: jest.fn(),
  findMeleeByInstanceId: jest.fn(),
  // Unused by this test but required since events.js imports them.
  equipMelee: jest.fn(),
  addStoredMelee: jest.fn(),
  addEquippedMelee: jest.fn(),
  moveMelee: jest.fn(),
  removeMelee: jest.fn(),
  saveMeleeCustomFields: jest.fn(),
  addMeleeEnchantment: jest.fn(),
  updateMeleeEnchantment: jest.fn(),
}));
jest.mock("dev/public/js/engine/inventory/melee/render.js", () => ({
  renderEquippedMelee: jest.fn(),
  renderStoredMelee: jest.fn(),
}));
jest.mock("dev/public/js/engine/inventory/ranged/model.js", () => ({
  removeRangedEnchantment: jest.fn(),
  findRangedByInstanceId: jest.fn(),
  // Unused by this test but required since events.js imports them.
  equipRanged: jest.fn(),
  addStoredRanged: jest.fn(),
  addEquippedRanged: jest.fn(),
  moveRanged: jest.fn(),
  removeRanged: jest.fn(),
  saveRangedCustomFields: jest.fn(),
  addRangedEnchantment: jest.fn(),
  updateRangedEnchantment: jest.fn(),
}));
jest.mock("dev/public/js/engine/inventory/ranged/render.js", () => ({
  renderEquippedRanged: jest.fn(),
  renderStoredRanged: jest.fn(),
}));
jest.mock("dev/public/js/engine/inventory/firearms/model.js", () => ({
  removeFirearmEnchantment: jest.fn(),
  findFirearmByInstanceId: jest.fn(),
  // Unused by this test but required since events.js imports them.
  equipFirearm: jest.fn(),
  moveFirearm: jest.fn(),
  removeFirearm: jest.fn(),
  reloadFirearm: jest.fn(),
  computeFinalMagazineSize: jest.fn(),
  addEquippedFirearm: jest.fn(),
  addStoredFirearm: jest.fn(),
  saveFirearmCustomFields: jest.fn(),
  addFirearmEnchantment: jest.fn(),
  updateFirearmEnchantment: jest.fn(),
}));
jest.mock("dev/public/js/engine/inventory/firearms/render.js", () => ({
  renderEquippedFirearms: jest.fn(),
  renderStoredFirearms: jest.fn(),
}));

import * as accessoryModel from "dev/public/js/engine/inventory/accessories/model.js";
import * as magicGearModel from "dev/public/js/engine/inventory/magicGear/model.js";
import * as shieldModel from "dev/public/js/engine/inventory/shield/model.js";
import * as meleeModel from "dev/public/js/engine/inventory/melee/model.js";
import * as rangedModel from "dev/public/js/engine/inventory/ranged/model.js";
import * as firearmsModel from "dev/public/js/engine/inventory/firearms/model.js";
import { handleAccessoryClick } from "dev/public/js/engine/inventory/accessories/events.js";
import { handleMagicGearClick } from "dev/public/js/engine/inventory/magicGear/events.js";
import { handleShieldClick } from "dev/public/js/engine/inventory/shield/events.js";
import { handleMeleeClick } from "dev/public/js/engine/inventory/melee/events.js";
import { handleRangedClick } from "dev/public/js/engine/inventory/ranged/events.js";
import { handleFirearmClick } from "dev/public/js/engine/inventory/firearms/events.js";
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
  meleeModel.findMeleeByInstanceId.mockImplementation((id) =>
    id === "MELEE-1" ? { instance_id: "MELEE-1" } : undefined,
  );
  rangedModel.findRangedByInstanceId.mockImplementation((id) =>
    id === "RANGED-1" ? { instance_id: "RANGED-1" } : undefined,
  );
  firearmsModel.findFirearmByInstanceId.mockImplementation((id) =>
    id === "FIREARM-1" ? { instance_id: "FIREARM-1" } : undefined,
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

  test("melee's handler acts on its own enchantment entry", () => {
    const result = handleMeleeClick(
      enchantmentRemoveButton("MELEE-1", "ENTRY-4"),
    );
    jest.advanceTimersToNextFrame();

    expect(result).toBe(true);
    expect(meleeModel.removeMeleeEnchantment).toHaveBeenCalledWith(
      "MELEE-1",
      "ENTRY-4",
    );
  });

  test("melee's handler refuses an accessory, magicGear, or shield instanceId — no cross-type mutation", () => {
    const accResult = handleMeleeClick(
      enchantmentRemoveButton("ACC-1", "ENTRY-1"),
    );
    const mgResult = handleMeleeClick(
      enchantmentRemoveButton("MG-1", "ENTRY-2"),
    );
    const shieldResult = handleMeleeClick(
      enchantmentRemoveButton("SHIELD-1", "ENTRY-3"),
    );
    jest.advanceTimersToNextFrame();

    expect(accResult).toBe(false);
    expect(mgResult).toBe(false);
    expect(shieldResult).toBe(false);
    expect(meleeModel.removeMeleeEnchantment).not.toHaveBeenCalled();
  });

  test("other handlers refuse a melee instanceId — no cross-type mutation", () => {
    const accResult = handleAccessoryClick(
      enchantmentRemoveButton("MELEE-1", "ENTRY-4"),
    );
    const mgResult = handleMagicGearClick(
      enchantmentRemoveButton("MELEE-1", "ENTRY-4"),
    );
    const shieldResult = handleShieldClick(
      enchantmentRemoveButton("MELEE-1", "ENTRY-4"),
    );
    jest.advanceTimersToNextFrame();

    expect(accResult).toBe(false);
    expect(mgResult).toBe(false);
    expect(shieldResult).toBe(false);
    expect(accessoryModel.removeAccessoryEnchantment).not.toHaveBeenCalled();
    expect(magicGearModel.removeMagicGearEnchantment).not.toHaveBeenCalled();
    expect(shieldModel.removeShieldEnchantment).not.toHaveBeenCalled();
  });

  test("ranged's handler acts on its own enchantment entry", () => {
    const result = handleRangedClick(
      enchantmentRemoveButton("RANGED-1", "ENTRY-5"),
    );
    jest.advanceTimersToNextFrame();

    expect(result).toBe(true);
    expect(rangedModel.removeRangedEnchantment).toHaveBeenCalledWith(
      "RANGED-1",
      "ENTRY-5",
    );
  });

  test("ranged's handler refuses an accessory, magicGear, shield, or melee instanceId — no cross-type mutation", () => {
    const accResult = handleRangedClick(
      enchantmentRemoveButton("ACC-1", "ENTRY-1"),
    );
    const mgResult = handleRangedClick(
      enchantmentRemoveButton("MG-1", "ENTRY-2"),
    );
    const shieldResult = handleRangedClick(
      enchantmentRemoveButton("SHIELD-1", "ENTRY-3"),
    );
    const meleeResult = handleRangedClick(
      enchantmentRemoveButton("MELEE-1", "ENTRY-4"),
    );
    jest.advanceTimersToNextFrame();

    expect(accResult).toBe(false);
    expect(mgResult).toBe(false);
    expect(shieldResult).toBe(false);
    expect(meleeResult).toBe(false);
    expect(rangedModel.removeRangedEnchantment).not.toHaveBeenCalled();
  });

  test("other handlers refuse a ranged instanceId — no cross-type mutation", () => {
    const accResult = handleAccessoryClick(
      enchantmentRemoveButton("RANGED-1", "ENTRY-5"),
    );
    const mgResult = handleMagicGearClick(
      enchantmentRemoveButton("RANGED-1", "ENTRY-5"),
    );
    const shieldResult = handleShieldClick(
      enchantmentRemoveButton("RANGED-1", "ENTRY-5"),
    );
    const meleeResult = handleMeleeClick(
      enchantmentRemoveButton("RANGED-1", "ENTRY-5"),
    );
    jest.advanceTimersToNextFrame();

    expect(accResult).toBe(false);
    expect(mgResult).toBe(false);
    expect(shieldResult).toBe(false);
    expect(meleeResult).toBe(false);
    expect(accessoryModel.removeAccessoryEnchantment).not.toHaveBeenCalled();
    expect(magicGearModel.removeMagicGearEnchantment).not.toHaveBeenCalled();
    expect(shieldModel.removeShieldEnchantment).not.toHaveBeenCalled();
    expect(meleeModel.removeMeleeEnchantment).not.toHaveBeenCalled();
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

  test("firearms' handler acts on its own enchantment entry", () => {
    const result = handleFirearmClick(
      enchantmentRemoveButton("FIREARM-1", "ENTRY-6"),
    );
    jest.advanceTimersToNextFrame();

    expect(result).toBe(true);
    expect(firearmsModel.removeFirearmEnchantment).toHaveBeenCalledWith(
      "FIREARM-1",
      "ENTRY-6",
    );
  });

  test("firearms' handler refuses an accessory, magicGear, shield, melee, or ranged instanceId — no cross-type mutation", () => {
    const accResult = handleFirearmClick(
      enchantmentRemoveButton("ACC-1", "ENTRY-1"),
    );
    const mgResult = handleFirearmClick(
      enchantmentRemoveButton("MG-1", "ENTRY-2"),
    );
    const shieldResult = handleFirearmClick(
      enchantmentRemoveButton("SHIELD-1", "ENTRY-3"),
    );
    const meleeResult = handleFirearmClick(
      enchantmentRemoveButton("MELEE-1", "ENTRY-4"),
    );
    const rangedResult = handleFirearmClick(
      enchantmentRemoveButton("RANGED-1", "ENTRY-5"),
    );
    jest.advanceTimersToNextFrame();

    expect(accResult).toBe(false);
    expect(mgResult).toBe(false);
    expect(shieldResult).toBe(false);
    expect(meleeResult).toBe(false);
    expect(rangedResult).toBe(false);
    expect(firearmsModel.removeFirearmEnchantment).not.toHaveBeenCalled();
  });

  test("other handlers refuse a firearms instanceId — no cross-type mutation", () => {
    const accResult = handleAccessoryClick(
      enchantmentRemoveButton("FIREARM-1", "ENTRY-6"),
    );
    const mgResult = handleMagicGearClick(
      enchantmentRemoveButton("FIREARM-1", "ENTRY-6"),
    );
    const shieldResult = handleShieldClick(
      enchantmentRemoveButton("FIREARM-1", "ENTRY-6"),
    );
    const meleeResult = handleMeleeClick(
      enchantmentRemoveButton("FIREARM-1", "ENTRY-6"),
    );
    const rangedResult = handleRangedClick(
      enchantmentRemoveButton("FIREARM-1", "ENTRY-6"),
    );
    jest.advanceTimersToNextFrame();

    expect(accResult).toBe(false);
    expect(mgResult).toBe(false);
    expect(shieldResult).toBe(false);
    expect(meleeResult).toBe(false);
    expect(rangedResult).toBe(false);
    expect(accessoryModel.removeAccessoryEnchantment).not.toHaveBeenCalled();
    expect(magicGearModel.removeMagicGearEnchantment).not.toHaveBeenCalled();
    expect(shieldModel.removeShieldEnchantment).not.toHaveBeenCalled();
    expect(meleeModel.removeMeleeEnchantment).not.toHaveBeenCalled();
    expect(rangedModel.removeRangedEnchantment).not.toHaveBeenCalled();
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
    const meleeResult = handleMeleeClick(
      enchantmentRemoveButton("GHOST", "SAME-ENTRY-ID"),
    );
    const rangedResult = handleRangedClick(
      enchantmentRemoveButton("GHOST", "SAME-ENTRY-ID"),
    );
    const firearmsResult = handleFirearmClick(
      enchantmentRemoveButton("GHOST", "SAME-ENTRY-ID"),
    );
    jest.advanceTimersToNextFrame();

    expect(accessoryResult).toBe(false);
    expect(magicGearResult).toBe(false);
    expect(shieldResult).toBe(false);
    expect(meleeResult).toBe(false);
    expect(rangedResult).toBe(false);
    expect(firearmsResult).toBe(false);
    expect(accessoryModel.removeAccessoryEnchantment).not.toHaveBeenCalled();
    expect(magicGearModel.removeMagicGearEnchantment).not.toHaveBeenCalled();
    expect(shieldModel.removeShieldEnchantment).not.toHaveBeenCalled();
    expect(meleeModel.removeMeleeEnchantment).not.toHaveBeenCalled();
    expect(rangedModel.removeRangedEnchantment).not.toHaveBeenCalled();
    expect(firearmsModel.removeFirearmEnchantment).not.toHaveBeenCalled();
  });
});
