const { buildTraitsEffects } = require("engine/character/js/traits/effects");
const {
  WILL_BONUS_TIERS,
  WILL_PENALTY_TIERS,
  HEARING_BONUS_TIERS,
  SMELL_BONUS_TIERS,
  VISION_BONUS_TIERS,
  FULL_SENSE_BONUS_TIERS,
  REFLEXOS_EM_COMBATE_ID,
} = require("helpers/ids.js");

const assertShape = require("tests/helpers/assertShape");

describe("TRAITS EFFECTS", () => {
  describe("Advantages", () => {
    test("should apply Dodge +1 for Reflexos em Combate", () => {
      const result = buildTraitsEffects({
        advantages: { [REFLEXOS_EM_COMBATE_ID]: {} },
      });

      expect(result.secondary.Dodge.base).toBe(1);
    });

    test("should apply highest Will bonus from group", () => {
      const [first, second, highest] = Object.keys(WILL_BONUS_TIERS);

      const result = buildTraitsEffects({
        advantages: {
          [first]: {},
          [highest]: {},
          [second]: {},
        },
      });

      expect(result.secondary.Will.base).toBe(WILL_BONUS_TIERS[highest]);
    });

    test("should apply Hearing bonus", () => {
      const id = Object.keys(HEARING_BONUS_TIERS)[2];

      const result = buildTraitsEffects({
        advantages: { [id]: {} },
      });

      expect(result.secondary.Hearing.base).toBe(HEARING_BONUS_TIERS[id]);
    });

    test("should apply Smell bonus", () => {
      const id = Object.keys(SMELL_BONUS_TIERS)[2];

      const result = buildTraitsEffects({
        advantages: { [id]: {} },
      });

      expect(result.secondary.Smell.base).toBe(SMELL_BONUS_TIERS[id]);
    });

    test("should apply Vision bonus", () => {
      const id = Object.keys(VISION_BONUS_TIERS)[3];

      const result = buildTraitsEffects({
        advantages: { [id]: {} },
      });

      expect(result.secondary.Vision.base).toBe(VISION_BONUS_TIERS[id]);
    });

    test("should apply full sense bonus to all senses", () => {
      const id = Object.keys(FULL_SENSE_BONUS_TIERS)[2];

      const result = buildTraitsEffects({
        advantages: { [id]: {} },
      });

      expect(result.secondary.Vision.base).toBe(FULL_SENSE_BONUS_TIERS[id]);
      expect(result.secondary.Hearing.base).toBe(FULL_SENSE_BONUS_TIERS[id]);
      expect(result.secondary.Smell.base).toBe(FULL_SENSE_BONUS_TIERS[id]);
    });

    test("should stack full sense with individual sense", () => {
      const fullSenseId = Object.keys(FULL_SENSE_BONUS_TIERS)[2];
      const visionId = Object.keys(VISION_BONUS_TIERS)[3];

      const result = buildTraitsEffects({
        advantages: {
          [fullSenseId]: {},
          [visionId]: {},
        },
      });

      expect(result.secondary.Vision.base).toBe(
        FULL_SENSE_BONUS_TIERS[fullSenseId] + VISION_BONUS_TIERS[visionId],
      );
      expect(result.secondary.Hearing.base).toBe(
        FULL_SENSE_BONUS_TIERS[fullSenseId],
      );
      expect(result.secondary.Smell.base).toBe(
        FULL_SENSE_BONUS_TIERS[fullSenseId],
      );
    });
  });

  describe("Disadvantages", () => {
    test("should apply Will penalty", () => {
      const id = Object.keys(WILL_PENALTY_TIERS)[2];

      const result = buildTraitsEffects({
        disadvantages: { [id]: {} },
      });

      expect(result.secondary.Will.base).toBe(-WILL_PENALTY_TIERS[id]);
    });

    test("should pick highest Will penalty from group", () => {
      const keys = Object.keys(WILL_PENALTY_TIERS);
      const [first, third, last] = [keys[0], keys[2], keys[keys.length - 1]];

      const result = buildTraitsEffects({
        disadvantages: {
          [first]: {},
          [last]: {},
          [third]: {},
        },
      });

      expect(result.secondary.Will.base).toBe(-WILL_PENALTY_TIERS[last]);
    });
  });

  describe("Stacking", () => {
    test("should combine advantage and disadvantage on Will", () => {
      const advId = Object.keys(WILL_BONUS_TIERS)[2];
      const disId = Object.keys(WILL_PENALTY_TIERS)[2];

      const result = buildTraitsEffects({
        advantages: { [advId]: {} },
        disadvantages: { [disId]: {} },
      });

      expect(result.secondary.Will.base).toBe(
        WILL_BONUS_TIERS[advId] - WILL_PENALTY_TIERS[disId],
      );
    });

    test("should handle empty input", () => {
      const result = buildTraitsEffects({});

      assertShape(result, ["secondary", "primary", "damage"]);
    });
  });
});
