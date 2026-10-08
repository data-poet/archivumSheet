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
import { sendArmorToAlly } from "dev/public/js/engine/inventory/armor/model.js";

beforeEach(() => {
  resetState();
  jest.clearAllMocks();
  state.selected.armors = [
    { id: "armor-1", armor_id: "ARM-1", is_equipped: true, storedAt: null },
  ];
});

describe("sendArmorToAlly", () => {
  test("moves an equipped instance to the destination unequipped, and removes it from the source", () => {
    let destinationArmors;
    withCharacterInventory.mockImplementation((characterId, mutator) => {
      destinationArmors = [];
      mutator({ armors: destinationArmors });
      return true;
    });

    const ok = sendArmorToAlly("armor-1", "ally-1", "backpack");

    expect(ok).toBe(true);
    expect(state.selected.armors).toHaveLength(0);
    expect(destinationArmors).toHaveLength(1);
    expect(destinationArmors[0]).toMatchObject({
      armor_id: "ARM-1",
      is_equipped: false,
      storedAt: "backpack",
    });
  });

  test("returns false and leaves the source untouched for an unknown instance id", () => {
    const ok = sendArmorToAlly("ghost", "ally-1");

    expect(ok).toBe(false);
    expect(state.selected.armors).toHaveLength(1);
    expect(withCharacterInventory).not.toHaveBeenCalled();
  });

  test("leaves the source untouched when the destination write fails", () => {
    withCharacterInventory.mockReturnValue(false);

    const ok = sendArmorToAlly("armor-1", "does-not-exist");

    expect(ok).toBe(false);
    expect(state.selected.armors).toHaveLength(1);
  });
});
