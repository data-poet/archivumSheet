jest.mock("dev/public/js/ui.js", () =>
  require("tests/dev/helpers/mocks/uiMock.js"),
);
jest.mock("dev/public/js/compute/autorun.js", () =>
  require("tests/dev/helpers/mocks/autorunMock.js"),
);

import { state } from "dev/public/js/state.js";
import { resetState } from "tests/dev/helpers/stateFixture.js";
import {
  addSurvivalGear,
  updateSurvivalGearQuantity,
  removeSurvivalGear,
  moveSurvivalGear,
} from "dev/public/js/engine/inventory/survivalGear/model.js";

beforeEach(() => {
  resetState();
  state.selected.survivalGear = [];
});

function rowsFor(gearId, storedAt) {
  return state.selected.survivalGear.filter(
    (e) => e.adventure_gear_id === gearId && e.storedAt === storedAt,
  );
}

describe("addSurvivalGear", () => {
  test("pushes one row per unit of quantity, each with its own id", () => {
    addSurvivalGear("GEAR-1", 3, "backpack");

    const rows = rowsFor("GEAR-1", "backpack");
    expect(rows).toHaveLength(3);
    expect(rows.every((r) => r.quantity === 1)).toBe(true);
    const ids = new Set(rows.map((r) => r.id));
    expect(ids.size).toBe(3);
  });

  test("does nothing for a non-positive quantity", () => {
    addSurvivalGear("GEAR-1", 0, "backpack");
    expect(state.selected.survivalGear).toHaveLength(0);
  });
});

describe("updateSurvivalGearQuantity", () => {
  test("grows the group by pushing new rows", () => {
    addSurvivalGear("GEAR-1", 2, "backpack");
    updateSurvivalGearQuantity("GEAR-1", "backpack", 5);

    expect(rowsFor("GEAR-1", "backpack")).toHaveLength(5);
  });

  test("shrinks the group by removing rows, preserving the rest", () => {
    addSurvivalGear("GEAR-1", 5, "backpack");
    const keptId = rowsFor("GEAR-1", "backpack").at(-1).id;

    updateSurvivalGearQuantity("GEAR-1", "backpack", 1);

    const rows = rowsFor("GEAR-1", "backpack");
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe(keptId);
  });

  test("removes the group entirely when quantity drops to 0", () => {
    addSurvivalGear("GEAR-1", 2, "backpack");
    updateSurvivalGearQuantity("GEAR-1", "backpack", 0);

    expect(rowsFor("GEAR-1", "backpack")).toHaveLength(0);
  });
});

describe("removeSurvivalGear", () => {
  test("removes every row for that gear+location", () => {
    addSurvivalGear("GEAR-1", 3, "backpack");
    removeSurvivalGear("GEAR-1", "backpack");

    expect(rowsFor("GEAR-1", "backpack")).toHaveLength(0);
  });
});

describe("moveSurvivalGear", () => {
  test("moves every matching row, keeping each row's id", () => {
    addSurvivalGear("GEAR-1", 2, "backpack");
    const idsBefore = rowsFor("GEAR-1", "backpack")
      .map((r) => r.id)
      .sort();

    moveSurvivalGear("GEAR-1", "backpack", "camp");

    expect(rowsFor("GEAR-1", "backpack")).toHaveLength(0);
    const idsAfter = rowsFor("GEAR-1", "camp")
      .map((r) => r.id)
      .sort();
    expect(idsAfter).toEqual(idsBefore);
  });

  test("is a no-op when source and destination are the same", () => {
    addSurvivalGear("GEAR-1", 2, "backpack");
    moveSurvivalGear("GEAR-1", "backpack", "backpack");

    expect(rowsFor("GEAR-1", "backpack")).toHaveLength(2);
  });
});
