jest.mock("dev/public/js/ui.js", () =>
  require("tests/dev/helpers/mocks/uiMock.js"),
);
jest.mock("dev/public/js/compute/autorun.js", () =>
  require("tests/dev/helpers/mocks/autorunMock.js"),
);

import { state } from "dev/public/js/state.js";
import { resetState } from "tests/dev/helpers/stateFixture.js";
import {
  addLooseAmmo,
  moveLooseAmmo,
} from "dev/public/js/engine/inventory/ammo/model.js";

beforeEach(() => {
  resetState();
  state.selected.loose_ammo = [];
});

function findEntry(ammoId, storedAt) {
  return state.selected.loose_ammo.find(
    (a) => a.ammo_id === ammoId && a.storedAt === storedAt,
  );
}

describe("addLooseAmmo", () => {
  test("creates a new row with its own id", () => {
    addLooseAmmo("ARROW-1", 20, "backpack");

    const entry = findEntry("ARROW-1", "backpack");
    expect(entry.quantity).toBe(20);
    expect(typeof entry.id).toBe("string");
  });

  test("merging into an existing stack bumps quantity and keeps the same id", () => {
    addLooseAmmo("ARROW-1", 20, "backpack");
    const originalId = findEntry("ARROW-1", "backpack").id;

    addLooseAmmo("ARROW-1", 5, "backpack");

    const entry = findEntry("ARROW-1", "backpack");
    expect(entry.quantity).toBe(25);
    expect(entry.id).toBe(originalId);
  });
});

describe("moveLooseAmmo", () => {
  test("carries the source row's id over when there is no destination stack", () => {
    addLooseAmmo("ARROW-1", 20, "backpack");
    const originalId = findEntry("ARROW-1", "backpack").id;

    moveLooseAmmo("ARROW-1", "backpack", "stash");

    expect(findEntry("ARROW-1", "backpack")).toBeUndefined();
    expect(findEntry("ARROW-1", "stash").id).toBe(originalId);
  });

  test("merging into an existing destination stack keeps the destination's id", () => {
    addLooseAmmo("ARROW-1", 20, "backpack");
    addLooseAmmo("ARROW-1", 6, "stash");
    const destId = findEntry("ARROW-1", "stash").id;

    moveLooseAmmo("ARROW-1", "backpack", "stash");

    const dest = findEntry("ARROW-1", "stash");
    expect(dest.quantity).toBe(26);
    expect(dest.id).toBe(destId);
    expect(findEntry("ARROW-1", "backpack")).toBeUndefined();
  });
});
