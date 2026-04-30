const {
  buildCharacterPrimary,
} = require("engine/character/buildCharacterPrimary");

const assertShape = require("tests/helpers/assertShape");

describe("BUILD CHARACTER PRIMARY", () => {
  const mockInput = {
    advantages: [],
    disadvantages: [],
    primaryAttributes: {
      ST: { bought: 2 },
      HT: { bought: 1 },
      IQ: { bought: 0 },
      DX: { bought: 0 },
    },
  };

  describe("Basic structure", () => {
    it("Should return expected sections", () => {
      const result = buildCharacterPrimary(mockInput);

      assertShape(result, [
        "primary_attributes",
        "advantages",
        "disadvantages",
        "character_points",
      ]);
    });
  });

  describe("Primary attributes", () => {
    it("Should correctly build primary attributes", () => {
      const result = buildCharacterPrimary(mockInput);

      expect(result.primary_attributes).toHaveProperty("ST");
      expect(result.primary_attributes).toHaveProperty("HT");
      expect(result.primary_attributes).toHaveProperty("IQ");
      expect(result.primary_attributes).toHaveProperty("DX");
    });

    it("Each attribute should have base_value, modifier, value", () => {
      const result = buildCharacterPrimary(mockInput);

      Object.values(result.primary_attributes).forEach((attr) => {
        expect(attr).toHaveProperty("base_value");
        expect(attr).toHaveProperty("modifier");
        expect(attr).toHaveProperty("value");
      });
    });
  });

  describe("Advantages and Disadvantages", () => {
    it("Should return objects (not arrays)", () => {
      const result = buildCharacterPrimary(mockInput);

      expect(typeof result.advantages).toBe("object");
      expect(typeof result.disadvantages).toBe("object");
    });
  });

  describe("Points", () => {
    it("Should include all point categories", () => {
      const result = buildCharacterPrimary(mockInput);

      assertShape(result.character_points, [
        "primary_attributes",
        "advantages",
        "disadvantages",
      ]);
    });

    it("Primary attributes points should be numbers", () => {
      const result = buildCharacterPrimary(mockInput);

      Object.values(result.character_points.primary_attributes).forEach(
        (value) => {
          expect(typeof value).toBe("number");
        },
      );
    });
  });

  describe("Consistency", () => {
    it("Value should reflect base_value + modifier", () => {
      const result = buildCharacterPrimary(mockInput);

      const ST = result.primary_attributes.ST;

      expect(ST.value).toBe(ST.base_value + ST.modifier);
    });
  });
});
