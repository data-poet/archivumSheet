const {
  buildDisadvantages,
} = require("engine/character/js/traitsDisadvantages");

const assertShape = require("tests/helpers/assertShape");
const assertNumericMap = require("tests/helpers/assertNumericMap");

describe("DISADVANTAGES", () => {
  test("Should correctly calculate the selected disadvantages.", () => {
    const selected = ["DIS-002", "DIS-023", "DIS-058"];

    const result = buildDisadvantages(selected);

    assertShape(result, ["disadvantages", "character_points"]);

    expect(Object.keys(result.disadvantages)).toEqual(
      expect.arrayContaining(selected),
    );

    assertNumericMap(result.character_points);
    expect(typeof result.character_points.disadvantages).toBe("number");
  });

  test("Should return 0 when no disadvantage is selected.", () => {
    const result = buildDisadvantages([]);

    expect(result.disadvantages).toEqual({});
    expect(result.character_points.disadvantages).toBe(0);
  });

  test("Should add up the costs correctly.", () => {
    const selected = ["DIS-002", "DIS-023", "DIS-058"];

    const result = buildDisadvantages(selected);

    const cost = Object.values(result.disadvantages).reduce(
      (total, dis) => total + dis.points,
      0,
    );

    expect(result.character_points.disadvantages).toBe(cost);
  });
});
