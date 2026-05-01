const {
  buildPrimaryAttributes,
} = require("engine/character/js/attributesPrimary");

const assertShape = require("tests/helpers/assertShape");
const assertNumericMap = require("tests/helpers/assertNumericMap");
const assertBasePlusModifier = require("tests/helpers/assertBasePlusModifier");

describe("PRIMARY ATTRIBUTES", () => {
  test("Should build all attributes with correct structure", () => {
    const result = buildPrimaryAttributes({});

    assertShape(result, ["primary_attributes", "character_points"]);

    ["ST", "DX", "IQ", "HT"].forEach((attr) => {
      expect(result.primary_attributes).toHaveProperty(attr);
      expect(result.character_points).toHaveProperty(attr);

      const attribute = result.primary_attributes[attr];

      assertNumericMap({
        base_value: attribute.base_value,
        modifier: attribute.modifier,
        value: attribute.value,
        points: attribute.points,
      });

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
        points: 0,
      });

      expect(result.character_points[attr]).toBe(0);
    });
  });

  test("Should correctly calculate final value (base + modifier)", () => {
    const result = buildPrimaryAttributes({
      ST: { base_value: 12, modifier: 2 },
    });

    assertBasePlusModifier(result.primary_attributes.ST, "base_value");
  });

  test("Should calculate correct positive costs", () => {
    const result = buildPrimaryAttributes({
      ST: { base_value: 12 },
      DX: { base_value: 11 },
      IQ: { base_value: 13 },
      HT: { base_value: 11 },
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
      ST: { base_value: 8 },
      DX: { base_value: 9 },
      IQ: { base_value: 9 },
      HT: { base_value: 8 },
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
    expect(result.character_points.ST).toBe(0);
  });

  test("Should handle mixed attributes correctly", () => {
    const result = buildPrimaryAttributes({
      ST: { base_value: 12, modifier: 1 },
      DX: { base_value: 9, modifier: 0 },
      IQ: { base_value: 10, modifier: 3 },
      HT: { base_value: 11, modifier: -1 },
    });

    expect(result.primary_attributes).toEqual({
      ST: { base_value: 12, modifier: 1, value: 13, points: 20 },
      DX: { base_value: 9, modifier: 0, value: 9, points: -20 },
      IQ: { base_value: 10, modifier: 3, value: 13, points: 0 },
      HT: { base_value: 11, modifier: -1, value: 10, points: 10 },
    });

    expect(result.character_points).toEqual({
      ST: 20,
      DX: -20,
      IQ: 0,
      HT: 10,
    });
  });
});
