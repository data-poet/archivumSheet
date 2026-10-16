const { ADVANTAGE } = require("tests/helpers/dataRefs");
const { buildAdvantages } = require("engine/character/js/traits/advantages");
const { REFLEXOS_EM_COMBATE_ID } = require("helpers/ids.js");

const assertShape = require("tests/helpers/assertShape");
const assertNumericMap = require("tests/helpers/assertNumericMap");

describe("ADVANTAGES", () => {
  test("Should correctly calculate the selected advantages.", () => {
    const selected = [
      ADVANTAGE.muitoBonito,
      ADVANTAGE.memoriaEideticaTotal,
      REFLEXOS_EM_COMBATE_ID,
    ];

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
    const selected = [
      ADVANTAGE.muitoBonito,
      ADVANTAGE.memoriaEideticaTotal,
      REFLEXOS_EM_COMBATE_ID,
    ];

    const result = buildAdvantages(selected);

    const cost = Object.values(result.advantages).reduce(
      (total, adv) => total + adv.points,
      0,
    );

    expect(result.character_points.advantages).toBe(cost);
  });

  test("Should mark innate advantages with is_race_innate and cost 0", () => {
    const result = buildAdvantages(
      [ADVANTAGE.muitoBonito],
      [ADVANTAGE.muitoBonito],
    );

    expect(result.advantages[ADVANTAGE.muitoBonito].is_race_innate).toBe(true);
    expect(result.advantages[ADVANTAGE.muitoBonito].is_enchantment).toBe(false);
    expect(result.advantages[ADVANTAGE.muitoBonito].points).toBe(0);
    expect(result.character_points.advantages).toBe(0);
  });

  test("Should mark enchantment-granted advantages with is_enchantment and cost 0", () => {
    const result = buildAdvantages(
      [ADVANTAGE.muitoBonito],
      [],
      [ADVANTAGE.muitoBonito],
    );

    expect(result.advantages[ADVANTAGE.muitoBonito].is_enchantment).toBe(true);
    expect(result.advantages[ADVANTAGE.muitoBonito].is_race_innate).toBe(false);
    expect(result.advantages[ADVANTAGE.muitoBonito].points).toBe(0);
    expect(result.character_points.advantages).toBe(0);
  });

  test("Should default is_race_innate and is_enchantment to false for a normally-purchased advantage", () => {
    const result = buildAdvantages([ADVANTAGE.muitoBonito]);

    expect(result.advantages[ADVANTAGE.muitoBonito].is_race_innate).toBe(false);
    expect(result.advantages[ADVANTAGE.muitoBonito].is_enchantment).toBe(false);
    expect(result.advantages[ADVANTAGE.muitoBonito].points).not.toBe(0);
  });

  test("Should let is_race_innate take priority if an id is somehow both innate and enchantment-granted", () => {
    const result = buildAdvantages(
      [ADVANTAGE.muitoBonito],
      [ADVANTAGE.muitoBonito],
      [ADVANTAGE.muitoBonito],
    );

    expect(result.advantages[ADVANTAGE.muitoBonito].is_race_innate).toBe(true);
    expect(result.advantages[ADVANTAGE.muitoBonito].is_enchantment).toBe(false);
    expect(result.advantages[ADVANTAGE.muitoBonito].points).toBe(0);
  });

  test("Should mark meta-race-granted advantages with is_meta_race and cost 0", () => {
    const result = buildAdvantages(
      [ADVANTAGE.muitoBonito],
      [],
      [],
      [ADVANTAGE.muitoBonito],
    );

    expect(result.advantages[ADVANTAGE.muitoBonito].is_meta_race).toBe(true);
    expect(result.advantages[ADVANTAGE.muitoBonito].is_race_innate).toBe(false);
    expect(result.advantages[ADVANTAGE.muitoBonito].is_enchantment).toBe(false);
    expect(result.advantages[ADVANTAGE.muitoBonito].points).toBe(0);
    expect(result.character_points.advantages).toBe(0);
  });

  test("Should default is_meta_race to false for a normally-purchased advantage", () => {
    const result = buildAdvantages([ADVANTAGE.muitoBonito]);

    expect(result.advantages[ADVANTAGE.muitoBonito].is_meta_race).toBe(false);
  });

  test("Should let is_race_innate take priority over is_meta_race", () => {
    const result = buildAdvantages(
      [ADVANTAGE.muitoBonito],
      [ADVANTAGE.muitoBonito],
      [],
      [ADVANTAGE.muitoBonito],
    );

    expect(result.advantages[ADVANTAGE.muitoBonito].is_race_innate).toBe(true);
    expect(result.advantages[ADVANTAGE.muitoBonito].is_meta_race).toBe(false);
    expect(result.advantages[ADVANTAGE.muitoBonito].points).toBe(0);
  });

  test("Should let is_meta_race take priority over is_enchantment", () => {
    const result = buildAdvantages(
      [ADVANTAGE.muitoBonito],
      [],
      [ADVANTAGE.muitoBonito],
      [ADVANTAGE.muitoBonito],
    );

    expect(result.advantages[ADVANTAGE.muitoBonito].is_meta_race).toBe(true);
    expect(result.advantages[ADVANTAGE.muitoBonito].is_enchantment).toBe(false);
    expect(result.advantages[ADVANTAGE.muitoBonito].points).toBe(0);
  });
});
