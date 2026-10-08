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
  addSurvivalGear,
  updateSurvivalGearQuantity,
  removeSurvivalGear,
  moveSurvivalGear,
  sendSurvivalGearToAlly,
} from "dev/public/js/engine/inventory/survivalGear/model.js";

beforeEach(() => {
  resetState();
  jest.clearAllMocks();
  state.selected.survivalGear = [];
});

function findEntry(gearId, storedAt) {
  return state.selected.survivalGear.find(
    (e) => e.adventure_gear_id === gearId && e.storedAt === storedAt,
  );
}

describe("addSurvivalGear", () => {
  test("creates a new row with its own id", () => {
    addSurvivalGear("GEAR-1", 3, "backpack");

    const entry = findEntry("GEAR-1", "backpack");
    expect(entry.quantity).toBe(3);
    expect(typeof entry.id).toBe("string");
  });

  test("merging into an existing stack bumps quantity and keeps the same id", () => {
    addSurvivalGear("GEAR-1", 3, "backpack");
    const originalId = findEntry("GEAR-1", "backpack").id;

    addSurvivalGear("GEAR-1", 2, "backpack");

    const entry = findEntry("GEAR-1", "backpack");
    expect(entry.quantity).toBe(5);
    expect(entry.id).toBe(originalId);
  });

  test("does nothing for a non-positive quantity", () => {
    addSurvivalGear("GEAR-1", 0, "backpack");
    expect(state.selected.survivalGear).toHaveLength(0);
  });
});

describe("updateSurvivalGearQuantity", () => {
  test("sets the entry's quantity", () => {
    addSurvivalGear("GEAR-1", 2, "backpack");
    updateSurvivalGearQuantity("GEAR-1", "backpack", 5);

    expect(findEntry("GEAR-1", "backpack").quantity).toBe(5);
  });

  test("removes the entry entirely when quantity drops to 0", () => {
    addSurvivalGear("GEAR-1", 2, "backpack");
    updateSurvivalGearQuantity("GEAR-1", "backpack", 0);

    expect(findEntry("GEAR-1", "backpack")).toBeUndefined();
  });
});

describe("removeSurvivalGear", () => {
  test("removes the entry for that gear+location", () => {
    addSurvivalGear("GEAR-1", 3, "backpack");
    removeSurvivalGear("GEAR-1", "backpack");

    expect(findEntry("GEAR-1", "backpack")).toBeUndefined();
  });
});

describe("moveSurvivalGear", () => {
  test("carries the source row's id over when there is no destination stack", () => {
    addSurvivalGear("GEAR-1", 2, "backpack");
    const originalId = findEntry("GEAR-1", "backpack").id;

    moveSurvivalGear("GEAR-1", "backpack", "camp");

    expect(findEntry("GEAR-1", "backpack")).toBeUndefined();
    expect(findEntry("GEAR-1", "camp").id).toBe(originalId);
  });

  test("merging into an existing destination stack keeps the destination's id", () => {
    addSurvivalGear("GEAR-1", 2, "backpack");
    addSurvivalGear("GEAR-1", 1, "camp");
    const destId = findEntry("GEAR-1", "camp").id;

    moveSurvivalGear("GEAR-1", "backpack", "camp");

    const dest = findEntry("GEAR-1", "camp");
    expect(dest.quantity).toBe(3);
    expect(dest.id).toBe(destId);
    expect(findEntry("GEAR-1", "backpack")).toBeUndefined();
  });

  test("is a no-op when source and destination are the same", () => {
    addSurvivalGear("GEAR-1", 2, "backpack");
    moveSurvivalGear("GEAR-1", "backpack", "backpack");

    expect(findEntry("GEAR-1", "backpack").quantity).toBe(2);
  });
});

describe("sendSurvivalGearToAlly", () => {
  beforeEach(() => {
    addSurvivalGear("GEAR-1", 10, "backpack");
  });

  test("sends a partial amount, decrementing the source row", () => {
    const instanceId = findEntry("GEAR-1", "backpack").id;
    let destinationGear;
    withCharacterInventory.mockImplementation((characterId, mutator) => {
      destinationGear = [];
      mutator({ survivalGear: destinationGear });
      return true;
    });

    const ok = sendSurvivalGearToAlly(instanceId, "ally-1", 4, "backpack");

    expect(ok).toBe(true);
    expect(findEntry("GEAR-1", "backpack").quantity).toBe(6);
    expect(destinationGear[0]).toMatchObject({
      adventure_gear_id: "GEAR-1",
      quantity: 4,
    });
  });

  test("removes the source row entirely on a full send", () => {
    const instanceId = findEntry("GEAR-1", "backpack").id;
    withCharacterInventory.mockImplementation((characterId, mutator) => {
      mutator({ survivalGear: [] });
      return true;
    });

    const ok = sendSurvivalGearToAlly(instanceId, "ally-1", 10, "backpack");

    expect(ok).toBe(true);
    expect(findEntry("GEAR-1", "backpack")).toBeUndefined();
  });

  test("returns false and leaves the source untouched for an unknown instance id", () => {
    const ok = sendSurvivalGearToAlly("ghost", "ally-1", 4);

    expect(ok).toBe(false);
    expect(findEntry("GEAR-1", "backpack").quantity).toBe(10);
    expect(withCharacterInventory).not.toHaveBeenCalled();
  });

  test("leaves the source untouched when the destination write fails", () => {
    const instanceId = findEntry("GEAR-1", "backpack").id;
    withCharacterInventory.mockReturnValue(false);

    const ok = sendSurvivalGearToAlly(instanceId, "does-not-exist", 4);

    expect(ok).toBe(false);
    expect(findEntry("GEAR-1", "backpack").quantity).toBe(10);
  });
});
