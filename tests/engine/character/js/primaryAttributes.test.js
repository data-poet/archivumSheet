const {
  buildPrimaryAttributes,
} = require("engine/character/js/primaryAttributes");

describe("PRIMARY ATTRIBUTES", () => {
  test("Should build all attributes with correct structure", () => {
    const result = buildPrimaryAttributes({});

    expect(result).toHaveProperty("primary_attributes");
    expect(result).toHaveProperty("character_points");

    ["ST", "DX", "IQ", "HT"].forEach((attr) => {
      expect(result.primary_attributes).toHaveProperty(attr);
      expect(result.character_points).toHaveProperty(attr);

      const attribute = result.primary_attributes[attr];

      expect(typeof attribute.base_value).toBe("number");
      expect(typeof attribute.modifier).toBe("number");
      expect(typeof attribute.value).toBe("number");

      expect(typeof result.character_points[attr]).toBe("number");
    });
  });

  test("Should default all attributes to 10 with 0 cost", () => {
    const result = buildPrimaryAttributes({});

    ["ST", "DX", "IQ", "HT"].forEach((attr) => {
      expect(result.primary_attributes[attr]).toEqual({
        base_value: 10,
        modifier: 0,
        value: 10,
      });

      expect(result.character_points[attr]).toBe(0);
    });
  });

  test("Should correctly calculate final value (base + modifier)", () => {
    const result = buildPrimaryAttributes({
      ST: { base_value: 12, modifier: 2 },
    });

    expect(result.primary_attributes.ST.value).toBe(14);
  });

  test("Should calculate correct positive costs", () => {
    const result = buildPrimaryAttributes({
      ST: { base_value: 12 }, // +2 → 2 * 10 = 20
      DX: { base_value: 11 }, // +1 → 1 * 20 = 20
      IQ: { base_value: 13 }, // +3 → 3 * 20 = 60
      HT: { base_value: 11 }, // +1 → 1 * 10 = 10
    });

    expect(result.character_points).toEqual({
      ST: 20,
      DX: 20,
      IQ: 60,
      HT: 10,
    });
  });

  test("Should calculate correct negative costs", () => {
    const result = buildPrimaryAttributes({
      ST: { base_value: 8 }, // -2 → -20
      DX: { base_value: 9 }, // -1 → -20
      IQ: { base_value: 9 }, // -1 → -20
      HT: { base_value: 8 }, // -2 → -20
    });

    expect(result.character_points).toEqual({
      ST: -20,
      DX: -20,
      IQ: -20,
      HT: -20,
    });
  });

  test("Should NOT use modifier when calculating cost", () => {
    const result = buildPrimaryAttributes({
      ST: { base_value: 10, modifier: 5 },
    });

    expect(result.primary_attributes.ST.value).toBe(15);

    // cost must still be 0 because base_value = 10
    expect(result.character_points.ST).toBe(0);
  });

  test("Should handle mixed attributes correctly", () => {
    const result = buildPrimaryAttributes({
      ST: { base_value: 12, modifier: 1 }, // 13 → cost 20
      DX: { base_value: 9, modifier: 0 }, // 9 → cost -20
      IQ: { base_value: 10, modifier: 3 }, // 13 → cost 0
      HT: { base_value: 11, modifier: -1 }, // 10 → cost 10
    });

    expect(result.primary_attributes).toEqual({
      ST: { base_value: 12, modifier: 1, value: 13 },
      DX: { base_value: 9, modifier: 0, value: 9 },
      IQ: { base_value: 10, modifier: 3, value: 13 },
      HT: { base_value: 11, modifier: -1, value: 10 },
    });

    expect(result.character_points).toEqual({
      ST: 20,
      DX: -20,
      IQ: 0,
      HT: 10,
    });
  });
});
