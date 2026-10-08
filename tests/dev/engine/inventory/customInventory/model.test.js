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
import { sendCustomItemToAlly } from "dev/public/js/engine/inventory/customInventory/model.js";

beforeEach(() => {
  resetState();
  jest.clearAllMocks();
  state.selected.customInventory = [
    { id: "item-1", name: "Rope", weight: 1, price: 2, quantity: 1, storedAt: "backpack" },
  ];
});

describe("sendCustomItemToAlly", () => {
  test("moves the item to the destination and removes it from the source, without inventing an is_equipped field", () => {
    let destinationItems;
    withCharacterInventory.mockImplementation((characterId, mutator) => {
      destinationItems = [];
      mutator({ customInventory: destinationItems });
      return true;
    });

    const ok = sendCustomItemToAlly("item-1", "ally-1", "camp");

    expect(ok).toBe(true);
    expect(state.selected.customInventory).toHaveLength(0);
    expect(destinationItems).toHaveLength(1);
    expect(destinationItems[0]).toMatchObject({
      name: "Rope",
      storedAt: "camp",
    });
    expect(destinationItems[0]).not.toHaveProperty("is_equipped");
  });

  test("returns false and leaves the source untouched for an unknown id", () => {
    const ok = sendCustomItemToAlly("ghost", "ally-1");

    expect(ok).toBe(false);
    expect(state.selected.customInventory).toHaveLength(1);
    expect(withCharacterInventory).not.toHaveBeenCalled();
  });

  test("leaves the source untouched when the destination write fails", () => {
    withCharacterInventory.mockReturnValue(false);

    const ok = sendCustomItemToAlly("item-1", "does-not-exist");

    expect(ok).toBe(false);
    expect(state.selected.customInventory).toHaveLength(1);
  });
});
