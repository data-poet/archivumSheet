const { buildCharacter } = require("engine/character/buildCharacter");

describe("BUILD CHARACTER", () => {
  const mockInput = {
    advantages: [],
    disadvantages: [],
    primaryAttributes: {
      ST: { bought: 2 },
      HT: { bought: 1 },
      IQ: { bought: 0 },
      DX: { bought: 0 },
    },
    secondaryAttributes: {
      HP: { bought: 1 },
      BasicSpeed: { bought: 2 },
    },
    weight: 40, // to affect Movement
  };

  describe("Structure", () => {
    it("Should return character object with all sections", () => {
      const result = buildCharacter(mockInput);

      expect(result).toHaveProperty("character");

      const character = result.character;

      expect(character).toHaveProperty("primary_attributes");
      expect(character).toHaveProperty("secondary_attributes");
      expect(character).toHaveProperty("advantages");
      expect(character).toHaveProperty("disadvantages");
      expect(character).toHaveProperty("character_points");
    });
  });

  describe("Primary and Secondary integration", () => {
    it("Should include both primary and secondary attributes", () => {
      const { character } = buildCharacter(mockInput);

      expect(character.primary_attributes).toBeDefined();
      expect(character.secondary_attributes).toBeDefined();
    });

    it("Secondary attributes should depend on primary values", () => {
      const { character } = buildCharacter(mockInput);

      const ST = character.primary_attributes.ST.value;
      const HT = character.primary_attributes.HT.value;

      const expectedHP = Math.floor((HT * 4 + ST * 2) / 2);

      expect(character.secondary_attributes.HP.base).toBe(expectedHP);
    });
  });

  describe("Movement integration", () => {
    it("Should reflect weight impact on Movement", () => {
      const { character } = buildCharacter(mockInput);

      const movement = character.secondary_attributes.Movement;

      // Base speed calculation:
      const baseSpeed =
        (character.primary_attributes.HT.value +
          character.primary_attributes.DX.value) /
        4;

      // weight 40 with ST ~12 → -1 modifier
      const expected = Math.floor(baseSpeed - 1);

      expect(movement.base).toBe(expected);
    });
  });

  describe("Points aggregation", () => {
    it("Should include primary, secondary, advantages, and disadvantages points", () => {
      const { character } = buildCharacter(mockInput);

      const points = character.character_points;

      expect(points).toHaveProperty("primary_attributes");
      expect(points).toHaveProperty("secondary_attributes");
      expect(points).toHaveProperty("advantages");
      expect(points).toHaveProperty("disadvantages");
    });

    it("Secondary points should reflect bought values", () => {
      const { character } = buildCharacter(mockInput);

      const secondaryPoints = character.character_points.secondary_attributes;

      expect(secondaryPoints.HP).toBe(5);
      expect(secondaryPoints.BasicSpeed).toBe(10);
    });
  });

  describe("Advantages and Disadvantages", () => {
    it("Should return empty arrays when none provided", () => {
      const { character } = buildCharacter(mockInput);

      expect(typeof character.advantages).toBe("object");
      expect(typeof character.disadvantages).toBe("object");
    });
  });

  describe("Consistency", () => {
    it("Should maintain attribute structure integrity", () => {
      const { character } = buildCharacter(mockInput);

      Object.values(character.primary_attributes).forEach((attr) => {
        expect(attr).toHaveProperty("base_value");
        expect(attr).toHaveProperty("modifier");
        expect(attr).toHaveProperty("value");
      });

      Object.values(character.secondary_attributes).forEach((attr) => {
        expect(attr).toHaveProperty("base");
        expect(attr).toHaveProperty("bought");
        expect(attr).toHaveProperty("modifier");
        expect(attr).toHaveProperty("value");
      });
    });
  });
});
