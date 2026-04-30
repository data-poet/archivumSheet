const { buildCharacter } = require("engine/character/buildCharacter");

describe("BUILD CHARACTER", () => {
  const mockInput = {
    advantages: ["ADV-001"],
    disadvantages: ["DIS-001"],

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

    skills: {
      "SKILL-000": { base: 14, modifier: 0 },
      "SKILL-001": { base: 12, modifier: 1 },
    },

    weight: 40,
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
      expect(character).toHaveProperty("skills");
      expect(character).toHaveProperty("character_points");
    });
  });

  describe("Skills integration", () => {
    it("Should include selected skills only", () => {
      const { character } = buildCharacter(mockInput);

      const skills = character.skills;

      expect(typeof skills).toBe("object");

      const skillIds = Object.keys(skills);

      expect(skillIds.length).toBe(Object.keys(mockInput.skills).length);

      skillIds.forEach((id) => {
        expect(Object.keys(mockInput.skills)).toContain(id);
      });
    });

    it("Should compute skills points correctly", () => {
      const { character } = buildCharacter(mockInput);

      const skills = Object.values(character.skills);

      const allHavePoints = skills.every((s) => typeof s.points === "number");

      expect(allHavePoints).toBe(true);

      const manualSum = skills.reduce((sum, s) => sum + s.points, 0);

      expect(character.character_points.skills).toBe(manualSum);
    });
  });

  describe("Primary and Secondary integration", () => {
    it("Should include both primary and secondary attributes", () => {
      const { character } = buildCharacter(mockInput);

      expect(character.primary_attributes).toBeDefined();
      expect(character.secondary_attributes).toBeDefined();
    });
  });

  describe("Movement integration", () => {
    it("Should reflect weight impact on Movement", () => {
      const { character } = buildCharacter(mockInput);

      const movement = character.secondary_attributes.Movement;

      const baseSpeed =
        (character.primary_attributes.HT.value +
          character.primary_attributes.DX.value) /
        4;

      const expected = Math.floor(baseSpeed - 1);

      expect(movement.base).toBe(expected);
    });
  });

  describe("Points aggregation", () => {
    it("Should include all point categories including skills", () => {
      const { character } = buildCharacter(mockInput);

      const points = character.character_points;

      expect(points).toHaveProperty("primary_attributes");
      expect(points).toHaveProperty("secondary_attributes");
      expect(points).toHaveProperty("advantages");
      expect(points).toHaveProperty("disadvantages");
      expect(points).toHaveProperty("skills");
    });
  });

  describe("Advantages and Disadvantages", () => {
    it("Should return empty objects when none provided", () => {
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
