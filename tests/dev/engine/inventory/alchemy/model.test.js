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

function rowsFor(consumableId, storedAt) {
  return state.selected.alchemy.filter(
    (e) => e.consumable_id === consumableId && e.storedAt === storedAt,
  );
}

describe("addAlchemy", () => {
  test("pushes one row per unit of quantity, each with its own id", () => {
    addAlchemy("POTION-1", 3, "backpack");

    const rows = rowsFor("POTION-1", "backpack");
    expect(rows).toHaveLength(3);
    expect(rows.every((r) => r.quantity === 1)).toBe(true);
    const ids = new Set(rows.map((r) => r.id));
    expect(ids.size).toBe(3);
  });

  test("does nothing for a non-positive quantity", () => {
    addAlchemy("POTION-1", 0, "backpack");
    expect(state.selected.alchemy).toHaveLength(0);
  });
});

describe("updateAlchemyQuantity", () => {
  test("grows the group by pushing new rows", () => {
    addAlchemy("POTION-1", 2, "backpack");
    updateAlchemyQuantity("POTION-1", "backpack", 5);

    expect(rowsFor("POTION-1", "backpack")).toHaveLength(5);
  });

  test("shrinks the group by removing rows, preserving the rest", () => {
    addAlchemy("POTION-1", 5, "backpack");
    const keptId = rowsFor("POTION-1", "backpack").at(-1).id;

    updateAlchemyQuantity("POTION-1", "backpack", 1);

    const rows = rowsFor("POTION-1", "backpack");
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe(keptId);
  });

  test("removes the group entirely when quantity drops to 0", () => {
    addAlchemy("POTION-1", 2, "backpack");
    updateAlchemyQuantity("POTION-1", "backpack", 0);

    expect(rowsFor("POTION-1", "backpack")).toHaveLength(0);
  });

  test("does not disturb rows of a different consumable or location", () => {
    addAlchemy("POTION-1", 2, "backpack");
    addAlchemy("POTION-2", 2, "backpack");
    addAlchemy("POTION-1", 1, "stash");

    updateAlchemyQuantity("POTION-1", "backpack", 0);

    expect(rowsFor("POTION-2", "backpack")).toHaveLength(2);
    expect(rowsFor("POTION-1", "stash")).toHaveLength(1);
  });
});

describe("removeAlchemy", () => {
  test("removes every row for that consumable+location", () => {
    addAlchemy("POTION-1", 3, "backpack");
    removeAlchemy("POTION-1", "backpack");

    expect(rowsFor("POTION-1", "backpack")).toHaveLength(0);
  });
});

describe("moveAlchemy", () => {
  test("moves every matching row, keeping each row's id", () => {
    addAlchemy("POTION-1", 2, "backpack");
    const idsBefore = rowsFor("POTION-1", "backpack")
      .map((r) => r.id)
      .sort();

    moveAlchemy("POTION-1", "backpack", "camp");

    expect(rowsFor("POTION-1", "backpack")).toHaveLength(0);
    const idsAfter = rowsFor("POTION-1", "camp")
      .map((r) => r.id)
      .sort();
    expect(idsAfter).toEqual(idsBefore);
  });

  test("is a no-op when source and destination are the same", () => {
    addAlchemy("POTION-1", 2, "backpack");
    moveAlchemy("POTION-1", "backpack", "backpack");

    expect(rowsFor("POTION-1", "backpack")).toHaveLength(2);
  });
});
