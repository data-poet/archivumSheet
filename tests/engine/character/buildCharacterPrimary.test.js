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

  describe("Equipped enchantment integration", () => {
    it("Should add enchantmentAttributeModifiers into value without affecting points", () => {
      const result = buildCharacterPrimary({
        ...mockInput,
        enchantmentAttributeModifiers: { ST: 3 },
      });

      const withoutEnchantment = buildCharacterPrimary(mockInput);

      expect(result.primary_attributes.ST.value).toBe(
        withoutEnchantment.primary_attributes.ST.value + 3,
      );
      expect(result.primary_attributes.ST.has_enchantment_modifier).toBe(true);
      expect(result.character_points.primary_attributes.ST).toBe(
        withoutEnchantment.character_points.primary_attributes.ST,
      );
    });

    it("Should set has_enchantment_modifier false for attributes with no equipped enchantment", () => {
      const result = buildCharacterPrimary({
        ...mockInput,
        enchantmentAttributeModifiers: { ST: 3 },
      });

      expect(result.primary_attributes.DX.has_enchantment_modifier).toBe(false);
    });

    it("Should merge enchantmentAdvantageIds into the resolved advantages with is_enchantment true and 0 cost", () => {
      const result = buildCharacterPrimary({
        ...mockInput,
        enchantmentAdvantageIds: ["ADV-002"],
      });

      expect(result.advantages["ADV-002"]).toBeDefined();
      expect(result.advantages["ADV-002"].is_enchantment).toBe(true);
      expect(result.advantages["ADV-002"].points).toBe(0);
      expect(result.character_points.advantages).toBe(0);
    });

    it("Should merge enchantmentDisadvantageIds into the resolved disadvantages with is_enchantment true and 0 cost", () => {
      const result = buildCharacterPrimary({
        ...mockInput,
        enchantmentDisadvantageIds: ["DIS-000"],
      });

      expect(result.disadvantages["DIS-000"]).toBeDefined();
      expect(result.disadvantages["DIS-000"].is_enchantment).toBe(true);
      expect(result.disadvantages["DIS-000"].points).toBe(0);
    });

    it("Should treat an advantage that is BOTH player-selected and enchantment-granted as free — same precedence as the pre-existing is_race_innate behavior", () => {
      const result = buildCharacterPrimary({
        ...mockInput,
        advantages: ["ADV-002"],
        enchantmentAdvantageIds: ["ADV-002"],
      });

      // Mirrors how is_race_innate already behaves for any id present in
      // innateIds, regardless of also being in the player's own selection
      // — enchantmentIds membership is treated the same way here for
      // consistency, not a deliberate new precedence rule.
      expect(result.advantages["ADV-002"].is_enchantment).toBe(true);
      expect(result.advantages["ADV-002"].points).toBe(0);
    });
  });
});
