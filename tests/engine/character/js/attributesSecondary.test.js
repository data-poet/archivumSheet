const {
  buildSecondaryAttributes,
} = require("engine/character/js/attributesSecondary");

describe("SECONDARY ATTRIBUTES", () => {
  const mockPrimary = {
    ST: { value: 10 },
    HT: { value: 12 },
    IQ: { value: 11 },
    DX: { value: 9 },
  };

  describe("Base calculations", () => {
    it("Should correctly calculate all base secondary attributes", () => {
      const { attributes } = buildSecondaryAttributes(mockPrimary);

      expect(attributes.HP.base).toBe(Math.floor((12 * 4 + 10 * 2) / 2)); // 34
      expect(attributes.Mana.base).toBe(Math.floor((11 * 4 + 12 * 2) / 2)); // 34
      expect(attributes.Toxicity.base).toBe(
        Math.floor((12 * 4 + 10 * 2 + 11 * 2) / 3),
      ); // 30

      expect(attributes.Will.base).toBe(11);
      expect(attributes.Vision.base).toBe(11);
      expect(attributes.Hearing.base).toBe(11);
      expect(attributes.Smell.base).toBe(11);

      expect(attributes.BasicSpeed.base).toBe((12 + 9) / 4); // 5.25
      expect(attributes.Movement.base).toBe(Math.floor(5.25)); // 5
      expect(attributes.Dodge.base).toBe(9); // 9
    });
  });

  describe("Default behavior", () => {
    it("Should return base values when no config is provided", () => {
      const { attributes } = buildSecondaryAttributes(mockPrimary);

      Object.entries(attributes).forEach(([key, attr]) => {
        if (key === "Damage") return;

        expect(attr.bought).toBe(0);
        expect(attr.modifier).toBe(0);
        expect(attr.value).toBe(attr.base);
      });
    });
  });

  describe("Bought values", () => {
    it("Should apply bought levels correctly", () => {
      const { attributes } = buildSecondaryAttributes(mockPrimary, {
        HP: { bought: 2 },
        Mana: { bought: 1 },
      });

      expect(attributes.HP.value).toBe(attributes.HP.base + 2);
      expect(attributes.Mana.value).toBe(attributes.Mana.base + 1);
    });

    it("Should clamp bought values to maxBought (default 5)", () => {
      const { attributes } = buildSecondaryAttributes(mockPrimary, {
        HP: { bought: 10 },
      });

      expect(attributes.HP.bought).toBe(5);
      expect(attributes.HP.value).toBe(attributes.HP.base + 5);
    });

    it("Should not allow negative bought values", () => {
      const { attributes } = buildSecondaryAttributes(mockPrimary, {
        HP: { bought: -3 },
      });

      expect(attributes.HP.bought).toBe(0);
      expect(attributes.HP.value).toBe(attributes.HP.base);
    });
  });

  describe("Modifiers", () => {
    it("Should apply modifiers correctly", () => {
      const { attributes } = buildSecondaryAttributes(mockPrimary, {
        HP: { modifier: 5 },
      });

      expect(attributes.HP.value).toBe(attributes.HP.base + 5);
    });

    it("Should combine bought and modifier", () => {
      const { attributes } = buildSecondaryAttributes(mockPrimary, {
        HP: { bought: 2, modifier: 3 },
      });

      expect(attributes.HP.value).toBe(attributes.HP.base + 2 + 3);
    });
  });

  describe("BasicSpeed special rule", () => {
    it("Should use step = 0.25 for BasicSpeed", () => {
      const { attributes } = buildSecondaryAttributes(mockPrimary, {
        BasicSpeed: { bought: 2 },
      });

      expect(attributes.BasicSpeed.value).toBe(
        attributes.BasicSpeed.base + 2 * 0.25,
      );
    });
  });

  describe("Movement", () => {
    it("Should decrease with weight penalties", () => {
      const weight = 40; // triggers -1 modifier for ST=10 (>=30 && <60)
      const { attributes } = buildSecondaryAttributes(mockPrimary, {}, weight);

      const expectedBase = Math.floor(5.25 - 1);
      expect(attributes.Movement.base).toBe(expectedBase);
    });

    it("Should increase if BasicSpeed is increased", () => {
      const { attributes } = buildSecondaryAttributes(mockPrimary, {
        BasicSpeed: { bought: 2 },
      });

      const expectedSpeed = 5.25 + 2 * 0.25;
      expect(attributes.Movement.base).toBe(Math.floor(expectedSpeed));
    });
  });

  describe("Points system", () => {
    it("Should calculate points correctly (5 per bought)", () => {
      const { points } = buildSecondaryAttributes(mockPrimary, {
        HP: { bought: 2 },
        Mana: { bought: 1 },
      });

      expect(points.HP).toBe(10);
      expect(points.Mana).toBe(5);
    });

    it("Should return 0 points when nothing is bought", () => {
      const { points } = buildSecondaryAttributes(mockPrimary);

      Object.entries(points).forEach(([key, p]) => {
        if (key === "Damage") return;
        expect(p).toBe(0);
      });
    });
  });

  describe("Structure integrity", () => {
    it("Should return attributes and points", () => {
      const result = buildSecondaryAttributes(mockPrimary);

      expect(result).toHaveProperty("attributes");
      expect(result).toHaveProperty("points");
    });

    it("Should return all expected secondary attributes", () => {
      const { attributes } = buildSecondaryAttributes(mockPrimary);

      expect(attributes).toHaveProperty("HP");
      expect(attributes).toHaveProperty("Mana");
      expect(attributes).toHaveProperty("Toxicity");
      expect(attributes).toHaveProperty("Will");
      expect(attributes).toHaveProperty("Vision");
      expect(attributes).toHaveProperty("Hearing");
      expect(attributes).toHaveProperty("Smell");
      expect(attributes).toHaveProperty("BasicSpeed");
      expect(attributes).toHaveProperty("Movement");
      expect(attributes).toHaveProperty("Dodge");
    });

    it("Each attribute should have base, bought, modifier, value", () => {
      const { attributes } = buildSecondaryAttributes(mockPrimary);

      Object.entries(attributes).forEach(([key, attr]) => {
        if (key === "Damage") return;

        expect(attr).toHaveProperty("base");
        expect(attr).toHaveProperty("bought");
        expect(attr).toHaveProperty("modifier");
        expect(attr).toHaveProperty("value");
      });
    });
  });
});
