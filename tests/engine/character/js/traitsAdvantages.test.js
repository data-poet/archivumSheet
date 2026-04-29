const { buildAdvantages } = require("engine/character/js/traitsAdvantages");

describe("ADVANTAGES", () => {
  test("Should correctly calculate the selected advantages.", () => {
    const selected = ["ADV-002", "ADV-053", "ADV-055"];

    const result = buildAdvantages(selected);

    // check structure
    expect(result).toHaveProperty("advantages");
    expect(result).toHaveProperty("character_points");

    // check that only selected advantages exist
    expect(Object.keys(result.advantages)).toEqual(
      expect.arrayContaining(selected),
    );

    // check total exists and is numeric
    expect(typeof result.character_points.advantages).toBe("number");
  });

  test("Should return 0 when no advantage is selected.", () => {
    const result = buildAdvantages([]);

    expect(result.advantages).toEqual({});
    expect(result.character_points.advantages).toBe(0);
  });

  test("Should add up the costs correctly.", () => {
    const selected = ["ADV-002", "ADV-053", "ADV-055"];

    const result = buildAdvantages(selected);

    const cost = Object.values(result.advantages).reduce((a, b) => a + b, 0);

    expect(result.character_points.advantages).toBe(cost);
  });
});
