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
  addCoins,
  moveCoins,
  sendCoinsToAlly,
} from "dev/public/js/engine/inventory/coinPurse/model.js";

beforeEach(() => {
  resetState();
  jest.clearAllMocks();
  state.selected.coins = [];
});

function findEntry(coinType, storedAt) {
  return state.selected.coins.find(
    (c) => c.coin_type === coinType && c.storedAt === storedAt,
  );
}

describe("addCoins", () => {
  test("creates a new row with its own id", () => {
    addCoins("gold", 10, "backpack");

    const entry = findEntry("gold", "backpack");
    expect(entry.quantity).toBe(10);
    expect(typeof entry.id).toBe("string");
  });

  test("merging into an existing stack bumps quantity and keeps the same id", () => {
    addCoins("gold", 10, "backpack");
    const originalId = findEntry("gold", "backpack").id;

    addCoins("gold", 5, "backpack");

    const entry = findEntry("gold", "backpack");
    expect(entry.quantity).toBe(15);
    expect(entry.id).toBe(originalId);
  });
});

describe("moveCoins", () => {
  test("carries the source row's id over when there is no destination stack", () => {
    addCoins("gold", 10, "backpack");
    const originalId = findEntry("gold", "backpack").id;

    moveCoins("gold", "backpack", "stash");

    expect(findEntry("gold", "backpack")).toBeUndefined();
    expect(findEntry("gold", "stash").id).toBe(originalId);
  });

  test("merging into an existing destination stack keeps the destination's id", () => {
    addCoins("gold", 10, "backpack");
    addCoins("gold", 3, "stash");
    const destId = findEntry("gold", "stash").id;

    moveCoins("gold", "backpack", "stash");

    const dest = findEntry("gold", "stash");
    expect(dest.quantity).toBe(13);
    expect(dest.id).toBe(destId);
    expect(findEntry("gold", "backpack")).toBeUndefined();
  });
});

describe("sendCoinsToAlly", () => {
  beforeEach(() => {
    addCoins("gold", 20, "backpack");
  });

  test("sends a partial amount, decrementing the source row", () => {
    const instanceId = findEntry("gold", "backpack").id;
    let destinationCoins;
    withCharacterInventory.mockImplementation((characterId, mutator) => {
      destinationCoins = [];
      mutator({ coins: destinationCoins });
      return true;
    });

    const ok = sendCoinsToAlly(instanceId, "ally-1", 5, "backpack");

    expect(ok).toBe(true);
    expect(findEntry("gold", "backpack").quantity).toBe(15);
    expect(destinationCoins[0]).toMatchObject({ coin_type: "gold", quantity: 5 });
  });

  test("removes the source row entirely on a full send", () => {
    const instanceId = findEntry("gold", "backpack").id;
    withCharacterInventory.mockImplementation((characterId, mutator) => {
      mutator({ coins: [] });
      return true;
    });

    const ok = sendCoinsToAlly(instanceId, "ally-1", 20, "backpack");

    expect(ok).toBe(true);
    expect(findEntry("gold", "backpack")).toBeUndefined();
  });

  test("returns false and leaves the source untouched for an unknown instance id", () => {
    const ok = sendCoinsToAlly("ghost", "ally-1", 5);

    expect(ok).toBe(false);
    expect(findEntry("gold", "backpack").quantity).toBe(20);
    expect(withCharacterInventory).not.toHaveBeenCalled();
  });

  test("leaves the source untouched when the destination write fails", () => {
    const instanceId = findEntry("gold", "backpack").id;
    withCharacterInventory.mockReturnValue(false);

    const ok = sendCoinsToAlly(instanceId, "does-not-exist", 5);

    expect(ok).toBe(false);
    expect(findEntry("gold", "backpack").quantity).toBe(20);
  });
});
