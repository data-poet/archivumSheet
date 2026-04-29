const { buildCharacter } = require("engine/character/buildCharacter");

describe("CHARACTER BUILDER", () => {
  test("Should build a character: advantages, disadvantages and primary attributes", () => {
    const result = buildCharacter({
      advantages: ["ADV-002", "ADV-053"],
      disadvantages: ["DIS-010"],
      primaryAttributes: {
        ST: { base_value: 12 },
        DX: { base_value: 9 },
      },
    });

    // structure check
    expect(result).toHaveProperty("character");

    const character = result.character;

    expect(character).toHaveProperty("advantages");
    expect(character).toHaveProperty("disadvantages");
    expect(character).toHaveProperty("primary_attributes");
    expect(character).toHaveProperty("character_points");

    // advantages/disadvantages should exist
    expect(typeof character.advantages).toBe("object");
    expect(typeof character.disadvantages).toBe("object");

    // primary attributes structure
    ["ST", "DX", "IQ", "HT"].forEach((attr) => {
      expect(character.primary_attributes).toHaveProperty(attr);

      const attribute = character.primary_attributes[attr];

      expect(typeof attribute.base_value).toBe("number");
      expect(typeof attribute.modifier).toBe("number");
      expect(typeof attribute.value).toBe("number");
    });

    // points should exist
    expect(typeof character.character_points.advantages).toBe("number");
    expect(typeof character.character_points.disadvantages).toBe("number");

    // primaryAttributes points
    expect(character.character_points).toHaveProperty("primary_attributes");

    ["ST", "DX", "IQ", "HT"].forEach((attr) => {
      expect(typeof character.character_points.primary_attributes[attr]).toBe(
        "number",
      );
    });
  });

  test("Should handle empty inputs correctly", () => {
    const result = buildCharacter({});

    const character = result.character;

    expect(character.advantages).toEqual({});
    expect(character.disadvantages).toEqual({});

    // primary attributes should default
    ["ST", "DX", "IQ", "HT"].forEach((attr) => {
      expect(character.primary_attributes[attr]).toEqual({
        base_value: 10,
        modifier: 0,
        value: 10,
      });
    });

    expect(character.character_points.advantages).toBe(0);
    expect(character.character_points.disadvantages).toBe(0);

    // attribute costs default to 0
    ["ST", "DX", "IQ", "HT"].forEach((attr) => {
      expect(character.character_points.primary_attributes[attr]).toBe(0);
    });
  });

  test("should correctly calculate attribute costs independently", () => {
    const result = buildCharacter({
      primaryAttributes: {
        ST: { base_value: 12 }, // +2 → 20
        DX: { base_value: 9 }, // -1 → -20
      },
    });

    const attrPoints = result.character.character_points.primary_attributes;

    expect(attrPoints.ST).toBe(20);
    expect(attrPoints.DX).toBe(-20);
    expect(attrPoints.IQ).toBe(0);
    expect(attrPoints.HT).toBe(0);
  });

  test("Should correctly add up the total points: advantages and disadvantages", () => {
    const result = buildCharacter({
      advantages: ["ADV-002"],
      disadvantages: ["DIS-010"],
    });

    const advTotal = result.character.character_points.advantages;
    const disTotal = result.character.character_points.disadvantages;

    expect(advTotal + disTotal).toBeGreaterThanOrEqual(0);
  });
});
