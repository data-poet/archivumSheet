const { calculateCarryWeight } = require("engine/inventory/js/carryWeight");

describe("CARRY WEIGHT", () => {
  test("No load, when load <= ST", () => {
    const result = calculateCarryWeight(10, 10);
    expect(result.weight_modifier).toBe(0);
  });

  test("Light Load, when ST <= load < ST*3", () => {
    const result = calculateCarryWeight(10, 15);

    expect(result.weight_modifier).toBe(0);
  });

  test("Average Load, when ST*3 <= load < ST*6, applies a modifier of -1", () => {
    const result = calculateCarryWeight(10, 45);

    expect(result.weight_modifier).toBe(-1);
  });

  test("Heavy Load, when ST*6 <= load < ST*10, applies a modifier of -2.", () => {
    const result = calculateCarryWeight(10, 75);

    expect(result.weight_modifier).toBe(-2);
  });

  test("Very Heavy Load, when load > ST*10, applies a modifier of -3", () => {
    const result = calculateCarryWeight(10, 120);

    expect(result.weight_modifier).toBe(-3);
  });

  test("Should returns the weight limits for each load level.", () => {
    const result = calculateCarryWeight(10, 0);

    expect(result.limits.none).toBe(10);
    expect(result.limits.light).toBe(20);
    expect(result.limits.medium).toBe(30);
    expect(result.limits.heavy).toBe(60);
    expect(result.limits.veryHeavy).toBe(100);
  });
});
