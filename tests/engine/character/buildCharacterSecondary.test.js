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

  describe("Basic structure", () => {
    it("Should return secondary_attributes and character_points", () => {
      const result = buildCharacterSecondary({
        primary_attributes: mockPrimary,
      });

      expect(result).toHaveProperty("secondary_attributes");
      expect(result).toHaveProperty("character_points");
      expect(result.character_points).toHaveProperty("secondary_attributes");
    });
  });

  describe("Secondary attributes structure", () => {
    it("Should return all expected secondary attributes", () => {
      const { secondary_attributes } = buildCharacterSecondary({
        primary_attributes: mockPrimary,
      });

      expect(secondary_attributes).toHaveProperty("HP");
      expect(secondary_attributes).toHaveProperty("Mana");
      expect(secondary_attributes).toHaveProperty("Toxicity");
      expect(secondary_attributes).toHaveProperty("Will");
      expect(secondary_attributes).toHaveProperty("Vision");
      expect(secondary_attributes).toHaveProperty("Hearing");
      expect(secondary_attributes).toHaveProperty("Smell");
      expect(secondary_attributes).toHaveProperty("BasicSpeed");
      expect(secondary_attributes).toHaveProperty("Movement");
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

  describe("Base calculations", () => {
    it("Should correctly calculate base values", () => {
      const { secondary_attributes } = buildCharacterSecondary({
        primary_attributes: mockPrimary,
      });

      expect(secondary_attributes.HP.base).toBe(
        Math.floor((12 * 4 + 10 * 2) / 2),
      );

      expect(secondary_attributes.Mana.base).toBe(
        Math.floor((11 * 4 + 12 * 2) / 2),
      );

      expect(secondary_attributes.Toxicity.base).toBe(
        Math.floor((12 * 4 + 10 * 2 + 11 * 2) / 3),
      );

      expect(secondary_attributes.BasicSpeed.base).toBe((12 + 9) / 4);

      expect(secondary_attributes.Movement.base).toBe(Math.floor(5.25));
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
      const weight = 40; // ST=10 → medium threshold → -1

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
    it("Should calculate points correctly (5 per bought)", () => {
      const { character_points } = buildCharacterSecondary({
        primary_attributes: mockPrimary,
        secondaryAttributes: {
          HP: { bought: 2 },
          Mana: { bought: 1 },
        },
      });

      const points = character_points.secondary_attributes;

      expect(points.HP).toBe(10);
      expect(points.Mana).toBe(5);
    });

    it("Should return 0 points when nothing is bought", () => {
      const { character_points } = buildCharacterSecondary({
        primary_attributes: mockPrimary,
      });

      Object.values(character_points.secondary_attributes).forEach((p) => {
        expect(p).toBe(0);
      });
    });
  });
});
