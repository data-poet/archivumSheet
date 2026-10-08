jest.mock("dev/public/js/ui.js", () =>
  require("tests/dev/helpers/mocks/uiMock.js"),
);
jest.mock("dev/public/js/compute/autorun.js", () =>
  require("tests/dev/helpers/mocks/autorunMock.js"),
);

import { state } from "dev/public/js/state.js";
import { resetState } from "tests/dev/helpers/stateFixture.js";
import {
  addAlchemy,
  updateAlchemyQuantity,
  removeAlchemy,
  moveAlchemy,
} from "dev/public/js/engine/inventory/alchemy/model.js";

beforeEach(() => {
  resetState();
  state.selected.alchemy = [];
});

function findEntry(consumableId, storedAt) {
  return state.selected.alchemy.find(
    (e) => e.consumable_id === consumableId && e.storedAt === storedAt,
  );
}

describe("addAlchemy", () => {
  test("creates a new row with its own id", () => {
    addAlchemy("POTION-1", 3, "backpack");

    const entry = findEntry("POTION-1", "backpack");
    expect(entry.quantity).toBe(3);
    expect(typeof entry.id).toBe("string");
  });

  test("merging into an existing stack bumps quantity and keeps the same id", () => {
    addAlchemy("POTION-1", 3, "backpack");
    const originalId = findEntry("POTION-1", "backpack").id;

    addAlchemy("POTION-1", 2, "backpack");

    const entry = findEntry("POTION-1", "backpack");
    expect(entry.quantity).toBe(5);
    expect(entry.id).toBe(originalId);
  });

  test("does nothing for a non-positive quantity", () => {
    addAlchemy("POTION-1", 0, "backpack");
    expect(state.selected.alchemy).toHaveLength(0);
  });
});

describe("updateAlchemyQuantity", () => {
  test("sets the entry's quantity", () => {
    addAlchemy("POTION-1", 2, "backpack");
    updateAlchemyQuantity("POTION-1", "backpack", 5);

    expect(findEntry("POTION-1", "backpack").quantity).toBe(5);
  });

  test("removes the entry entirely when quantity drops to 0", () => {
    addAlchemy("POTION-1", 2, "backpack");
    updateAlchemyQuantity("POTION-1", "backpack", 0);

    expect(findEntry("POTION-1", "backpack")).toBeUndefined();
  });

  test("does not disturb rows of a different consumable or location", () => {
    addAlchemy("POTION-1", 2, "backpack");
    addAlchemy("POTION-2", 2, "backpack");
    addAlchemy("POTION-1", 1, "stash");

    updateAlchemyQuantity("POTION-1", "backpack", 0);

    expect(findEntry("POTION-2", "backpack").quantity).toBe(2);
    expect(findEntry("POTION-1", "stash").quantity).toBe(1);
  });
});

describe("removeAlchemy", () => {
  test("removes the entry for that consumable+location", () => {
    addAlchemy("POTION-1", 3, "backpack");
    removeAlchemy("POTION-1", "backpack");

    expect(findEntry("POTION-1", "backpack")).toBeUndefined();
  });
});

describe("moveAlchemy", () => {
  test("carries the source row's id over when there is no destination stack", () => {
    addAlchemy("POTION-1", 2, "backpack");
    const originalId = findEntry("POTION-1", "backpack").id;

    moveAlchemy("POTION-1", "backpack", "camp");

    expect(findEntry("POTION-1", "backpack")).toBeUndefined();
    expect(findEntry("POTION-1", "camp").id).toBe(originalId);
  });

  test("merging into an existing destination stack keeps the destination's id", () => {
    addAlchemy("POTION-1", 2, "backpack");
    addAlchemy("POTION-1", 1, "camp");
    const destId = findEntry("POTION-1", "camp").id;

    moveAlchemy("POTION-1", "backpack", "camp");

    const dest = findEntry("POTION-1", "camp");
    expect(dest.quantity).toBe(3);
    expect(dest.id).toBe(destId);
    expect(findEntry("POTION-1", "backpack")).toBeUndefined();
  });

  test("is a no-op when source and destination are the same", () => {
    addAlchemy("POTION-1", 2, "backpack");
    moveAlchemy("POTION-1", "backpack", "backpack");

    expect(findEntry("POTION-1", "backpack").quantity).toBe(2);
  });
});
