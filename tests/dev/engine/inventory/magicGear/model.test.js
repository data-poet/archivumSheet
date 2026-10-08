jest.mock("dev/public/js/ui.js", () =>
  require("tests/dev/helpers/mocks/uiMock.js"),
);
jest.mock("dev/public/js/compute/autorun.js", () =>
  require("tests/dev/helpers/mocks/autorunMock.js"),
);
jest.mock("dev/public/js/store/characters.js", () => ({
  withCharacterInventory: jest.fn(),
}));

import { state } from "dev/public/js/state.js";
import { resetState } from "tests/dev/helpers/stateFixture.js";
import { withCharacterInventory } from "dev/public/js/store/characters.js";
import { sendMagicGearToAlly } from "dev/public/js/engine/inventory/magicGear/model.js";

beforeEach(() => {
  resetState();
  jest.clearAllMocks();
  state.selected.magicGear = [
    {
      id: "gear-1",
      magic_gear_id: "MG-1",
      is_equipped: true,
      storedAt: null,
    },
  ];
});

describe("sendMagicGearToAlly", () => {
  test("moves an equipped instance to the destination unequipped, and removes it from the source", () => {
    let destinationMagicGear;
    withCharacterInventory.mockImplementation((characterId, mutator) => {
      destinationMagicGear = [];
      mutator({ magicGear: destinationMagicGear });
      return true;
    });

    const ok = sendMagicGearToAlly("gear-1", "ally-1", "backpack");

    expect(ok).toBe(true);
    expect(state.selected.magicGear).toHaveLength(0);
    expect(destinationMagicGear).toHaveLength(1);
    expect(destinationMagicGear[0]).toMatchObject({
      magic_gear_id: "MG-1",
      is_equipped: false,
      storedAt: "backpack",
    });
  });

  test("returns false and leaves the source untouched for an unknown instance id", () => {
    const ok = sendMagicGearToAlly("ghost", "ally-1");

    expect(ok).toBe(false);
    expect(state.selected.magicGear).toHaveLength(1);
    expect(withCharacterInventory).not.toHaveBeenCalled();
  });

  test("leaves the source untouched when the destination write fails", () => {
    withCharacterInventory.mockReturnValue(false);

    const ok = sendMagicGearToAlly("gear-1", "does-not-exist");

    expect(ok).toBe(false);
    expect(state.selected.magicGear).toHaveLength(1);
  });
});
