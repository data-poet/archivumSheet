const {
  getSpellCost,
  getRelativeLevel,
  COST_TABLES,
} = require("engine/magic/js/spellsCost");

describe("SPELL COST SYSTEM", () => {
  describe("Relative Level", () => {
    test("Should calculate correct relative level", () => {
      expect(getRelativeLevel(10, 10)).toBe(0);
      expect(getRelativeLevel(10, 12)).toBe(2);
      expect(getRelativeLevel(12, 10)).toBe(-2);
    });
  });

  describe("Cost Table - IQ / Easy (F)", () => {
    test("Should return correct cost for valid relative levels", () => {
      expect(getSpellCost({ base: 10, level: 10, difficulty: "F" })).toBe(1); // 0
      expect(getSpellCost({ base: 10, level: 11, difficulty: "F" })).toBe(2); // +1
      expect(getSpellCost({ base: 10, level: 12, difficulty: "F" })).toBe(4); // +2
    });

    test("Should clamp below minimum (-4)", () => {
      expect(getSpellCost({ base: 10, level: 0, difficulty: "F" })).toBe(0.5);
    });

    test("Should clamp above maximum (+10)", () => {
      expect(getSpellCost({ base: 10, level: 30, difficulty: "F" })).toBe(20);
    });
  });

  describe("Cost Table - IQ / Medium (M)", () => {
    test("Should return correct cost values", () => {
      expect(getSpellCost({ base: 10, level: 10, difficulty: "M" })).toBe(2); // 0
      expect(getSpellCost({ base: 10, level: 11, difficulty: "M" })).toBe(4); // +1
      expect(getSpellCost({ base: 10, level: 9, difficulty: "M" })).toBe(2); // -1
    });
  });

  describe("Cost Table - IQ / Hard (D)", () => {
    test("Should return correct cost values", () => {
      expect(getSpellCost({ base: 10, level: 10, difficulty: "D" })).toBe(4); // 0
      expect(getSpellCost({ base: 10, level: 11, difficulty: "D" })).toBe(6); // +1
      expect(getSpellCost({ base: 10, level: 9, difficulty: "D" })).toBe(2); // -1
    });
  });

  describe("Cost Table - IQ / Very Hard (MD)", () => {
    test("Should return correct cost values", () => {
      expect(getSpellCost({ base: 10, level: 10, difficulty: "MD" })).toBe(6); // 0
      expect(getSpellCost({ base: 10, level: 11, difficulty: "MD" })).toBe(8); // +1
      expect(getSpellCost({ base: 10, level: 9, difficulty: "MD" })).toBe(4); // -1
    });
  });

  describe("Invalid Inputs", () => {
    test("Should return 0 for invalid difficulty", () => {
      expect(
        getSpellCost({
          base: 10,
          level: 10,
          difficulty: "INVALID",
        }),
      ).toBe(0);
    });

    test("Should return 0 for invalid attribute", () => {
      expect(
        getSpellCost({
          attribute: "DX",
          base: 10,
          level: 10,
          difficulty: "F",
        }),
      ).toBe(0);
    });
  });

  describe("Table Integrity", () => {
    test("All difficulties should exist under IQ", () => {
      expect(COST_TABLES.IQ).toHaveProperty("F");
      expect(COST_TABLES.IQ).toHaveProperty("M");
      expect(COST_TABLES.IQ).toHaveProperty("D");
      expect(COST_TABLES.IQ).toHaveProperty("MD");
    });

    test("All tables should include 0 relative level", () => {
      Object.values(COST_TABLES.IQ).forEach((table) => {
        expect(table).toHaveProperty("0");
      });
    });
  });
});
