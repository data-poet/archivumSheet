const {
  buildSecondaryAttributes,
} = require("engine/character/js/attributes/secondary");

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
    level: "heavy",
    move_factor: 0.4,
    dodge_penalty: -3,
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

      expect(attributes.Movement.base_value).toBe(Math.floor(5.25));
      expect(attributes.Movement.value).toBe(Math.floor(5 * 0.4));

      expect(attributes.Dodge.base_value).toBe(5 + 4 - 3);
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
        // Movement's value is the load-reduced Move; its base stays the unencumbered Basic Move.
        if (key !== "Movement") expect(attr.value).toBe(attr.base_value);
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
    it("Should multiply unencumbered Move by the load's move_factor (4e), keeping Basic Move as base", () => {
      const { attributes } = buildSecondaryAttributes(
        mockPrimary,
        {},
        mockCarryWeight,
      );

      expect(attributes.Movement.base_value).toBe(5);
      expect(attributes.Movement.value).toBe(Math.floor(5 * 0.4));
    });

    it("Should never drop below 1 while the load is within limits", () => {
      const { attributes } = buildSecondaryAttributes(
        mockPrimary,
        {},
        {
          level: "veryHeavy",
          move_factor: 0.2,
          dodge_penalty: -4,
        },
      );

      expect(attributes.Movement.value).toBe(1);
    });

    it("Should be 0 when overloaded", () => {
      const { attributes } = buildSecondaryAttributes(
        mockPrimary,
        {},
        {
          level: "overloaded",
          move_factor: 0,
          dodge_penalty: -4,
        },
      );

      expect(attributes.Movement.value).toBe(0);
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

      expect(attributes.Movement.base_value).toBe(Math.floor(expectedSpeed));
    });

    it("Should not allow bought levels (always 0)", () => {
      const { attributes } = buildSecondaryAttributes(
        mockPrimary,
        {
          Movement: { bought: 3 },
        },
        mockCarryWeight,
      );

      expect(attributes.Movement.bought).toBe(0);
      expect(attributes.Movement.final_base_value).toBe(
        attributes.Movement.base_value,
      );
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

  describe("final_base_value", () => {
    it("Should equal base_value when nothing is bought", () => {
      const { attributes } = buildSecondaryAttributes(
        mockPrimary,
        {},
        mockCarryWeight,
      );
      expect(attributes.HP.final_base_value).toBe(attributes.HP.base_value);
      expect(attributes.BasicSpeed.final_base_value).toBe(
        attributes.BasicSpeed.base_value,
      );
    });

    it("Should equal base_value + bought * step", () => {
      const { attributes } = buildSecondaryAttributes(
        mockPrimary,
        { HP: { bought: 2 }, BasicSpeed: { bought: 2 } },
        mockCarryWeight,
      );
      expect(attributes.HP.final_base_value).toBe(
        attributes.HP.base_value + 2 * 4,
      );
      expect(attributes.BasicSpeed.final_base_value).toBe(
        attributes.BasicSpeed.base_value + 2 * 0.5,
      );
    });

    it("value should equal final_base_value + modifier", () => {
      const { attributes } = buildSecondaryAttributes(
        mockPrimary,
        { HP: { bought: 1, modifier: -3 } },
        mockCarryWeight,
      );
      expect(attributes.HP.value).toBe(attributes.HP.final_base_value - 3);
    });
  });

  describe("HP < 1/3 rule — 4e halving of Move and Dodge", () => {
    function wounded(modifierFor) {
      const { attributes: full } = buildSecondaryAttributes(
        mockPrimary,
        {},
        mockCarryWeight,
      );
      const hpFinalBase = full.HP.final_base_value;
      const { attributes } = buildSecondaryAttributes(
        mockPrimary,
        { HP: { modifier: modifierFor(hpFinalBase) } },
        mockCarryWeight,
      );
      return { full, attributes, hpFinalBase };
    }

    const belowThird = (hpFinalBase) =>
      -(hpFinalBase - Math.floor(hpFinalBase / 3) + 1);

    it("Should leave Move and Dodge alone when HP is at full", () => {
      const { attributes } = buildSecondaryAttributes(
        mockPrimary,
        {},
        mockCarryWeight,
      );
      expect(attributes.Movement.value).toBe(
        Math.floor(attributes.Movement.base_value * 0.4),
      );
      expect(attributes.Dodge.value).toBe(attributes.Dodge.base_value);
    });

    it("Should halve current Move and Dodge (round up) when HP < final_base_value / 3", () => {
      const { full, attributes, hpFinalBase } = wounded(belowThird);

      expect(attributes.HP.value).toBeLessThan(hpFinalBase / 3);
      expect(attributes.Movement.value).toBe(
        Math.ceil(full.Movement.value / 2),
      );
      expect(attributes.Dodge.value).toBe(Math.ceil(full.Dodge.value / 2));
    });

    it("Should halve Dodge directly, not recompute it from the halved Move", () => {
      const { full, attributes } = wounded(belowThird);

      expect(attributes.Dodge.base_value).toBe(full.Dodge.base_value);
      expect(attributes.Dodge.value).not.toBe(attributes.Movement.value + 4);
    });

    it("Should never change Basic Speed", () => {
      const { full, attributes } = wounded(belowThird);

      expect(attributes.BasicSpeed.value).toBe(full.BasicSpeed.value);
    });

    it("Should NOT halve when HP is exactly at the 1/3 boundary (not below)", () => {
      const { full, attributes, hpFinalBase } = wounded(
        (base) => -(base - Math.ceil(base / 3)),
      );

      expect(attributes.HP.value).toBeGreaterThanOrEqual(hpFinalBase / 3);
      expect(attributes.Movement.value).toBe(full.Movement.value);
      expect(attributes.Dodge.value).toBe(full.Dodge.value);
    });
  });

  describe("FP (Pontos de Fadiga)", () => {
    it("Should start at HT and buy +1 per purchase, at most 5, for 5 points each", () => {
      const { attributes } = buildSecondaryAttributes(
        mockPrimary,
        { FP: { bought: 9 } },
        mockCarryWeight,
      );

      expect(attributes.FP.base_value).toBe(mockPrimary.HT.value);
      expect(attributes.FP.bought).toBe(5);
      expect(attributes.FP.final_base_value).toBe(mockPrimary.HT.value + 5);
      expect(attributes.FP.points).toBe(25);
    });

    it("Should halve current Move and Dodge (round up) when FP < final_base_value / 3", () => {
      const { attributes: full } = buildSecondaryAttributes(
        mockPrimary,
        {},
        mockCarryWeight,
      );
      const { attributes } = buildSecondaryAttributes(
        mockPrimary,
        { FP: { modifier: -9 } },
        mockCarryWeight,
      );

      expect(attributes.FP.value).toBeLessThan(
        attributes.FP.final_base_value / 3,
      );
      expect(attributes.Movement.value).toBe(
        Math.ceil(full.Movement.value / 2),
      );
      expect(attributes.Dodge.value).toBe(Math.ceil(full.Dodge.value / 2));
    });

    it("Should stack with low HP: both below 1/3 halve twice", () => {
      const { attributes: full } = buildSecondaryAttributes(
        mockPrimary,
        {},
        mockCarryWeight,
      );
      const { attributes } = buildSecondaryAttributes(
        mockPrimary,
        {
          FP: { modifier: -9 },
          HP: { modifier: -(full.HP.final_base_value - 1) },
        },
        mockCarryWeight,
      );

      const twice = (v) => Math.ceil(Math.ceil(v / 2) / 2);
      expect(attributes.Movement.value).toBe(twice(full.Movement.value));
      expect(attributes.Dodge.value).toBe(twice(full.Dodge.value));
    });
  });

  describe("max_modifier (vital max reduction)", () => {
    it("Should lower the value without changing the natural max", () => {
      const { attributes } = buildSecondaryAttributes(
        mockPrimary,
        { Mana: { max_modifier: -6, modifier: -2 } },
        mockCarryWeight,
      );

      expect(attributes.Mana.max_modifier).toBe(-6);
      expect(attributes.Mana.final_base_value).toBe(attributes.Mana.base_value);
      expect(attributes.Mana.value).toBe(attributes.Mana.base_value - 8);
    });

    it("Should default to 0", () => {
      const { attributes } = buildSecondaryAttributes(
        mockPrimary,
        {},
        mockCarryWeight,
      );
      expect(attributes.HP.max_modifier).toBe(0);
    });
  });

  describe("Dodge under load (4e)", () => {
    it("Should start from unencumbered Move + 4 and take the load's dodge_penalty", () => {
      const light = buildSecondaryAttributes(
        mockPrimary,
        {},
        {
          level: "light",
          move_factor: 0.8,
          dodge_penalty: -1,
        },
      ).attributes;
      const none = buildSecondaryAttributes(
        mockPrimary,
        {},
        {
          level: "none",
          move_factor: 1,
          dodge_penalty: 0,
        },
      ).attributes;

      expect(none.Dodge.value).toBe(none.Movement.value + 4);
      expect(light.Dodge.value).toBe(none.Dodge.value - 1);
      expect(light.Movement.value).toBe(Math.floor(none.Movement.value * 0.8));
    });
  });

  describe("Dodge is not buyable", () => {
    it("Should ignore stored purchases and cost no points", () => {
      const { attributes } = buildSecondaryAttributes(
        mockPrimary,
        { Dodge: { bought: 3 } },
        mockCarryWeight,
      );

      expect(attributes.Dodge.bought).toBe(0);
      expect(attributes.Dodge.points).toBe(0);
      expect(attributes.Dodge.final_base_value).toBe(
        attributes.Dodge.base_value,
      );
    });

    it("Should still apply the Dodge modifier and enchantment", () => {
      const { attributes } = buildSecondaryAttributes(
        mockPrimary,
        {
          Dodge: {
            modifier: 1,
            enchantment_modifier: 2,
            has_enchantment_modifier: true,
          },
        },
        mockCarryWeight,
      );

      expect(attributes.Dodge.value).toBe(attributes.Dodge.base_value + 3);
      expect(attributes.Dodge.has_enchantment_modifier).toBe(true);
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
      expect(attributes).toHaveProperty("FP");
      expect(attributes).toHaveProperty("Mana");
      expect(attributes).toHaveProperty("Toxicity");
      expect(attributes).toHaveProperty("Will");
      expect(attributes).toHaveProperty("Vision");
      expect(attributes).toHaveProperty("Hearing");
      expect(attributes).toHaveProperty("Smell");
      expect(attributes).toHaveProperty("BasicSpeed");
      expect(attributes).toHaveProperty("Movement");
      expect(attributes).toHaveProperty("Dodge");
      expect(attributes).toHaveProperty("DamageResistance");
    });

    it("Each attribute should have base_value, bought, modifier, value, final_base_value", () => {
      const { attributes } = buildSecondaryAttributes(
        mockPrimary,
        {},
        mockCarryWeight,
      );

      Object.entries(attributes).forEach(([key, attr]) => {
        expect(attr).toHaveProperty("base_value");
        expect(attr).toHaveProperty("bought");
        expect(attr).toHaveProperty("modifier");
        expect(attr).toHaveProperty("final_base_value");
        expect(attr).toHaveProperty("value");
        expect(attr).toHaveProperty("points");
      });
    });
  });
});
