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
import { sendShieldToAlly } from "dev/public/js/engine/inventory/shield/model.js";

beforeEach(() => {
  resetState();
  jest.clearAllMocks();
  state.selected.shields = [
    { id: "shield-1", shield_id: "SHD-1", is_equipped: true, storedAt: null },
  ];
});

describe("sendShieldToAlly", () => {
  test("moves an equipped instance to the destination unequipped, and removes it from the source", () => {
    let destinationShields;
    withCharacterInventory.mockImplementation((characterId, mutator) => {
      destinationShields = [];
      mutator({ shields: destinationShields });
      return true;
    });

    const ok = sendShieldToAlly("shield-1", "ally-1", "backpack");

    expect(ok).toBe(true);
    expect(state.selected.shields).toHaveLength(0);
    expect(destinationShields).toHaveLength(1);
    expect(destinationShields[0]).toMatchObject({
      shield_id: "SHD-1",
      is_equipped: false,
      storedAt: "backpack",
    });
  });

  test("returns false and leaves the source untouched for an unknown instance id", () => {
    const ok = sendShieldToAlly("ghost", "ally-1");

    expect(ok).toBe(false);
    expect(state.selected.shields).toHaveLength(1);
    expect(withCharacterInventory).not.toHaveBeenCalled();
  });

  test("leaves the source untouched when the destination write fails", () => {
    withCharacterInventory.mockReturnValue(false);

    const ok = sendShieldToAlly("shield-1", "does-not-exist");

    expect(ok).toBe(false);
    expect(state.selected.shields).toHaveLength(1);
  });
});
