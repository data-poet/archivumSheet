import { installMockFetch, mockFetchResponse } from "tests/dev/helpers/mockFetch.js";
import { resetState } from "tests/dev/helpers/stateFixture.js";
import { state } from "dev/public/js/state.js";
import {
  loadDualUseWeapons,
  getRangedCounterpart,
  getMeleeCounterpart,
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
