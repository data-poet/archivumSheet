const {
  calculateBasicLift,
  calculateCarryWeight,
  liftingStrength,
} = require("engine/inventory/js/carryWeight");

const assertShape = require("tests/helpers/assertShape");

describe("CARRY WEIGHT", () => {
  const run = (st, load) => calculateCarryWeight(st, load);

  describe("Limits structure", () => {
    test("Should return the weight limits for each load level", () => {
      const result = run(10, 0);

      assertShape(result, [
        "basic_lift",
        "limits",
        "lifts",
        "level",
        "move_factor",
        "dodge_penalty",
      ]);

      expect(result.limits.none).toBe(10);
      expect(result.limits.light).toBe(20);
      expect(result.limits.medium).toBe(30);
      expect(result.limits.heavy).toBe(60);
      expect(result.limits.veryHeavy).toBe(100);
    });
  });
  describe("Basic Lift", () => {
    test.each([
      [10, 10],
      [12, 14],
      [8, 6],
      [15, 23],
      [7, 4.9],
      [5, 2.5],
    ])("ST %i → BL %s kg (whole kg from 5 kg up)", (st, bl) => {
      expect(calculateBasicLift(st)).toBe(bl);
    });

    test("limits are BL × 1/2/3/6/10 and lifts are the 4e multiples of BL", () => {
      const result = run(12, 0);
      expect(result.basic_lift).toBe(14);
      expect(result.limits).toEqual({
        none: 14,
        light: 28,
        medium: 42,
        heavy: 84,
        veryHeavy: 140,
      });
      expect(result.lifts).toEqual({
        oneHanded: 28,
        twoHanded: 112,
        shove: 168,
        onBack: 210,
        shiftSlightly: 700,
      });
    });
  });

  describe("Load level (4e effects)", () => {
    test.each([
      [10, "none", 1, 0],
      [20, "light", 0.8, -1],
      [30, "medium", 0.6, -2],
      [60, "heavy", 0.4, -3],
      [100, "veryHeavy", 0.2, -4],
      [100.01, "overloaded", 0, -4],
    ])(
      "weight %s at ST 10 is %s: Move ×%s, Dodge %i (limits inclusive)",
      (load, level, factor, penalty) => {
        const result = run(10, load);
        expect(result.level).toBe(level);
        expect(result.move_factor).toBe(factor);
        expect(result.dodge_penalty).toBe(penalty);
      },
    );
  });

  describe("liftingStrength", () => {
    test("halves ST (round up) only when FP is below 1/3 of its natural max", () => {
      expect(liftingStrength(11, { value: 3, final_base_value: 10 })).toBe(6);
      expect(liftingStrength(11, { value: 4, final_base_value: 10 })).toBe(11);
      expect(liftingStrength(11, undefined)).toBe(11);
    });
  });
});
