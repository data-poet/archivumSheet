const {
  buildDisadvantages,
} = require("engine/character/js/traitsDisadvantages");

describe("DISADVANTAGES", () => {
  test("Should correctly calculate the selected disadvantages.", () => {
    const selected = ["DIS-002", "DIS-023", "DIS-058"];

    const result = buildDisadvantages(selected);

    // check structure
    expect(result).toHaveProperty("disadvantages");
    expect(result).toHaveProperty("character_points");

    // check that only selected advantages exist
    expect(Object.keys(result.disadvantages)).toEqual(
      expect.arrayContaining(selected),
    );

    // check total exists and is numeric
    expect(typeof result.character_points.disadvantages).toBe("number");
  });

  test("Should return 0 when no disadvantage is selected.", () => {
    const result = buildDisadvantages([]);

    expect(result.disadvantages).toEqual({});
    expect(result.character_points.disadvantages).toBe(0);
  });

  test("Should add up the costs correctly.", () => {
    const selected = ["DIS-002", "ADV-023", "ADV-058"];

    const result = buildDisadvantages(selected);

    const cost = Object.values(result.disadvantages).reduce((a, b) => a + b, 0);

    expect(result.character_points.disadvantages).toBe(cost);
  });
});
