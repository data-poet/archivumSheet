const {
  buildCharacterSecondary,
} = require("engine/character/buildCharacterSecondary");

const assertShape = require("tests/helpers/assertShape");

const assertNumericMap = require("tests/helpers/assertNumericMap");

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

      assertShape(result, [
        "secondary_attributes",
        "base_damage",
        "elemental_resistances",
        "skills",
        "character_points",
      ]);

      assertShape(result.character_points, ["secondary_attributes", "skills"]);
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
        "Dodge",
        "DamageResistance",
      ];

      expected.forEach((key) => {
        expect(secondary_attributes).toHaveProperty(key);
      });
    });

    it("Each attribute should have base_value, bought, modifier, value", () => {
      const { secondary_attributes } = buildCharacterSecondary({
        primary_attributes: mockPrimary,
      });

      Object.entries(secondary_attributes).forEach(([key, attr]) => {
        if (key === "Damage") return;

        expect(attr).toHaveProperty("base_value");

        expect(attr).toHaveProperty("bought");

        expect(attr).toHaveProperty("modifier");

        expect(attr).toHaveProperty("value");
      });
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

      assertNumericMap(points);
    });

    it("Should return 0 points when nothing is bought", () => {
      const { character_points } = buildCharacterSecondary({
        primary_attributes: mockPrimary,
      });

      Object.entries(character_points.secondary_attributes).forEach(
        ([key, points]) => {
          expect(typeof points).toBe("number");

          expect(points || 0).toBe(0);
        },
      );
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

  describe("Elemental resistances integration", () => {
    it("Defaults every element to race_base 1 when no race multipliers are given", () => {
      const { elemental_resistances } = buildCharacterSecondary({
        primary_attributes: mockPrimary,
      });

      expect(Object.keys(elemental_resistances)).toEqual([
        "Fire",
        "Water",
        "Air",
        "Electricity",
        "Earth",
        "Corrosion",
        "Necrotic",
        "Holy",
        "Void",
        "Arcane",
      ]);
      Object.values(elemental_resistances).forEach((entry) => {
        expect(entry.race_base).toBe(1);
        expect(entry.final).toBe(1);
      });
    });

    it("Threads raceElementalMultipliers through to race_base", () => {
      const { elemental_resistances } = buildCharacterSecondary({
        primary_attributes: mockPrimary,
        raceElementalMultipliers: { Fire: 0.5, Arcane: 1.5 },
      });

      expect(elemental_resistances.Fire.race_base).toBe(0.5);
      expect(elemental_resistances.Fire.final).toBe(0.5);
      expect(elemental_resistances.Arcane.race_base).toBe(1.5);
      expect(elemental_resistances.Water.race_base).toBe(1);
    });

    it("Applies the player-entered modifier from secondaryAttributes.elementalResistances", () => {
      const { elemental_resistances } = buildCharacterSecondary({
        primary_attributes: mockPrimary,
        raceElementalMultipliers: { Fire: 1 },
        secondaryAttributes: {
          elementalResistances: { Fire: { modifier: 0.3 } },
        },
      });

      expect(elemental_resistances.Fire.modifier).toBe(0.3);
      expect(elemental_resistances.Fire.final).toBeCloseTo(1.3);
    });

    it("Floors the final value at 0 rather than going negative", () => {
      const { elemental_resistances } = buildCharacterSecondary({
        primary_attributes: mockPrimary,
        raceElementalMultipliers: { Fire: 0.2 },
        secondaryAttributes: {
          elementalResistances: { Fire: { modifier: -5 } },
        },
      });

      expect(elemental_resistances.Fire.final).toBe(0);
    });

    it("Sets has_enchantment_modifier only for elements present in enchantmentElementalModifiers, mirroring the presence-based pattern used for secondary attributes", () => {
      const { elemental_resistances } = buildCharacterSecondary({
        primary_attributes: mockPrimary,
        enchantmentElementalModifiers: { Holy: 0 },
      });

      expect(elemental_resistances.Holy.has_enchantment_modifier).toBe(true);
      expect(elemental_resistances.Holy.enchantment_modifier).toBe(0);
      expect(elemental_resistances.Fire.has_enchantment_modifier).toBe(false);
    });

    it("Multiplies metaRaceElementalMultipliers into race_base alongside raceElementalMultipliers", () => {
      const { elemental_resistances } = buildCharacterSecondary({
        primary_attributes: mockPrimary,
        raceElementalMultipliers: { Holy: 1 },
        metaRaceElementalMultipliers: { Holy: 2, Necrotic: 0 },
      });

      expect(elemental_resistances.Holy.race_base).toBe(2);
      expect(elemental_resistances.Necrotic.race_base).toBe(0);
      expect(elemental_resistances.Fire.race_base).toBe(1);
    });
  });
});
