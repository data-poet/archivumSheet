import { state } from "dev/public/js/state.js";
import { sortByOrder, reorderTrait } from "dev/public/js/shared/traitOrder.js";

describe("sortByOrder", () => {
  test("sorts known ids by order, appending unlisted ones in their original order", () => {
    expect(sortByOrder(["a", "b", "c"], ["c", "a"])).toEqual(["c", "a", "b"]);
  });

  test("drops stale order entries no longer present in ids", () => {
    expect(sortByOrder(["a", "b"], ["z", "b", "a"])).toEqual(["b", "a"]);
  });

  test("falls back to the given order when order is empty or missing", () => {
    expect(sortByOrder(["a", "b"], [])).toEqual(["a", "b"]);
    expect(sortByOrder(["a", "b"])).toEqual(["a", "b"]);
  });
});

describe("reorderTrait", () => {
  beforeEach(() => {
    state.selected.advantages = { "ADV-1": true, "ADV-2": true, "ADV-3": true };
    state.selected.order = {
      advantages: [],
      disadvantages: [],
      skills: [],
      spells: [],
    };
  });

  test("moves an id to the given index and persists the full order", () => {
    reorderTrait("advantages", "ADV-3", 0);

    expect(state.selected.order.advantages).toEqual([
      "ADV-3",
      "ADV-1",
      "ADV-2",
    ]);
  });

  test("does nothing for an id not in the kind's map", () => {
    reorderTrait("advantages", "ADV-MISSING", 0);

    expect(state.selected.order.advantages).toEqual([]);
  });

  test("builds on the existing order rather than resetting it", () => {
    state.selected.order.advantages = ["ADV-3", "ADV-1", "ADV-2"];

    reorderTrait("advantages", "ADV-1", 0);

    expect(state.selected.order.advantages).toEqual([
      "ADV-1",
      "ADV-3",
      "ADV-2",
    ]);
  });
});
