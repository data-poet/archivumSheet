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
import {
  sendRangedToAlly,
  findRangedByInstanceId,
} from "dev/public/js/engine/inventory/ranged/model.js";

function makeDestinationStore() {
  const inventory = { melee_weapons: [], ranged_weapons: [] };
  withCharacterInventory.mockImplementation((characterId, mutator) => {
    mutator(inventory);
    return true;
  });
  return inventory;
}

beforeEach(() => {
  resetState();
  jest.clearAllMocks();
  state.selected.ranged_weapons = [
    {
      id: "ranged-1",
      weapon_id: "RANGED-1",
      is_equipped: true,
      storedAt: null,
      enchantments: [],
    },
  ];
  state.selected.melee_weapons = [];
});

describe("sendRangedToAlly", () => {
  test("moves an unlinked instance to the destination unequipped, and removes it from the source", () => {
    const destination = makeDestinationStore();

    const ok = sendRangedToAlly("ranged-1", "ally-1", "backpack");

    expect(ok).toBe(true);
    expect(state.selected.ranged_weapons).toHaveLength(0);
    expect(destination.ranged_weapons).toHaveLength(1);
    expect(destination.ranged_weapons[0]).toMatchObject({
      weapon_id: "RANGED-1",
      is_equipped: false,
      storedAt: "backpack",
    });
    expect(destination.melee_weapons).toHaveLength(0);
  });

  test("returns false and leaves the source untouched for an unknown instance id", () => {
    const ok = sendRangedToAlly("ghost", "ally-1");

    expect(ok).toBe(false);
    expect(state.selected.ranged_weapons).toHaveLength(1);
    expect(withCharacterInventory).not.toHaveBeenCalled();
  });

  test("leaves the source untouched when the destination write fails", () => {
    withCharacterInventory.mockReturnValue(false);

    const ok = sendRangedToAlly("ranged-1", "does-not-exist");

    expect(ok).toBe(false);
    expect(state.selected.ranged_weapons).toHaveLength(1);
  });

  test("moves a linked pair together and re-links them on the destination with fresh ids", () => {
    state.selected.melee_weapons = [
      {
        id: "melee-1",
        _linkedInstanceId: "ranged-1",
        weapon_id: "MELEE-1",
        is_equipped: true,
        storedAt: null,
        enchantments: [],
      },
    ];
    const destination = makeDestinationStore();

    const ok = sendRangedToAlly("ranged-1", "ally-1", "backpack");

    expect(ok).toBe(true);
    expect(state.selected.ranged_weapons).toHaveLength(0);
    expect(state.selected.melee_weapons).toHaveLength(0);
    expect(destination.ranged_weapons).toHaveLength(1);
    expect(destination.melee_weapons).toHaveLength(1);

    const destRanged = destination.ranged_weapons[0];
    const destMelee = destination.melee_weapons[0];
    expect(destMelee._linkedInstanceId).toBe(destRanged.id);
    expect(destRanged._linkedInstanceId).toBeUndefined();
  });

  test("leaves both legs in the source when the counterpart leg fails to transfer", () => {
    state.selected.melee_weapons = [
      {
        id: "melee-1",
        _linkedInstanceId: "ranged-1",
        weapon_id: "MELEE-1",
        is_equipped: true,
        storedAt: null,
        enchantments: [],
      },
    ];

    let call = 0;
    const inventory = { melee_weapons: [], ranged_weapons: [] };
    withCharacterInventory.mockImplementation((characterId, mutator) => {
      call += 1;
      if (call === 2) return false;
      mutator(inventory);
      return true;
    });

    const ok = sendRangedToAlly("ranged-1", "ally-1", "backpack");

    expect(ok).toBe(false);
    expect(state.selected.ranged_weapons).toHaveLength(1);
    expect(state.selected.melee_weapons).toHaveLength(1);
    expect(findRangedByInstanceId("ranged-1")).not.toBeNull();
  });
});
