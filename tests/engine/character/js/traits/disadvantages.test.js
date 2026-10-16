const {
  buildDisadvantages,
} = require("engine/character/js/traits/disadvantages");

const { DISADVANTAGE } = require("tests/helpers/dataRefs");
const assertShape = require("tests/helpers/assertShape");
const assertNumericMap = require("tests/helpers/assertNumericMap");

describe("DISADVANTAGES", () => {
  test("Should correctly calculate the selected disadvantages.", () => {
    const selected = [
      DISADVANTAGE.hediondo,
      DISADVANTAGE.epilepsia,
      DISADVANTAGE.compulsaoPesada,
    ];

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
    const selected = [
      DISADVANTAGE.hediondo,
      DISADVANTAGE.epilepsia,
      DISADVANTAGE.compulsaoPesada,
    ];

    const result = buildDisadvantages(selected);

    const cost = Object.values(result.disadvantages).reduce(
      (total, dis) => total + dis.points,
      0,
    );

    expect(result.character_points.disadvantages).toBe(cost);
  });

  test("Should mark enchantment-granted disadvantages with is_enchantment and cost 0", () => {
    const result = buildDisadvantages(
      [DISADVANTAGE.aparenciaDesagradavel],
      [],
      [DISADVANTAGE.aparenciaDesagradavel],
    );

    expect(
      result.disadvantages[DISADVANTAGE.aparenciaDesagradavel].is_enchantment,
    ).toBe(true);
    expect(
      result.disadvantages[DISADVANTAGE.aparenciaDesagradavel].is_race_innate,
    ).toBe(false);
    expect(
      result.disadvantages[DISADVANTAGE.aparenciaDesagradavel].points,
    ).toBe(0);
    expect(result.character_points.disadvantages).toBe(0);
  });

  test("Should default is_enchantment to false for a normally-purchased disadvantage", () => {
    const result = buildDisadvantages([DISADVANTAGE.aparenciaDesagradavel]);

    expect(
      result.disadvantages[DISADVANTAGE.aparenciaDesagradavel].is_enchantment,
    ).toBe(false);
    expect(
      result.disadvantages[DISADVANTAGE.aparenciaDesagradavel].points,
    ).not.toBe(0);
  });

  test("Should mark meta-race-granted disadvantages with is_meta_race and cost 0", () => {
    const result = buildDisadvantages(
      [DISADVANTAGE.aparenciaDesagradavel],
      [],
      [],
      [DISADVANTAGE.aparenciaDesagradavel],
    );

    expect(
      result.disadvantages[DISADVANTAGE.aparenciaDesagradavel].is_meta_race,
    ).toBe(true);
    expect(
      result.disadvantages[DISADVANTAGE.aparenciaDesagradavel].is_race_innate,
    ).toBe(false);
    expect(
      result.disadvantages[DISADVANTAGE.aparenciaDesagradavel].is_enchantment,
    ).toBe(false);
    expect(
      result.disadvantages[DISADVANTAGE.aparenciaDesagradavel].points,
    ).toBe(0);
  });

  test("Should let is_meta_race take priority over is_enchantment", () => {
    const result = buildDisadvantages(
      [DISADVANTAGE.aparenciaDesagradavel],
      [],
      [DISADVANTAGE.aparenciaDesagradavel],
      [DISADVANTAGE.aparenciaDesagradavel],
    );

    expect(
      result.disadvantages[DISADVANTAGE.aparenciaDesagradavel].is_meta_race,
    ).toBe(true);
    expect(
      result.disadvantages[DISADVANTAGE.aparenciaDesagradavel].is_enchantment,
    ).toBe(false);
    expect(
      result.disadvantages[DISADVANTAGE.aparenciaDesagradavel].points,
    ).toBe(0);
  });
});
