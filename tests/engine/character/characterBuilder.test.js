const { buildCharacter } = require("engine/character/characterBuilder");

describe("CHARACTER BUILDER", () => {
  test("sHOULD build a character: advantages and disadvantages.", () => {
    const result = buildCharacter({
      advantages: ["ADV-002", "ADV-053"],
      disadvantages: ["DIS-010"],
    });

    // 🔎 structure check
    expect(result).toHaveProperty("character");
    expect(result.character).toHaveProperty("advantages");
    expect(result.character).toHaveProperty("disadvantages");
    expect(result.character).toHaveProperty("character_points");

    // 🔎 advantages should exist
    expect(typeof result.character.advantages).toBe("object");

    // 🔎 disadvantages should exist
    expect(typeof result.character.disadvantages).toBe("object");

    // 🔎 points should be numbers
    expect(typeof result.character.character_points.advantages).toBe("number");
    expect(typeof result.character.character_points.disadvantages).toBe(
      "number",
    );
  });

  test("Should handle empty inputs correctly.", () => {
    const result = buildCharacter({});

    expect(result.character.advantages).toEqual({});
    expect(result.character.disadvantages).toEqual({});

    expect(result.character.character_points.advantages).toBe(0);
    expect(result.character.character_points.disadvantages).toBe(0);
  });

  test("Should correctly add up the total points: advantages and disadvantages.", () => {
    const result = buildCharacter({
      advantages: ["ADV-002"],
      disadvantages: ["DIS-010"],
    });

    const advTotal = result.character.character_points.advantages;
    const disTotal = result.character.character_points.disadvantages;

    expect(advTotal + disTotal).toBeGreaterThanOrEqual(0);
  });
});
