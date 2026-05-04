const { calculateCarryWeight } = require("engine/inventory/js/carryWeight");

const assertShape = require("tests/helpers/assertShape");

describe("CARRY WEIGHT", () => {
  const run = (st, load) => calculateCarryWeight(st, load);

  describe("Weight modifiers", () => {
    test("No load, when load <= ST", () => {
      const result = run(10, 10);
      expect(result.weight_modifier).toBe(0);
    });

    test("Light load, when ST <= load < ST*2", () => {
      const result = run(10, 15);
      expect(result.weight_modifier).toBe(-1);
    });

    test("Medium load, when ST*2 <= load < ST*3", () => {
      const result = run(10, 21);
      expect(result.weight_modifier).toBe(-2);
    });

    test("Heavy load, when ST*3 <= load < ST*6", () => {
      const result = run(10, 45);
      expect(result.weight_modifier).toBe(-3);
    });

    test("Very Heavy load, when ST*6 <= load < ST*10", () => {
      const result = run(10, 75);
      expect(result.weight_modifier).toBe(-4);
    });

    test("Overloaded, when load > ST*10", () => {
      const result = run(10, 120);
      expect(result.weight_modifier).toBe(-5);
    });
  });

  describe("Limits structure", () => {
    test("Should return the weight limits for each load level", () => {
      const result = run(10, 0);

      assertShape(result, ["limits", "weight_modifier"]);

      expect(result.limits.none).toBe(10);
      expect(result.limits.light).toBe(20);
      expect(result.limits.medium).toBe(30);
      expect(result.limits.heavy).toBe(60);
      expect(result.limits.veryHeavy).toBe(100);
    });
  });
});
