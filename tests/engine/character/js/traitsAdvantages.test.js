const { buildAdvantages } = require("engine/character/js/traitsAdvantages");

const assertShape = require("tests/helpers/assertShape");
const assertNumericMap = require("tests/helpers/assertNumericMap");

describe("ADVANTAGES", () => {
  test("Should correctly calculate the selected advantages.", () => {
    const selected = ["ADV-002", "ADV-053", "ADV-055"];

    const result = buildAdvantages(selected);

    assertShape(result, ["advantages", "character_points"]);

    expect(Object.keys(result.advantages)).toEqual(
      expect.arrayContaining(selected),
    );

    assertNumericMap(result.character_points);
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

    const cost = Object.values(result.advantages).reduce(
      (total, adv) => total + adv.points,
      0,
    );

    expect(result.character_points.advantages).toBe(cost);
  });
});
