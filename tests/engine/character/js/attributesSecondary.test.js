const {
  buildSecondaryAttributes,
} = require("engine/character/js/attributesSecondary");

const assertShape = require("tests/helpers/assertShape");
const assertNumericMap = require("tests/helpers/assertNumericMap");

describe("SECONDARY ATTRIBUTES", () => {
  const mockPrimary = {
    ST: { value: 10 },
    HT: { value: 12 },
    IQ: { value: 11 },
    DX: { value: 9 },
  };

  const mockCarryWeight = {
    weight_modifier: -3,
  };

  describe("Base calculations", () => {
    it("Should correctly calculate all base secondary attributes", () => {
      const { attributes } = buildSecondaryAttributes(
        mockPrimary,
        {},
        mockCarryWeight,
      );

      expect(attributes.HP.base_value).toBe(Math.floor((12 * 4 + 10 * 2) / 2));

      expect(attributes.Mana.base_value).toBe(
        Math.floor((11 * 4 + 12 * 2) / 2),
      );

      expect(attributes.Toxicity.base_value).toBe(
        Math.floor((12 * 4 + 10 * 2 + 11 * 2) / 3),
      );

      expect(attributes.Will.base_value).toBe(11);
      expect(attributes.Vision.base_value).toBe(11);
      expect(attributes.Hearing.base_value).toBe(11);
      expect(attributes.Smell.base_value).toBe(11);

      expect(attributes.BasicSpeed.base_value).toBe((12 + 9) / 4);

      expect(attributes.Movement.base_value).toBe(Math.floor(5.25 - 3));

      expect(attributes.Dodge.base_value).toBe(Math.floor(2 + (-3 + 4)));
    });
  });

  describe("Default behavior", () => {
    it("Should return base values when no config is provided", () => {
      const { attributes } = buildSecondaryAttributes(
        mockPrimary,
        {},
        mockCarryWeight,
      );

      Object.entries(attributes).forEach(([key, attr]) => {
        expect(attr.bought).toBe(0);
        expect(attr.modifier).toBe(0);
        expect(attr.value).toBe(attr.base_value);
      });
    });
  });

  describe("Bought values", () => {
    it("Should apply bought levels correctly", () => {
      const { attributes } = buildSecondaryAttributes(
        mockPrimary,
        {
          HP: { bought: 2 },
          Mana: { bought: 1 },
        },
        mockCarryWeight,
      );

      expect(attributes.HP.value).toBe(attributes.HP.base_value + 8);

      expect(attributes.Mana.value).toBe(attributes.Mana.base_value + 4);
    });

    it("Should clamp bought values to maxBought (default 5)", () => {
      const { attributes } = buildSecondaryAttributes(
        mockPrimary,
        {
          HP: { bought: 10 },
        },
        mockCarryWeight,
      );

      expect(attributes.HP.bought).toBe(5);

      expect(attributes.HP.value).toBe(attributes.HP.base_value + 20);
    });

    it("Should not allow negative bought values", () => {
      const { attributes } = buildSecondaryAttributes(
        mockPrimary,
        {
          HP: { bought: -3 },
        },
        mockCarryWeight,
      );

      expect(attributes.HP.bought).toBe(0);

      expect(attributes.HP.value).toBe(attributes.HP.base_value);
    });
  });

  describe("Modifiers", () => {
    it("Should apply modifiers correctly", () => {
      const { attributes } = buildSecondaryAttributes(
        mockPrimary,
        {
          HP: { modifier: 5 },
        },
        mockCarryWeight,
      );

      expect(attributes.HP.value).toBe(attributes.HP.base_value + 5);
    });

    it("Should combine bought and modifier", () => {
      const { attributes } = buildSecondaryAttributes(
        mockPrimary,
        {
          HP: { bought: 2, modifier: 3 },
        },
        mockCarryWeight,
      );

      expect(attributes.HP.value).toBe(attributes.HP.base_value + 8 + 3);
    });
  });

  describe("BasicSpeed special rule", () => {
    it("Should use step = 0.50 for BasicSpeed", () => {
      const { attributes } = buildSecondaryAttributes(
        mockPrimary,
        {
          BasicSpeed: { bought: 2 },
        },
        mockCarryWeight,
      );

      expect(attributes.BasicSpeed.value).toBe(
        attributes.BasicSpeed.base_value + 2 * 0.5,
      );
    });
  });

  describe("Movement", () => {
    it("Should decrease with carry weight penalties", () => {
      const { attributes } = buildSecondaryAttributes(
        mockPrimary,
        {},
        mockCarryWeight,
      );

      const expectedBase = Math.floor(5.25 - 3);

      expect(attributes.Movement.base_value).toBe(expectedBase);
    });

    it("Should increase if BasicSpeed is increased", () => {
      const { attributes } = buildSecondaryAttributes(
        mockPrimary,
        {
          BasicSpeed: { bought: 2 },
        },
        mockCarryWeight,
      );

      const expectedSpeed = 5.25 + 2 * 0.5;

      expect(attributes.Movement.base_value).toBe(
        Math.floor(expectedSpeed - 3),
      );
    });
  });

  describe("Dodge", () => {
    it("Should be affected by carry weight penalties", () => {
      const { attributes } = buildSecondaryAttributes(
        mockPrimary,
        {},
        mockCarryWeight,
      );

      const expectedMovement = Math.floor(5.25 - 3);

      const expectedDodge = Math.floor(expectedMovement + (-3 + 4));

      expect(attributes.Dodge.base_value).toBe(expectedDodge);
    });
  });

  describe("Points system", () => {
    it("Should calculate points correctly (5 per bought)", () => {
      const { points } = buildSecondaryAttributes(
        mockPrimary,
        {
          HP: { bought: 2 },
          Mana: { bought: 1 },
        },
        mockCarryWeight,
      );

      assertNumericMap(points);

      expect(points.HP).toBe(10);
      expect(points.Mana).toBe(5);
    });

    it("Should return 0 points when nothing is bought", () => {
      const { points } = buildSecondaryAttributes(
        mockPrimary,
        {},
        mockCarryWeight,
      );

      Object.entries(points).forEach(([key, p]) => {
        expect(p).toBe(0);
      });
    });
  });

  describe("Structure integrity", () => {
    it("Should return attributes, damage and points", () => {
      const result = buildSecondaryAttributes(mockPrimary, {}, mockCarryWeight);

      assertShape(result, ["attributes", "damage", "points"]);
    });

    it("Should return all expected secondary attributes", () => {
      const { attributes } = buildSecondaryAttributes(
        mockPrimary,
        {},
        mockCarryWeight,
      );

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

    it("Each attribute should have base_value, bought, modifier, value", () => {
      const { attributes } = buildSecondaryAttributes(
        mockPrimary,
        {},
        mockCarryWeight,
      );

      Object.entries(attributes).forEach(([key, attr]) => {
        expect(attr).toHaveProperty("base_value");
        expect(attr).toHaveProperty("bought");
        expect(attr).toHaveProperty("modifier");
        expect(attr).toHaveProperty("value");
        expect(attr).toHaveProperty("points");
      });
    });
  });
});
