import {
  installMockFetch,
  mockFetchResponse,
} from "tests/dev/helpers/mockFetch.js";
import { resetState } from "tests/dev/helpers/stateFixture.js";
import { state } from "dev/public/js/state.js";
import {
  loadDualUseWeapons,
  getRangedCounterpart,
  getMeleeCounterpart,
  findLinkedCounterpart,
} from "dev/public/js/engine/inventory/shared/dualUseWeapons.js";

const MOCK_MAPS = {
  MELEE_TO_RANGED: { "MELEE-215": "RANGED-050" },
  RANGED_TO_MELEE: { "RANGED-050": "MELEE-215" },
};

beforeEach(() => {
  resetState();
  installMockFetch();
});

describe("loadDualUseWeapons", () => {
  test("fetches /api/inventory/dual-use-weapons and stores it on state.data", async () => {
    mockFetchResponse("/api/inventory/dual-use-weapons", MOCK_MAPS);

    await loadDualUseWeapons();

    expect(state.data.dualUseWeapons).toEqual(MOCK_MAPS);
  });
});

describe("getRangedCounterpart / getMeleeCounterpart", () => {
  beforeEach(async () => {
    mockFetchResponse("/api/inventory/dual-use-weapons", MOCK_MAPS);
    await loadDualUseWeapons();
  });

  test("maps a known melee id to its ranged counterpart", () => {
    expect(getRangedCounterpart("MELEE-215")).toBe("RANGED-050");
  });

  test("maps a known ranged id to its melee counterpart", () => {
    expect(getMeleeCounterpart("RANGED-050")).toBe("MELEE-215");
  });

  test("returns null for a melee id with no ranged counterpart", () => {
    expect(getRangedCounterpart("MELEE-999")).toBeNull();
  });

  test("returns null for a ranged id with no melee counterpart", () => {
    expect(getMeleeCounterpart("RANGED-999")).toBeNull();
  });
});

describe("before load completes", () => {
  test("lookups return null against the empty default shape rather than throwing", () => {
    expect(getRangedCounterpart("MELEE-215")).toBeNull();
    expect(getMeleeCounterpart("RANGED-050")).toBeNull();
  });
});

describe("findLinkedCounterpart", () => {
  test("finds the counterpart that points at us (they were created second)", () => {
    const instance = { _instanceId: "MELEE-1" };
    const linked = { _instanceId: "RANGED-1", _linkedInstanceId: "MELEE-1" };

    expect(findLinkedCounterpart(instance, [{ _instanceId: "X" }, linked])).toBe(
      linked,
    );
  });

  test("finds the counterpart we point at (we were created second)", () => {
    const instance = { _instanceId: "MELEE-1", _linkedInstanceId: "RANGED-1" };
    const linked = { _instanceId: "RANGED-1" };

    expect(findLinkedCounterpart(instance, [{ _instanceId: "X" }, linked])).toBe(
      linked,
    );
  });

  test("prefers the counterpart pointing at us when both directions could match", () => {
    const instance = { _instanceId: "MELEE-1", _linkedInstanceId: "RANGED-2" };
    const pointsAtUs = {
      _instanceId: "RANGED-1",
      _linkedInstanceId: "MELEE-1",
    };
    const wePointAt = { _instanceId: "RANGED-2" };

    expect(findLinkedCounterpart(instance, [pointsAtUs, wePointAt])).toBe(
      pointsAtUs,
    );
  });

  test("returns null when nothing is linked in either direction", () => {
    const instance = { _instanceId: "MELEE-1" };

    expect(
      findLinkedCounterpart(instance, [{ _instanceId: "RANGED-1" }]),
    ).toBeNull();
  });

  // Guards the undefined === undefined trap: an unlinked counterpart has no
  // _linkedInstanceId, so an instance with no _instanceId must not match it.
  test("does not match an unlinked counterpart when the instance has no _instanceId", () => {
    expect(findLinkedCounterpart({}, [{ _instanceId: "RANGED-1" }])).toBeNull();
  });

  test("does not match when both sides are missing their ids entirely", () => {
    expect(findLinkedCounterpart({}, [{}])).toBeNull();
  });

  test("returns null for a missing instance or a missing collection", () => {
    expect(findLinkedCounterpart(null, [{ _instanceId: "R" }])).toBeNull();
    expect(findLinkedCounterpart({ _instanceId: "M" }, null)).toBeNull();
  });

  test("returns null on an empty collection", () => {
    expect(findLinkedCounterpart({ _instanceId: "MELEE-1" }, [])).toBeNull();
  });
});
