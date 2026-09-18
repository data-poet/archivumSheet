import {
  AUDIENCE,
  AVAILABLE_FOR_COLUMN,
  isAvailableFor,
  availableFor,
  setCatalogAudience,
  getCatalogAudience,
} from "dev/public/js/shared/availability.js";
import {
  installMockFetch,
  mockFetchResponse,
} from "tests/dev/helpers/mockFetch.js";

const row = (value) =>
  value === undefined
    ? { id: "X" }
    : { id: "X", [AVAILABLE_FOR_COLUMN]: value };

afterEach(() => {
  setCatalogAudience(null);
});

describe("isAvailableFor", () => {
  // Blank means both, so none of the ~23k existing rows need editing.
  test.each([undefined, "", "   ", null])(
    "a blank value (%p) is available to everyone",
    (value) => {
      expect(isAvailableFor(row(value), AUDIENCE.PLAYER)).toBe(true);
      expect(isAvailableFor(row(value), AUDIENCE.ALLY)).toBe(true);
    },
  );

  test("player means player only", () => {
    expect(isAvailableFor(row("player"), AUDIENCE.PLAYER)).toBe(true);
    expect(isAvailableFor(row("player"), AUDIENCE.ALLY)).toBe(false);
  });

  test("ally means ally only", () => {
    expect(isAvailableFor(row("ally"), AUDIENCE.ALLY)).toBe(true);
    expect(isAvailableFor(row("ally"), AUDIENCE.PLAYER)).toBe(false);
  });

  test("case and surrounding space are ignored", () => {
    expect(isAvailableFor(row(" Ally "), AUDIENCE.ALLY)).toBe(true);
    expect(isAvailableFor(row("PLAYER"), AUDIENCE.ALLY)).toBe(false);
  });

  test("a comma list is tolerated and means both", () => {
    expect(isAvailableFor(row("player,ally"), AUDIENCE.PLAYER)).toBe(true);
    expect(isAvailableFor(row("player, ally"), AUDIENCE.ALLY)).toBe(true);
  });

  // Showing a row that should have been hidden is visible and fixable; hiding one that should
  // have shown is the silent failure this design exists to avoid.
  test("an unrecognized value falls back to available, not hidden", () => {
    expect(isAvailableFor(row("allly"), AUDIENCE.PLAYER)).toBe(true);
    expect(isAvailableFor(row("gm-only"), AUDIENCE.ALLY)).toBe(true);
  });

  test("a missing row is not treated as hidden", () => {
    expect(isAvailableFor(undefined, AUDIENCE.PLAYER)).toBe(true);
  });
});

describe("availableFor", () => {
  const ROWS = [
    { id: "both" },
    { id: "p", [AVAILABLE_FOR_COLUMN]: "player" },
    { id: "a", [AVAILABLE_FOR_COLUMN]: "ally" },
  ];

  test("keeps blank plus the requested audience", () => {
    expect(availableFor(ROWS, AUDIENCE.PLAYER).map((r) => r.id)).toEqual([
      "both",
      "p",
    ]);
    expect(availableFor(ROWS, AUDIENCE.ALLY).map((r) => r.id)).toEqual([
      "both",
      "a",
    ]);
  });

  test("does not mutate the input", () => {
    availableFor(ROWS, AUDIENCE.PLAYER);
    expect(ROWS).toHaveLength(3);
  });

  test("passes non-array values through untouched", () => {
    const obj = { ATTRIBUTE_EFFECT_TYPES: [] };
    expect(availableFor(obj, AUDIENCE.PLAYER)).toBe(obj);
    expect(availableFor(undefined, AUDIENCE.PLAYER)).toBeUndefined();
  });
});

describe("the catalog audience", () => {
  test("is unset by default, so nothing filters", () => {
    expect(getCatalogAudience()).toBeNull();
  });

  test("round-trips and clears", () => {
    setCatalogAudience(AUDIENCE.PLAYER);
    expect(getCatalogAudience()).toBe(AUDIENCE.PLAYER);
    setCatalogAudience(null);
    expect(getCatalogAudience()).toBeNull();
  });
});

// The wiring that matters: filtering happens as rows arrive, because each load*() assigns its
// catalog and builds its add-form selectors in one call.
describe("api.js applies the audience to catalog responses", () => {
  const RACES = [
    { race_id: "RACE-023", race_name: "Humano" },
    { race_id: "RACE-ELEM", race_name: "Elemental", available_for: "ally" },
  ];

  beforeEach(() => {
    installMockFetch();
    mockFetchResponse("/api/races", RACES);
  });

  test("with no audience set, every row comes through", async () => {
    const { fetchRaces } = await import("dev/public/js/api.js");

    expect(await fetchRaces()).toHaveLength(2);
  });

  test("with the player audience, ally-only rows are dropped", async () => {
    const { fetchRaces } = await import("dev/public/js/api.js");
    setCatalogAudience(AUDIENCE.PLAYER);

    const races = await fetchRaces();

    expect(races.map((r) => r.race_id)).toEqual(["RACE-023"]);
  });

  test("with the ally audience, ally-only rows are kept", async () => {
    const { fetchRaces } = await import("dev/public/js/api.js");
    setCatalogAudience(AUDIENCE.ALLY);

    const races = await fetchRaces();

    expect(races.map((r) => r.race_id)).toEqual(["RACE-023", "RACE-ELEM"]);
  });

  test("a non-array response survives filtering", async () => {
    const { fetchEnchantmentEffectTypes } =
      await import("dev/public/js/api.js");
    mockFetchResponse("/api/enchantments/effect-types", {
      ATTRIBUTE_EFFECT_TYPES: ["a"],
    });
    setCatalogAudience(AUDIENCE.PLAYER);

    expect(await fetchEnchantmentEffectTypes()).toEqual({
      ATTRIBUTE_EFFECT_TYPES: ["a"],
    });
  });
});
