jest.mock("dev/public/js/ui.js", () =>
  require("tests/dev/helpers/mocks/uiMock.js"),
);
jest.mock("dev/public/js/compute/autorun.js", () =>
  require("tests/dev/helpers/mocks/autorunMock.js"),
);

import { state } from "dev/public/js/state.js";
import { resetState } from "tests/dev/helpers/stateFixture.js";
import { addCoins, moveCoins } from "dev/public/js/engine/inventory/coinPurse/model.js";

beforeEach(() => {
  resetState();
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
