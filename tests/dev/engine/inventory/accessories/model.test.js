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
import { sendAccessoryToAlly } from "dev/public/js/engine/inventory/accessories/model.js";

beforeEach(() => {
  resetState();
  jest.clearAllMocks();
  state.selected.accessories = [
    {
      id: "accessory-1",
      accessory_id: "ACC-1",
      is_equipped: true,
      storedAt: null,
    },
  ];
});

describe("sendAccessoryToAlly", () => {
  test("moves an equipped instance to the destination unequipped, and removes it from the source", () => {
    let destinationAccessories;
    withCharacterInventory.mockImplementation((characterId, mutator) => {
      destinationAccessories = [];
      mutator({ accessories: destinationAccessories });
      return true;
    });

    const ok = sendAccessoryToAlly("accessory-1", "ally-1", "backpack");

    expect(ok).toBe(true);
    expect(state.selected.accessories).toHaveLength(0);
    expect(destinationAccessories).toHaveLength(1);
    expect(destinationAccessories[0]).toMatchObject({
      accessory_id: "ACC-1",
      is_equipped: false,
      storedAt: "backpack",
    });
  });

  test("returns false and leaves the source untouched for an unknown instance id", () => {
    const ok = sendAccessoryToAlly("ghost", "ally-1");

    expect(ok).toBe(false);
    expect(state.selected.accessories).toHaveLength(1);
    expect(withCharacterInventory).not.toHaveBeenCalled();
  });

  test("leaves the source untouched when the destination write fails", () => {
    withCharacterInventory.mockReturnValue(false);

    const ok = sendAccessoryToAlly("accessory-1", "does-not-exist");

    expect(ok).toBe(false);
    expect(state.selected.accessories).toHaveLength(1);
  });
});
