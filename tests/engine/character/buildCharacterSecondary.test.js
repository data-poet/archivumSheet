const {
  buildCharacterSecondary,
} = require("engine/character/buildCharacterSecondary");

describe("BUILD CHARACTER SECONDARY", () => {
  const mockPrimary = {
    ST: { value: 10 },
    HT: { value: 12 },
    IQ: { value: 11 },
    DX: { value: 9 },
  };

  const selectedSkills = {
    "SKILL-000": { base: 14, modifier: 0 },
    "SKILL-001": { base: 12, modifier: 1 },
  };

  describe("Basic structure", () => {
    it("Should return secondary_attributes, skills and character_points", () => {
      const result = buildCharacterSecondary({
        primary_attributes: mockPrimary,
        skills: selectedSkills,
      });

      expect(result).toHaveProperty("secondary_attributes");
      expect(result).toHaveProperty("skills");
      expect(result).toHaveProperty("character_points");

      expect(result.character_points).toHaveProperty("secondary_attributes");
      expect(result.character_points).toHaveProperty("skills");
    });
  });

  describe("Secondary attributes structure", () => {
    it("Should return all expected secondary attributes", () => {
      const { secondary_attributes } = buildCharacterSecondary({
        primary_attributes: mockPrimary,
      });

      const expected = [
        "HP",
        "Mana",
        "Toxicity",
        "Will",
        "Vision",
        "Hearing",
        "Smell",
        "BasicSpeed",
        "Movement",
      ];

      expected.forEach((key) => {
        expect(secondary_attributes).toHaveProperty(key);
      });
    });

    it("Each attribute should have base, bought, modifier, value", () => {
      const { secondary_attributes } = buildCharacterSecondary({
        primary_attributes: mockPrimary,
      });

      Object.values(secondary_attributes).forEach((attr) => {
        expect(attr).toHaveProperty("base");
        expect(attr).toHaveProperty("bought");
        expect(attr).toHaveProperty("modifier");
        expect(attr).toHaveProperty("value");
      });
    });
  });

  describe("Skills integration", () => {
    it("Should include selected skills only", () => {
      const result = buildCharacterSecondary({
        primary_attributes: mockPrimary,
        skills: selectedSkills,
      });

      const skillIds = Object.keys(result.skills);

      expect(skillIds.length).toBe(Object.keys(selectedSkills).length);

      skillIds.forEach((id) => {
        expect(Object.keys(selectedSkills)).toContain(id);
      });
    });

    it("Should compute skill points correctly", () => {
      const result = buildCharacterSecondary({
        primary_attributes: mockPrimary,
        skills: selectedSkills,
      });

      const skills = Object.values(result.skills);

      expect(skills.length).toBe(Object.keys(selectedSkills).length);

      const allHavePoints = skills.every((s) => typeof s.points === "number");

      expect(allHavePoints).toBe(true);

      const manualSum = skills.reduce((sum, s) => sum + s.points, 0);

      expect(result.character_points.skills).toBe(manualSum);
    });
  });

  describe("Base calculations", () => {
    it("Should correctly calculate HP base", () => {
      const { secondary_attributes } = buildCharacterSecondary({
        primary_attributes: mockPrimary,
      });

      const expectedHP = Math.floor((12 * 4 + 10 * 2) / 2);

      expect(secondary_attributes.HP.base).toBe(expectedHP);
    });

    it("Should correctly calculate Mana base", () => {
      const { secondary_attributes } = buildCharacterSecondary({
        primary_attributes: mockPrimary,
      });

      const expectedMana = Math.floor((11 * 4 + 12 * 2) / 2);

      expect(secondary_attributes.Mana.base).toBe(expectedMana);
    });

    it("Should correctly calculate BasicSpeed base", () => {
      const { secondary_attributes } = buildCharacterSecondary({
        primary_attributes: mockPrimary,
      });

      const expected = (12 + 9) / 4;

      expect(secondary_attributes.BasicSpeed.base).toBe(expected);
    });
  });

  describe("Bought and modifiers", () => {
    it("Should apply bought and modifier correctly", () => {
      const { secondary_attributes } = buildCharacterSecondary({
        primary_attributes: mockPrimary,
        secondaryAttributes: {
          HP: { bought: 2, modifier: 3 },
        },
      });

      const HP = secondary_attributes.HP;

      expect(HP.value).toBe(HP.base + 2 + 3);
    });

    it("Should apply step = 0.25 for BasicSpeed", () => {
      const { secondary_attributes } = buildCharacterSecondary({
        primary_attributes: mockPrimary,
        secondaryAttributes: {
          BasicSpeed: { bought: 2 },
        },
      });

      const speed = secondary_attributes.BasicSpeed;

      expect(speed.value).toBe(speed.base + 2 * 0.25);
    });
  });

  describe("Movement behavior", () => {
    it("Should be affected by weight", () => {
      const weight = 40;

      const { secondary_attributes } = buildCharacterSecondary({
        primary_attributes: mockPrimary,
        weight,
      });

      const expected = Math.floor(5.25 - 1);

      expect(secondary_attributes.Movement.base).toBe(expected);
    });

    it("Should increase if BasicSpeed increases", () => {
      const { secondary_attributes } = buildCharacterSecondary({
        primary_attributes: mockPrimary,
        secondaryAttributes: {
          BasicSpeed: { bought: 2 },
        },
      });

      const expectedSpeed = 5.25 + 2 * 0.25;

      expect(secondary_attributes.Movement.base).toBe(
        Math.floor(expectedSpeed),
      );
    });
  });

  describe("Points system", () => {
    it("Should calculate secondary attribute points correctly", () => {
      const { character_points } = buildCharacterSecondary({
        primary_attributes: mockPrimary,
        secondaryAttributes: {
          HP: { bought: 2 },
          Mana: { bought: 1 },
        },
      });

      const points = character_points.secondary_attributes;

      expect(typeof points).toBe("object");

      Object.values(points).forEach((p) => {
        expect(typeof p).toBe("number");
      });
    });

    it("Should return 0 points when nothing is bought", () => {
      const { character_points } = buildCharacterSecondary({
        primary_attributes: mockPrimary,
      });

      Object.values(character_points.secondary_attributes).forEach((p) => {
        expect(p).toBe(0);
      });
    });

    it("Should include skill points in total system", () => {
      const { character_points } = buildCharacterSecondary({
        primary_attributes: mockPrimary,
        skills: selectedSkills,
      });

      expect(typeof character_points.skills).toBe("number");
    });
  });

  describe("Consistency", () => {
    it("Should be deterministic", () => {
      const r1 = buildCharacterSecondary({
        primary_attributes: mockPrimary,
        skills: selectedSkills,
      });

      const r2 = buildCharacterSecondary({
        primary_attributes: mockPrimary,
        skills: selectedSkills,
      });

      expect(r1.character_points.skills).toBe(r2.character_points.skills);
    });
  });
});
