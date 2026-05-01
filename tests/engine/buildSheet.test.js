const { buildSheet } = require("engine/buildSheet");
const assertShape = require("tests/helpers/assertShape");

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
      weight: 40,
    },
  };

  describe("Structure", () => {
    it("Should return character and inventory sections", () => {
      const result = buildSheet(mockInput);

      assertShape(result, ["character", "inventory"]);
    });

    it("Character should contain all expected sections", () => {
      const { character } = buildSheet(mockInput);

      assertShape(character, [
        "primary_attributes",
        "secondary_attributes",
        "advantages",
        "disadvantages",
        "character_points",
      ]);
    });
  });

  describe("Primary → Inventory → Secondary flow", () => {
    it("Should use ST from primary attributes in inventory", () => {
      const result = buildSheet(mockInput);

      const ST = result.character.primary_attributes.ST.value;

      expect(result.inventory).toHaveProperty("carry_weight");
      expect(result.inventory.carry_weight.limits.none).toBe(ST);
    });

    it("Movement should be affected by weight", () => {
      const result = buildSheet(mockInput);

      const { character } = result;

      const movement = character.secondary_attributes.Movement;

      const HT = character.primary_attributes.HT.value;
      const DX = character.primary_attributes.DX.value;

      const baseSpeed = (HT + DX) / 4 + 2 * 0.25;

      const expected = Math.floor(baseSpeed - 1);

      expect(movement.base_value).toBe(expected);
    });
  });

  describe("Inventory integration", () => {
    it("Should include weight modifier from inventory", () => {
      const result = buildSheet(mockInput);

      expect(result.inventory.carry_weight).toHaveProperty("weight_modifier");
    });

    it("Should correctly classify weight tiers", () => {
      const result = buildSheet(mockInput);

      const { limits } = result.inventory.carry_weight;

      expect(limits).toHaveProperty("none");
      expect(limits).toHaveProperty("light");
      expect(limits).toHaveProperty("medium");
      expect(limits).toHaveProperty("heavy");
      expect(limits).toHaveProperty("veryHeavy");
    });
  });

  describe("Points integrity (UPDATED MODEL)", () => {
    it("Should include all point categories", () => {
      const { character } = buildSheet(mockInput);

      assertShape(character.character_points, [
        "primary_attributes",
        "secondary_attributes",
        "skills",
        "advantages",
        "disadvantages",
        "spells",
      ]);
    });

    it("Should have numeric totals for attributes", () => {
      const { character } = buildSheet(mockInput);

      const points = character.character_points;

      expect(typeof points.primary_attributes).toBe("number");
      expect(typeof points.secondary_attributes).toBe("number");
    });

    it("Skills, advantages and disadvantages should be numeric totals", () => {
      const { character } = buildSheet(mockInput);

      const points = character.character_points;

      expect(typeof points.skills).toBe("number");
      expect(typeof points.advantages).toBe("number");
      expect(typeof points.disadvantages).toBe("number");
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
        expect(attr).toHaveProperty("base_value");
        expect(attr).toHaveProperty("bought");
        expect(attr).toHaveProperty("modifier");
        expect(attr).toHaveProperty("value");
        expect(attr).toHaveProperty("points");
      });
    });
  });
});
