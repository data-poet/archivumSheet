const { buildTraitsEffects } = require("engine/character/js/traitsEffects");

describe("TRAITS EFFECTS", () => {
  describe("Advantages", () => {
    test("should apply Dodge +1 for ADV-055", () => {
      const result = buildTraitsEffects({
        advantages: ["ADV-055"],
      });

      expect(result.secondary.Dodge.base).toBe(1);
    });

    test("should apply highest Will bonus from group", () => {
      const result = buildTraitsEffects({
        advantages: ["ADV-088", "ADV-090", "ADV-089"], // highest = 3
      });

      expect(result.secondary.Will.base).toBe(3);
    });

    test("should apply Hearing bonus", () => {
      const result = buildTraitsEffects({
        advantages: ["ADV-023"], // = 3
      });

      expect(result.secondary.Hearing.base).toBe(3);
    });

    test("should apply Smell bonus", () => {
      const result = buildTraitsEffects({
        advantages: ["ADV-028"], // = 3
      });

      expect(result.secondary.Smell.base).toBe(3);
    });

    test("should apply Vision bonus", () => {
      const result = buildTraitsEffects({
        advantages: ["ADV-040"], // = 4
      });

      expect(result.secondary.Vision.base).toBe(4);
    });

    test("should apply full sense bonus to all senses", () => {
      const result = buildTraitsEffects({
        advantages: ["ADV-033"], // = 3
      });

      expect(result.secondary.Vision.base).toBe(3);
      expect(result.secondary.Hearing.base).toBe(3);
      expect(result.secondary.Smell.base).toBe(3);
    });

    test("should stack full sense with individual sense", () => {
      const result = buildTraitsEffects({
        advantages: ["ADV-033", "ADV-040"], // full sense 3 + vision 4
      });

      expect(result.secondary.Vision.base).toBe(7);
      expect(result.secondary.Hearing.base).toBe(3);
      expect(result.secondary.Smell.base).toBe(3);
    });
  });

  describe("Disadvantages", () => {
    test("should apply Will penalty", () => {
      const result = buildTraitsEffects({
        disadvantages: ["DIS-102"], // = -3
      });

      expect(result.secondary.Will.base).toBe(-3);
    });

    test("should pick highest Will penalty from group", () => {
      const result = buildTraitsEffects({
        disadvantages: ["DIS-100", "DIS-104", "DIS-102"], // highest = 5
      });

      expect(result.secondary.Will.base).toBe(-5);
    });
  });

  describe("Stacking", () => {
    test("should combine advantage and disadvantage on Will", () => {
      const result = buildTraitsEffects({
        advantages: ["ADV-090"], // +3
        disadvantages: ["DIS-102"], // -3
      });

      expect(result.secondary.Will.base).toBe(0);
    });

    test("should handle empty input", () => {
      const result = buildTraitsEffects({});

      expect(result).toEqual({
        secondary: {},
        primary: {},
        damage: {},
      });
    });
  });
});
