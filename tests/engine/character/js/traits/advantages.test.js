const { buildAdvantages } = require("engine/character/js/traits/advantages");

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

  test("Should mark innate advantages with is_race_innate and cost 0", () => {
    const result = buildAdvantages(["ADV-002"], ["ADV-002"]);

    expect(result.advantages["ADV-002"].is_race_innate).toBe(true);
    expect(result.advantages["ADV-002"].is_enchantment).toBe(false);
    expect(result.advantages["ADV-002"].points).toBe(0);
    expect(result.character_points.advantages).toBe(0);
  });

  test("Should mark enchantment-granted advantages with is_enchantment and cost 0", () => {
    const result = buildAdvantages(["ADV-002"], [], ["ADV-002"]);

    expect(result.advantages["ADV-002"].is_enchantment).toBe(true);
    expect(result.advantages["ADV-002"].is_race_innate).toBe(false);
    expect(result.advantages["ADV-002"].points).toBe(0);
    expect(result.character_points.advantages).toBe(0);
  });

  test("Should default is_race_innate and is_enchantment to false for a normally-purchased advantage", () => {
    const result = buildAdvantages(["ADV-002"]);

    expect(result.advantages["ADV-002"].is_race_innate).toBe(false);
    expect(result.advantages["ADV-002"].is_enchantment).toBe(false);
    expect(result.advantages["ADV-002"].points).not.toBe(0);
  });

  test("Should let is_race_innate take priority if an id is somehow both innate and enchantment-granted", () => {
    const result = buildAdvantages(["ADV-002"], ["ADV-002"], ["ADV-002"]);

    expect(result.advantages["ADV-002"].is_race_innate).toBe(true);
    expect(result.advantages["ADV-002"].is_enchantment).toBe(false);
    expect(result.advantages["ADV-002"].points).toBe(0);
  });
});
