const { buildSheet } = require("engine/buildSheet");

describe("BUILD SHEET", () => {
  const mockInput = {
    character: {
      advantages: [],
      disadvantages: [],
      primaryAttributes: {
        ST: { bought: 2 },
        HT: { bought: 1 },
        IQ: { bought: 0 },
        DX: { bought: 0 },
      },
      secondaryAttributes: {
        BasicSpeed: { bought: 2 },
        HP: { bought: 1 },
      },
    },
    inventory: {
      weight: 40, // should trigger -1 modifier depending on ST
    },
  };

  describe("Structure", () => {
    it("Should return character and inventory sections", () => {
      const result = buildSheet(mockInput);

      expect(result).toHaveProperty("character");
      expect(result).toHaveProperty("inventory");
    });

    it("Character should contain all expected sections", () => {
      const { character } = buildSheet(mockInput);

      expect(character).toHaveProperty("primary_attributes");
      expect(character).toHaveProperty("secondary_attributes");
      expect(character).toHaveProperty("advantages");
      expect(character).toHaveProperty("disadvantages");
      expect(character).toHaveProperty("character_points");
    });
  });

  describe("Primary → Inventory → Secondary flow", () => {
    it("Should use ST from primary attributes in inventory", () => {
      const result = buildSheet(mockInput);

      const ST = result.character.primary_attributes.ST.value;

      // inventory should reflect same ST thresholds
      expect(result.inventory).toHaveProperty("carry_weight");
      expect(result.inventory.carry_weight.limits.none).toBe(ST);
    });

    it("Movement should be affected by weight", () => {
      const result = buildSheet(mockInput);

      const { character } = result;

      const movement = character.secondary_attributes.Movement;

      const HT = character.primary_attributes.HT.value;
      const DX = character.primary_attributes.DX.value;

      const baseSpeed = (HT + DX) / 4 + 2 * 0.25; // includes bought BasicSpeed

      // weight 40 → expected penalty -1 (based on ST ~12)
      const expected = Math.floor(baseSpeed - 1);

      expect(movement.base).toBe(expected);
    });
  });

  describe("Inventory integration", () => {
    it("Should include weight modifier from inventory", () => {
      const result = buildSheet(mockInput);

      expect(result.inventory.carry_weight).toHaveProperty("weight_modifier");
    });

    it("Should correctly classify weight tiers", () => {
      const result = buildSheet(mockInput);

      const { inventory } = result;
      const { limits } = inventory.carry_weight;

      expect(limits).toHaveProperty("none");
      expect(limits).toHaveProperty("light");
      expect(limits).toHaveProperty("medium");
      expect(limits).toHaveProperty("heavy");
      expect(limits).toHaveProperty("veryHeavy");
    });
  });

  describe("Points integrity", () => {
    it("Should include all point categories", () => {
      const { character } = buildSheet(mockInput);

      const points = character.character_points;

      expect(points).toHaveProperty("primary_attributes");
      expect(points).toHaveProperty("secondary_attributes");
      expect(points).toHaveProperty("advantages");
      expect(points).toHaveProperty("disadvantages");
    });

    it("Secondary points should reflect bought values", () => {
      const { character } = buildSheet(mockInput);

      const secondaryPoints = character.character_points.secondary_attributes;

      expect(secondaryPoints.BasicSpeed).toBe(10); // 2 * 5
      expect(secondaryPoints.HP).toBe(5); // 1 * 5
    });
  });

  describe("Consistency", () => {
    it("Primary attributes should have correct structure", () => {
      const { character } = buildSheet(mockInput);

      Object.values(character.primary_attributes).forEach((attr) => {
        expect(attr).toHaveProperty("base_value");
        expect(attr).toHaveProperty("modifier");
        expect(attr).toHaveProperty("value");
      });
    });

    it("Secondary attributes should have correct structure", () => {
      const { character } = buildSheet(mockInput);

      Object.values(character.secondary_attributes).forEach((attr) => {
        expect(attr).toHaveProperty("base");
        expect(attr).toHaveProperty("bought");
        expect(attr).toHaveProperty("modifier");
        expect(attr).toHaveProperty("value");
      });
    });
  });
});
