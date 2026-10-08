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
import { sendFirearmToAlly } from "dev/public/js/engine/inventory/firearms/model.js";

beforeEach(() => {
  resetState();
  jest.clearAllMocks();
  state.selected.firearms = [
    { id: "firearm-1", weapon_id: "FA-1", is_equipped: true, storedAt: null },
  ];
});

describe("sendFirearmToAlly", () => {
  test("moves an equipped instance to the destination unequipped, and removes it from the source", () => {
    let destinationFirearms;
    withCharacterInventory.mockImplementation((characterId, mutator) => {
      destinationFirearms = [];
      mutator({ firearms: destinationFirearms });
      return true;
    });

    const ok = sendFirearmToAlly("firearm-1", "ally-1", "backpack");

    expect(ok).toBe(true);
    expect(state.selected.firearms).toHaveLength(0);
    expect(destinationFirearms).toHaveLength(1);
    expect(destinationFirearms[0]).toMatchObject({
      weapon_id: "FA-1",
      is_equipped: false,
      storedAt: "backpack",
    });
  });

  test("returns false and leaves the source untouched for an unknown instance id", () => {
    const ok = sendFirearmToAlly("ghost", "ally-1");

    expect(ok).toBe(false);
    expect(state.selected.firearms).toHaveLength(1);
    expect(withCharacterInventory).not.toHaveBeenCalled();
  });

  test("leaves the source untouched when the destination write fails", () => {
    withCharacterInventory.mockReturnValue(false);

    const ok = sendFirearmToAlly("firearm-1", "does-not-exist");

    expect(ok).toBe(false);
    expect(state.selected.firearms).toHaveLength(1);
  });
});
