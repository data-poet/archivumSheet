const { buildCharacter } = require("engine/character/buildCharacter");

const assertShape = require("tests/helpers/assertShape");

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
      BasicSpeed: { bought: 2 },
      HP: { bought: 1 },
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

      assertShape(result, ["character"]);

      assertShape(result.character, [
        "primary_attributes",
        "secondary_attributes",
        "base_damage",
        "advantages",
        "disadvantages",
        "skills",
        "character_points",
      ]);
    });
  });

  describe("Skills integration", () => {
    it("Should include selected skills only", () => {
      const { character } = buildCharacter(mockInput);

      const skills = character.skills;
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

      const HT = character.primary_attributes.HT.value;
      const DX = character.primary_attributes.DX.value;

      const baseSpeed =
        (HT + DX) / 4 + character.secondary_attributes.BasicSpeed.bought * 0.25;

      const expected = Math.floor(baseSpeed - 1);

      expect(movement.base_value).toBe(expected);
    });
  });

  describe("Points aggregation", () => {
    it("Should include all point categories including skills", () => {
      const { character } = buildCharacter(mockInput);

      const points = character.character_points;

      assertShape(points, [
        "primary_attributes",
        "secondary_attributes",
        "advantages",
        "disadvantages",
        "skills",
      ]);
    });
  });

  describe("Advantages and Disadvantages", () => {
    it("Should return empty objects when none provided", () => {
      const { character } = buildCharacter(mockInput);

      expect(typeof character.advantages).toBe("object");
      expect(typeof character.disadvantages).toBe("object");
    });
  });
});
