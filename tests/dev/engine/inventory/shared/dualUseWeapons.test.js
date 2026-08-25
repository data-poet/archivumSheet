import {
  MELEE_TO_RANGED,
  RANGED_TO_MELEE,
} from "dev/public/js/engine/inventory/shared/dualUseWeapons.js";

describe("MELEE_TO_RANGED / RANGED_TO_MELEE", () => {
  test("contains the expected number of pairs (spot-checked, not exhaustive)", () => {
    expect(Object.keys(MELEE_TO_RANGED)).toHaveLength(20);
    expect(Object.keys(RANGED_TO_MELEE)).toHaveLength(20);
  });

  test("maps a known melee id to its ranged counterpart", () => {
    expect(MELEE_TO_RANGED["MELEE-215"]).toBe("RANGED-050");
  });

  test("maps a known ranged id to its melee counterpart", () => {
    expect(RANGED_TO_MELEE["RANGED-050"]).toBe("MELEE-215");
  });

  test("every melee->ranged mapping has a matching reverse entry", () => {
    Object.entries(MELEE_TO_RANGED).forEach(([meleeId, rangedId]) => {
      expect(RANGED_TO_MELEE[rangedId]).toBe(meleeId);
    });
  });

  test("an id not in the pair list is absent from both maps", () => {
    expect(MELEE_TO_RANGED["MELEE-999"]).toBeUndefined();
    expect(RANGED_TO_MELEE["RANGED-999"]).toBeUndefined();
  });
});
