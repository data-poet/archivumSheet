import rules from "helpers/rules.js";
import {
  loadRules,
  secondaryMaxBought,
  isUnbuyableSecondary,
} from "dev/public/js/shared/rules.js";
import { state } from "dev/public/js/state.js";
import { resetState } from "tests/dev/helpers/stateFixture.js";
import {
  installMockFetch,
  mockFetchResponse,
} from "tests/dev/helpers/mockFetch.js";

beforeEach(() => {
  resetState();
  installMockFetch();
});

describe("loadRules", () => {
  test("stores what /api/rules returns on state.data.rules", async () => {
    mockFetchResponse("/api/rules", rules);

    await loadRules();

    expect(state.data.rules).toEqual(rules);
  });
});

describe("secondary purchase lookups", () => {
  beforeEach(async () => {
    mockFetchResponse("/api/rules", rules);
    await loadRules();
  });

  test.each(Object.entries(rules.SECONDARY_PURCHASE))(
    "%s takes its cap from the engine rules",
    (key, { maxBought }) => {
      expect(secondaryMaxBought(key)).toBe(maxBought);
      expect(isUnbuyableSecondary(key)).toBe(maxBought === 0);
    },
  );

  test("Movement, Dodge and DamageResistance are the unbuyable secondaries", () => {
    const unbuyable = Object.keys(rules.SECONDARY_PURCHASE).filter(
      isUnbuyableSecondary,
    );
    expect(unbuyable).toEqual(["Movement", "Dodge", "DamageResistance"]);
  });

  test("an attribute the rules don't list follows the default, as in the engine", () => {
    expect(secondaryMaxBought("Nope")).toBe(
      rules.DEFAULT_SECONDARY_PURCHASE.maxBought,
    );
    expect(isUnbuyableSecondary("Nope")).toBe(false);
  });

  test("before the rules load, nothing is buyable", () => {
    resetState();
    expect(secondaryMaxBought("HP")).toBe(0);
  });
});
